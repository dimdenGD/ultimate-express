// must support multiple middlewares
// Support for node 18
const {FormData, File}  = require( "formdata-node")

const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");

const app = express();

app.use(require("../../middleware"));


app.post('/abc', bodyParser.raw(), fileUpload(), (req, res) => {
    console.log(req.body, req.files);
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const formData = new FormData();
    console.log('creating file');
    const arr = [...new Array(1024 * 32)].map((_, i) => i % 256); // 32 KB
    const file = new File(arr, 'test.txt');
    console.log('appending file');
    formData.append('file', file);
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