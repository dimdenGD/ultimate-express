// must support express-fileupload middleware

const express = require("express");
const fileUpload = require("express-fileupload");
const FormData = require("form-data");

const app = express();

app.post('/file', fileUpload(), (req, res) => {
    res.send(req.files);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const formData = new FormData();
    const fileBuffer = Buffer.from([1, 2, 3]);
    formData.append('file', fileBuffer, 'test.txt');

    const response = await fetch('http://localhost:13333/file', {
        method: 'POST',
        body: formData
    });
    const text = await response.text();
    console.log(text);

    process.exit(0);

});