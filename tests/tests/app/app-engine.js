// must support app.engine()

import express from "express";

const app = express();
app.engine('asdf', function test() {});

console.log(app.engines);
