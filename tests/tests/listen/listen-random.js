// must open random port

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.listen(() => {
    console.log('Server is running on random port');

    process.exit(0);
});