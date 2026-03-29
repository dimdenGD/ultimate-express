// must support server.address()

const express = require("express");

const app = express();

const server = app.listen(13333);

console.log(server.address().port === 13333);
process.exit(0);