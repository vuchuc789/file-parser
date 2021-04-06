const extractor = require('./file-feature-extractor');

require('dotenv').config();

const { ENDPOINT, ACCESS_KEY_ID, SECRET_ACCESS_KEY } = process.env;

//extractor
//.fileFeatureExtract(...process.argv.slice(2 - process.argv.length))
//.then((feature) => {
//console.log(feature);
//})
//.catch((err) => {
//console.log(err);
//});

//extractor
//.fileFeatureExtract(
//"https://filesamples.com/samples/document/txt/sample3.txt"
//)
//.then((feature) => {
//console.log(feature);
//})
//.catch((err) => {
//console.log(err);
//});

//extractor
//.fileFeatureExtract(ENDPOINT, {
//accessKeyId: ACCESS_KEY_ID,
//secretAccessKey: SECRET_ACCESS_KEY,
//bucket: "wi-test-can-delete",
//fileName: "abc.txt",
//})
//.then((result) => {
//console.log(result);
//})
//.catch((e) => {
//console.error(e);
//});

extractor
  .s3FilesFeatureExtract(ENDPOINT, {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    bucket: 'wi-test-can-delete',
  })
  .then((result) => {
    console.log(result);
  })
  .catch((e) => {
    console.error(e);
  });
