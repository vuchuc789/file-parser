const { detect } = require('./index');

(async () => {
  console.log(await detect(process.argv[2]));
})();
