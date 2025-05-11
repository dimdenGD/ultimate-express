// must support "case sensitive routing"

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
const app2 = express();
app.set('case sensitive routing', true);
app2.set('case sensitive routing', false);

app.get('/abc', (req, res) => {
    res.send('hi');
});

app.get('/Abc', (req, res) => {
    res.send('bye');
});

app2.get('/abc', (req, res) => {
    res.send('hi2');
});

app2.get('/Abc', (req, res) => {
    res.send('bye2');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let outputs = await Promise.all([
        fetchTest('http://localhost:13333/abc').then(res => res.text()),
        fetchTest('http://localhost:13333/Abc').then(res => res.text()),
    ]);

    console.log(outputs.join(' '));

    app2.listen(13334, async () => {
        console.log('Server is running on port 13334');

        let outputs2 = await Promise.all([
            fetchTest('http://localhost:13334/abc').then(res => res.text()),
            fetchTest('http://localhost:13334/Abc').then(res => res.text()),
        ]);

        console.log(outputs2.join(' '));
        process.exit(0);
    });

});