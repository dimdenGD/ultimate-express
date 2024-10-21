const uWSSupertest = require('../uWSSupertest');
const express = require('u-express-local');
const app = express();

const after = require('after');

app.get('/hello', (req, res) => {
  res.status(200).send('Hello World!');
});

app.post('/hello', (req, res) => {
  res.status(200).send('Hello World!');
})

describe('GET /hello', () => {
  it('should respond with Hello World', function (done) {
    var cb = after(2, done)

    uWSSupertest(app)
      .get('/hello')
      .expect('Hello World!')
      .expect(200, cb);

      uWSSupertest(app)
      .post('/hello')
      .expect('Hello World!')
      .expect(200, cb);
  });
});
