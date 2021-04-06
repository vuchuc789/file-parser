const FilePath = require('./index');

(async () => {
  const filePath = new FilePath(
    'https://filesamples.com/samples/document/txt/sample3.txt'
  );
  console.log(await filePath.get());
})();

// async () => {
//   const filePath = new FilePath('http://fit.revotech.com.vn:30090', {
//     accessKeyId: '',
//     secretAccessKey: '',
//   });

//   console.log(filePath.s3Get('wi-test-can-delete', 'test.js'));
// };
