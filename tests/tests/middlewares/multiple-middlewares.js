// must support multiple middlewares

const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const FormData = require("form-data");

const app = express();


app.post('/abc', bodyParser.raw(), fileUpload(), (req, res) => {
    console.log(req.body, req.files);
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const formData = new FormData();
    console.log('creating file');
    // Create a buffer for the file (32 KB of data)
    const buffer = Buffer.from([...new Array(1024 * 32)].map((_, i) => i % 256));
    const fileBlob = new Blob([buffer], { type: 'text/plain' });

    console.log('appending file');
    formData.append('file', fileBlob, 'test.txt');
    formData.append('text', 'hello');
    console.log('sending request');

    const response = await fetch('http://localhost:13333/abc', {
        method: 'POST',
        body: formData
    });
    console.log('reading response');
    const text = await response.text();
    console.log(text);

    process.exit(0);

});