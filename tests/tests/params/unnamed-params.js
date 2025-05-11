// must support unnamed params

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get('/test/*', (req, res) => {
    res.send(req.params);
});

app.get('/tes*t', (req, res) => {
    res.send(req.params);
});

app.get('/toas+t', (req, res) => {
    res.send(req.params);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let outputs = await Promise.all([
        fetchTest('http://localhost:13333/test/123').then(res => res.text()),
        fetchTest('http://localhost:13333/tessst').then(res => res.text()),
        fetchTest('http://localhost:13333/toasssssssst').then(res => res.text()),
    ]);

    console.log(outputs.join(' '));
    process.exit(0);
});