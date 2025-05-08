// must support app.engine()

const express = require("express");

const app = express();

app.use(require("../../middleware")); 

app.engine('asdf', function test() {});

console.log(app.engines);
