// must support text body parser

import express from "express";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.text());

app.post('/abc', (req, res) => {
    res.send(req.body);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/abc', {
        method: 'POST',
        body: 'abc',
    });

    const text = await response.text();
    console.log(text);

    process.exit(0);

});