// must support setting and getting options

import express from "express";

const app = express();

app.set('case sensitive routing', true);
console.log(app.get('case sensitive routing'));

app.enable('x-powered-by');
console.log(app.enabled('x-powered-by'));

app.disable('x-powered-by');
console.log(app.enabled('x-powered-by'));

console.log(app.disabled('x-powered-by'));
