// must support setting and getting options

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.set('case sensitive routing', true);
console.log(app.get('case sensitive routing'));

app.enable('x-powered-by');
console.log(app.enabled('x-powered-by'));

app.disable('x-powered-by');
console.log(app.enabled('x-powered-by'));

console.log(app.disabled('x-powered-by'));
