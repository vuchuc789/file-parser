const fs = require('fs');
const path = require('path');
const ExifTool = require('exiftool-vendored').ExifTool;
const { detect, standardMimes } = require('./src/mimetype-utils');
const PDFParser = require('pdf2json');
const textract = require('textract');
const wordExtract = require('@lambda121/word-extractor');
const xlsx = require('node-xlsx');
const { htmlToText } = require('html-to-text');
const FilePath = require('./src/file-retriever');

// helpers

Object.prototype.subobj =
  Object.prototype.subobj ||
  function subobj(...props) {
    const subObject = {};

    for (const prop of props) {
      if (typeof prop === 'string' && this[prop]) {
        subObject[prop] = this[prop];
      }
    }

    return subObject;
  };

// main program

function readTextContent(filePath) {
  try {
    let buffer = fs.readFileSync(filePath);

    return Promise.resolve({ data: buffer.toString('utf-8') });
  } catch (e) {
    return Promise.reject(e);
  }
}

function readImageExif(imagePath) {
  return new Promise((resolve, reject) => {
    const exiftool = new ExifTool();

    exiftool
      .read(imagePath)
      .then((exifData) => {
        exiftool.end();

        const resultExif = exifData.subobj(
          'FileType',
          'FileTypeExtension',
          'MIMEType',
          'XResolution',
          'YResolution',
          'ImageWidth',
          'ImageHeight',
          'EncodingProcess',
          'BitsPerSample',
          'ColorComponents',
          'ImageSize',
          'Megapixels'
        );

        resolve({ exifData: resultExif });
      })
      .catch((e) => {
        reject(e);
      });
  });
}

function readPdfContent(filePath) {
  return new Promise((resolve, reject) => {
    let pdfParser = new PDFParser(this, 1);

    pdfParser.loadPDF(filePath);

    pdfParser.on('pdfParser_dataError', (errData) => reject(errData));
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      resolve({
        data: pdfParser.getRawTextContent(),
        numOfPages: pdfData?.formImage?.Pages?.length,
      });
    });
  });
}

function readDocContent(filePath) {
  return new Promise((resolve, reject) => {
    wordExtract
      .fromFile(filePath)
      .then((doc) => {
        resolve({ data: doc.getBody() });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function readDocContent(filePath) {
  return new Promise((resolve, reject) => {
    textract.fromFileWithPath(
      filePath,
      { preserveOnlyMultipleLineBreaks: true },
      (err, text) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({ data: text });
      }
    );
  });
}

function readXlsxContent(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const excelData = xlsx.parse(filePath);
      const excelCsv = [];
      let numOfSheets = 0;

      for (const sheet of excelData) {
        let sheetCsv = '';

        for (const row of sheet['data']) {
          sheetCsv += row.join(',') + '\n';
        }

        numOfSheets++;
        excelCsv.push(sheetCsv);
      }

      resolve({ data: excelCsv, numOfSheets });
    } catch (error) {
      reject(error);
    }
  });
}

function readHtmlContent(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const html = fs.readFileSync(filePath).toString();
      const text = htmlToText(html);

      resolve({ data: text });
    } catch (error) {
      reject(error);
    }
  });
}

async function readContent(filePath, mimetype) {
  const {
    txt,
    doc,
    docx,
    jpeg,
    png,
    pdf,
    odt,
    xls,
    xlsx,
    pptx,
    html,
  } = standardMimes;

  mimetype = mimetype || (await detect(filePath));

  switch (mimetype) {
    case txt:
      return await readTextContent(filePath);
    case jpeg:
    case png:
      return await readImageExif(filePath);
    case pdf:
      return await readPdfContent(filePath);
    case doc:
    case docx:
    case odt:
    case pptx:
      return await readDocContent(filePath);
    case xls:
    case xlsx:
      return await readXlsxContent(filePath);
    case html:
      return await readHtmlContent(filePath);
    default:
      throw new Error('mimetype not found');
  }
}

async function metadataExtract(filePath, mimetype) {
  if (!filePath) {
    throw new Error('missing file path');
  }

  let resultObj = {};

  // get filename from filePath
  let filePathProps = path.parse(filePath);
  resultObj.base = filePathProps.base;
  resultObj.name = filePathProps.name;
  resultObj.ext = filePathProps.ext;

  // get metadata using fs.stat
  const metadataObj = fs.statSync(filePath);

  const myMetadataObj = metadataObj.subobj(
    'size',
    'atime',
    'mtime',
    'ctime',
    'birthtime'
  );

  resultObj = { ...resultObj, ...myMetadataObj };

  mimetype = mimetype || (await detect(filePath));
  resultObj.mimetype = mimetype;
  // read file content and build content structure
  resultObj.content = await readContent(filePath, mimetype);

  return resultObj;
}

async function fileFeatureExtract(
  uri,
  options = {},
  acceptAbsolutePath = false
) {
  if (!uri) {
    throw new Error('missing uri');
  }

  const filePathObj = new FilePath(uri, options);
  const filePath = await filePathObj.get();
  if (!acceptAbsolutePath && filePath === uri) {
    throw new Error('absolute path is denied');
  }

  const feature = await metadataExtract(filePath);

  filePathObj.clear();

  return feature;
}

async function s3FilesFeatureExtract(uri, options = {}) {
  if (!uri) {
    throw new Error('missing uri');
  }

  const filePath = new FilePath(uri, options);

  const listFileNames = await filePath.s3ListFiles(options?.bucket);

  let promises = listFileNames.map(
    async (val) => await filePath.s3Get(options?.bucket, val)
  );

  const listFilePaths = await Promise.all(promises);

  promises = listFilePaths.map(async (val) => await metadataExtract(val));

  const fileFeatures = await Promise.all(promises);

  filePath.clear();

  return fileFeatures;
}

module.exports = {
  fileFeatureExtract,
  s3FilesFeatureExtract,
};
