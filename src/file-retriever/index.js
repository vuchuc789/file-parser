const http = require('http');
const https = require('https');
const path = require('path');
const { v4: uuid } = require('uuid');
const fs = require('fs');
const AWS = require('aws-sdk');

const defaultDownloadDir = '../../assets/';

function createRandDir(baseDir = path.resolve(__dirname, defaultDownloadDir)) {
  let name;
  let dir;

  do {
    name = `temp-${uuid()}`;
    dir = path.resolve(baseDir, name);
  } while (fs.existsSync(dir));

  fs.mkdirSync(dir, { recursive: true });

  return { name, dir };
}

/**
 * download file from http uri
 * @param {string} uri
 * @param {boolean} isHttps
 * @param {string} downloadDir
 * @returns {Promise<string>} downloaded file path
 */
function httpDownload(uri, isHttps = false, downloadDir) {
  return new Promise((resolve, reject) => {
    if (!uri) {
      reject(new Error('missing uri'));
      return;
    }

    const downloader = isHttps ? https : http;

    downloader.get(uri, (res) => {
      try {
        // status code differ from 200
        if (Math.floor(res.statusCode / 100) !== 2) {
          reject(new Error('request failure'));
          return;
        }

        const { name: tempName, dir: tempDir } = createRandDir(downloadDir);

        const matched = uri.match(/[\w.\-%]+\.[A-Za-z0-9]+/g);
        const filename =
          matched.length > 1
            ? decodeURIComponent(matched[matched.length - 1])
            : tempName;
        const filePath = path.resolve(tempDir, filename);

        const fileWritingStream = fs.createWriteStream(filePath);

        res.pipe(fileWritingStream);

        res.on('end', () => {
          resolve({ file: filePath, dir: tempDir });
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

function createS3Client(endpoint, accessKeyId, secretAccessKey) {
  if (
    !typeof endpoint === 'string' &&
    !typeof endpoint === 'string' &&
    !typeof endpoint === 'string'
  ) {
    throw new Error('missing argument');
  }

  return new AWS.S3({
    accessKeyId,
    secretAccessKey,
    endpoint,
    s3BucketEndpoint: true,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    httpOptions: {
      timeout: 90000,
    },
  });
}

/**
 * get file path from uri
 * @constructor
 * @param {string} uri
 * @param {object} options
 */
function FilePath(uri, options = {}) {
  if (!uri) {
    throw new Error('missing uri');
  }

  let absolutePath = uri;
  let dirPaths = [];
  let s3Client = null;

  /**
   * get file path
   * @returns {Promise<string>} path of file
   */
  this.get = async function get() {
    const { bucket, fileName } = options;
    if (bucket && fileName) {
      return await this.s3Get(bucket, fileName);
    }
    const matched = uri.match(/^https{0,1}:/g);

    if (Array.isArray(matched)) {
      switch (matched[0]) {
        case 'http:': {
          const { file, dir } = await httpDownload(
            uri,
            false,
            options.downloadDir
          );
          absolutePath = file;
          dirPaths.push(dir);
          break;
        }
        case 'https:': {
          const { file, dir } = await httpDownload(
            uri,
            true,
            options.downloadDir
          );
          absolutePath = file;
          dirPaths.push(dir);
          break;
        }
      }
    }

    return absolutePath;
  };

  this.connectS3 = function connectS3() {
    const endpoint = uri;
    const { accessKeyId, secretAccessKey } = options;

    if (
      typeof endpoint === 'string' &&
      typeof accessKeyId === 'string' &&
      typeof secretAccessKey === 'string'
    ) {
      s3Client =
        s3Client ?? createS3Client(endpoint, accessKeyId, secretAccessKey);
    }

    if (s3Client) {
      return true;
    }

    return false;
  };

  this.s3Get = function s3Get(bucket, fileName) {
    return new Promise((resolve, reject) => {
      if (!this.connectS3()) {
        reject(new Error('can not connect S3'));
        return;
      }

      if (typeof bucket === 'string' && typeof fileName === 'string') {
        try {
          s3Client.getObject(
            { Bucket: bucket, Key: fileName },
            function (err, data) {
              if (err) {
                reject(err);
                return;
              }

              const { dir: tempDir } = createRandDir(options.downloadDir);

              absolutePath = path.resolve(tempDir, fileName);
              dirPaths.push(tempDir);
              fs.writeFileSync(absolutePath, data.Body);

              resolve(absolutePath);
            }
          );
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('can not get path'));
      }
    });
  };

  this.s3ListFiles = function s3ListFiles(bucket = '') {
    return new Promise((resolve, reject) => {
      if (!this.connectS3()) {
        reject(new Error('can not connect S3'));
        return;
      }

      s3Client.listObjects(
        {
          Bucket: bucket,
          MaxKeys: 1000,
        },
        function (err, data) {
          if (err) {
            reject(err);
            return;
          }

          resolve(data?.Contents.map((val) => val?.Key));
        }
      );
    });
  };

  /**
   * delete file if downloaded
   */
  this.clear = function () {
    if (dirPaths.length > 0) {
      for (const dirPath of dirPaths) {
        fs.rmdirSync(dirPath, { recursive: true });
      }
    }
  };
}

module.exports = FilePath;
