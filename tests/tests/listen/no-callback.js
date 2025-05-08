// must support listen with no callback

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.listen(13333);

setTimeout(() => {
    console.log('Server is running on port 13333');
    process.exit(0);
}, 500);
