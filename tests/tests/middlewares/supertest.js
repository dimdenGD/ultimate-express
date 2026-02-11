// must support supertest

const express = require("express");
const request = require('supertest');

const app = express();

app.get('/user', function(req, res) {
  res.status(200).json({ name: 'john' });
});

request(app)
  .get('/user')
  .expect('Content-Type', /json/)
  .expect('Content-Length', '15')
  .expect(200)
  .end(function(err, res) {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    console.log(res.body); // { name: 'john' }
    process.exit(0);
  });