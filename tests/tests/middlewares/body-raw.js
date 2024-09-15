// must support raw body parser

import express from "express";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.raw());

app.post('/abc', (req, res) => {
    res.send(req.body);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');
    const ab = new ArrayBuffer(10);
    const u8 = new Uint8Array(ab);
    u8[0] = 1;
    u8[1] = 2;
    u8[2] = 3;
    u8[3] = 4;
    u8[4] = 5;
    u8[5] = 6;
    u8[6] = 7;
    u8[7] = 8;
    u8[8] = 9;

    const response = await fetch('http://localhost:13333/abc', {
        method: 'POST',
        body: ab,
        headers: {
            'Content-Type': 'application/octet-stream'
        }
    });

    const text = await response.text();
    console.log(text);

    process.exit(0);

});