// must support "etag"

const express = require("express");

const app = express();

app.use(require("../../middleware"));

const app2 = express();
const app3 = express();
app.set('etag', false);
app2.set('etag', true);
app3.set('etag', 'strong');

app.get('/abc', (req, res) => {
    res.send('abc');
});

app2.get('/abc', (req, res) => {
    res.send('abc');
});

app3.get('/abc', (req, res) => {
    res.send('abc');
});

app.listen(13333, async () => {
    app2.listen(13334, async () => {
        app3.listen(13335, async () => {
            const outputs = await Promise.all([
                fetch('http://localhost:13333/abc'),
                fetch('http://localhost:13334/abc'),
                fetch('http://localhost:13335/abc'),
            ]);
            console.log(outputs.map(res => res.headers.get('etag')));
            process.exit(0);
        });
    });
});