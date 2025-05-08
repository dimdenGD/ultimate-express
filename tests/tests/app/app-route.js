// must support app.route()

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.get('/asdf', (req, res) => {
    res.send('asdf');
});

app.route('/test')
    .get((req, res) => {
        res.send('test1');
    })
    .post((req, res) => {
        res.send('test2');
    });

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let outputs = await Promise.all([
        fetch('http://localhost:13333/asdf').then(res => res.text()),
        fetch('http://localhost:13333/test').then(res => res.text()),
        fetch('http://localhost:13333/test', { method: 'POST' }).then(res => res.text()),
    ]);

    console.log(outputs.join(' '));
    process.exit(0);
});