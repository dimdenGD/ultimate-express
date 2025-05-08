// must support "json spaces"

const express = require("express");

const app = express();

app.use(require("../../middleware"));

const app2 = express();
app2.set('json spaces', 2);
app.get('/abc', (req, res) => {
    res.json({ test: { test: 1 } });
});

app.get('/def', (req, res) => {
    res.jsonp({ test: { test: 1 } });
});

app2.get('/abc', (req, res) => {
    res.json({ test: { test: 1 } });
});

app2.get('/def', (req, res) => {
    res.jsonp({ test: { test: 1 } });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let outputs = await Promise.all([
        fetch('http://localhost:13333/abc').then(res => res.text()),
    ]);

    console.log(outputs.join(' '));

    app2.listen(13334, async () => {
        console.log('Server is running on port 13334');

        let outputs2 = await Promise.all([
            fetch('http://localhost:13334/abc').then(res => res.text()),
        ]);

        console.log(outputs2.join(' '));
        process.exit(0);
    });

});