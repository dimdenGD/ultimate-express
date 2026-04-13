const express = require('../src/index.js');
const compression = require('compression');
const app = express();

// force encoding by query param ?compress=
app.use((req, res, next) => {
  const enc = req.query.compress;
  if (enc) {
    req.headers['accept-encoding'] = enc;
  }
  next();
});

app.use(compression({ threshold: 1 }));
app.use(express.static('tests/parts'));

const PORT = 13335;
app.listen(PORT, () => {
  const base = `http://localhost:${PORT}`;
  const files = ['small-file.json', 'medium-file.json', 'large-file.json'];
  const encodings = ['gzip', 'br', 'deflate'];

  console.log(`\n  Server on ${base}\n`);
  console.log('  === Links ===\n');

  for (const file of files) {
    console.log(`  ${file}`);
    console.log(`     ${'identity'.padEnd(8)} : ${base}/${file}?compress=identity`);
    for (const enc of encodings) {
      console.log(`     ${enc.padEnd(8)} : ${base}/${file}?compress=${enc}`);
    }
    console.log();
  }
});
