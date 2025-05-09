// must support "query parser"

const express = require("express");

const app = express();
// app.use(require("../../middleware"));

const app2 = express();
// app2.use(require("../../middleware"));

const app3 = express();
// app3.use(require("../../middleware"));

const app4 = express();
// app4.use(require("../../middleware"));

app.set('query parser', false);
app2.set('query parser', 'simple');
app3.set('query parser', 'extended');
app4.set('query parser', query => {
    return {hi: 'there'};
});

app.get('/abc', (req, res) => {
    res.json(req.query);
});
app2.get('/abc', (req, res) => {
    res.json(req.query);
});
app3.get('/abc', (req, res) => {
    res.json(req.query);
});
app4.get('/abc', (req, res) => {
    res.json(req.query);
});

app.listen(13333, async () => {
    app2.listen(13334, async () => {
        app3.listen(13335, async () => {
            app4.listen(13336, async () => {
                let outputs = await Promise.all([
                    fetch('http://localhost:13333/abc?test=123').then(res => res.text()),
                    fetch('http://localhost:13334/abc?test=123').then(res => res.text()),
                    fetch('http://localhost:13335/abc?test=123').then(res => res.text()),
                    fetch('http://localhost:13336/abc?test=123').then(res => res.text()),
                ]);
                console.log(outputs.join(' '));
                process.exit(0);
            });
        });
    });
});