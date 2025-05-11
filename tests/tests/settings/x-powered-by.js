// must support "x-powered-by"

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
const app2 = express();
app.set('x-powered-by', true);
app2.set('x-powered-by', false);

app.get('/abc', (req, res) => {
    res.send('ok');
});

app2.get('/abc', (req, res) => {
    res.send('ok');
});

app.listen(13333, async () => {
    app2.listen(13334, async () => {

        let outputs = await Promise.all([
            fetchTest('http://localhost:13333/abc').then(res => res.headers.get('x-powered-by')),
            fetchTest('http://localhost:13334/abc').then(res => res.headers.get('x-powered-by')),
        ]);

        console.log(outputs.map(output => {
            console.log(typeof output);
        }));

        process.exit(0);
    });
});