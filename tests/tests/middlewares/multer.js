// must support multer middleware
// Support for node 18
const {FormData, File} = require("formdata-node");

const express = require("express");
const multer = require("multer");

const app = express();
const upload = multer();

app.post('/abc', upload.none(), (req, res) => {
    res.send(req.body);
});

app.post('/file', upload.single('file'), (req, res) => {
    delete req.file.buffer;
    res.send(req.file);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const formData = new FormData();
    formData.append('abc', '123');

    const response = await fetch('http://localhost:13333/abc', {
        method: 'POST',
        body: formData
    });
    const text = await response.text();
    console.log(text);

    const formData2 = new FormData();
    const file = new File([1, 2, 3], 'test.txt');
    formData2.append('file', file);

    const response2 = await fetch('http://localhost:13333/file', {
        method: 'POST',
        body: formData2
    });
    const text2 = await response2.text();
    console.log(text2);

    const formData3 = new FormData();
    // 200kb
    const bigFile = new File(new Array(Math.floor(1024 * 1024 * 0.2)).fill(0), 'big.txt');
    formData3.append('file', bigFile);

    const response3 = await fetch('http://localhost:13333/file', {
        method: 'POST',
        body: formData3
    });
    console.log(response3.status);
    const text3 = await response3.text();
    console.log(text3);

    process.exit(0);

});