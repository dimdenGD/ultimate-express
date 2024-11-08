// must support multer middleware

const express = require("express");
const multer = require("multer");
const FormData = require("form-data");

const app = express();
const upload = multer();

app.post('/abc', upload.none(), (req, res) => {
    res.send(req.body);
});

app.post('/file', upload.single('file'), (req, res) => {
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
    const fileBuffer = Buffer.from([1, 2, 3]);
    formData2.append('file', fileBuffer, 'test.txt');

    const response2 = await fetch('http://localhost:13333/file', {
        method: 'POST',
        body: formData2
    });
    const text2 = await response2.text();
    console.log(text2);

    process.exit(0);

});