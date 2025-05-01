// must support res.connection

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    console.log(res.writableFinished);
    console.log(res.connection.writable);
    res.end();
    console.log(res.writableFinished);
    // console.log(res.connection.writable); on express is false on ultimate true
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(await response.text());

    process.exit(0);
});