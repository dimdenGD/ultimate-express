// must support setting and getting options

import express from "express";

const app = express();

app.set('case sensitive routing', true);
console.log(app.get('case sensitive routing'));
