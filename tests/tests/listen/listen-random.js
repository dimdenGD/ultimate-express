// must open random port

import express from "express";

const app = express();

app.listen(() => {
    console.log('Server is running on random port');

    process.exit(0);
});