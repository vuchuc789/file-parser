const FileType = require('file-type');
const MIME = require('mime-types');
const mmm = require('mmmagic');

const Magic = mmm.Magic;

function magicDetect(fileUri) {
  return new Promise((resolve, reject) => {
    const magic = new Magic(mmm.MAGIC_MIME_TYPE);

    magic.detectFile(fileUri, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(result);
    });
  });
}

/**
 * detect mime type
 * @param {string} fileUri
 * @returns {Promise<string>} - mime type
 */
async function detect(fileUri) {
  if (!fileUri) {
    return false;
  }

  const uncommonMimes = ['application/x-cfb'];

  // for non text-based file
  let mimetype = await FileType.fromFile(fileUri);
  mimetype = mimetype && mimetype.mime;

  if (uncommonMimes.includes(mimetype)) {
    mimetype = undefined;
  }

  // using magic
  mimetype = mimetype || (await magicDetect(fileUri));

  // using extension
  mimetype = mimetype || MIME.lookup(fileUri);

  if (!mimetype) {
    return false;
  }

  return mimetype;
}

// list of standard mime types
const standardMimes = {
  txt: 'text/plain',
  jpeg: 'image/jpeg',
  png: 'image/png',
  doc: 'application/msword',
  docx:
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  odt: 'application/vnd.oasis.opendocument.text',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx:
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  html: 'text/html',
};

module.exports = {
  detect,
  standardMimes,
};
