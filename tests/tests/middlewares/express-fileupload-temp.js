// must support express-fileupload middleware with temp file
// Support for node 18
const { File } = require('file-api');
const FormData = require('form-data');

const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");

const app = express();

app.post('/file', fileUpload({
    tempFileDir: './tmp',
    useTempFiles: true,
    debug: false
}), (req, res) => {
    req.files.file.mv('./tmp/test.txt');
    res.send(req.files.file.size.toString());
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const formData = new FormData();
    console.log('creating file');
    const arr = new Uint8Array(1024 * 128); // 128 KB
    console.log('filling file');
    for (let i = 0; i < arr.length; i++) {
        arr[i] = i % 256;
    }
    console.log('appending file');
    const file = new File({buffer: Buffer.from(arr), name: 'test.txt'});
    formData.append('file', file);

    console.log('sending request');
    const response = await fetch('http://localhost:13333/file', {
        method: 'POST',
        body: formData
    });
    console.log('response', response.status);
    const text = await response.text();
    console.log(text);

    console.log('temp file', fs.statSync('./tmp/test.txt').size);
    fs.rmSync('./tmp', { recursive: true, force: true });

    process.exit(0);

});