// must support "json replacer"

const express = require("express");

const app = express();
const app2 = express();
app2.set('json replacer', (key, value) => {
    if(typeof value === 'object' && value !== null) {
        return 'REPLACED';
    }
    return value;
});
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

    let outputs = [
        await fetch('http://localhost:13333/abc'),
        await fetch('http://localhost:13333/def'),
    ];

    console.log(outputs.map(output => output.headers.get('content-type')));
    console.log((await Promise.all(outputs.map((output) => output.text()))).join(' '));

    app2.listen(13334, async () => {
        console.log('Server is running on port 13334');

        let outputs2 = [
            await fetch('http://localhost:13334/abc'),
            await fetch('http://localhost:13334/def'),
        ];

        console.log(outputs2.map(output => output.headers.get('content-type')));
        console.log((await Promise.all(outputs2.map((output) => output.text()))).join(' '));
        
        process.exit(0);
    });

});