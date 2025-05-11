// must open random port

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.listen(() => {
    console.log('Server is running on random port');

    process.exit(0);
});