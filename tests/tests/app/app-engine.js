// must support app.engine()

const express = require("express");

const app = express();
app.engine('asdf', function test() {});

console.log(app.engines);
