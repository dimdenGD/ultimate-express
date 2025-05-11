// must support app.engine()

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
app.engine('asdf', function test() {});

console.log(app.engines);
