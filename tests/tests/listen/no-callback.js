// must support listen with no callback

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.listen(13333);

setTimeout(() => {
    console.log('Server is running on port 13333');
    process.exit(0);
}, 500);
