// must support "strict routing"

const express = require("express");

const app = express();

app.use(require("../../middleware"));

const app2 = express();
app.set('strict routing', true);
app2.set('strict routing', false);

app.use((req, res, next) => {
    next();
});

app.get("/test/:test/", (req, res) => {
    res.send('test');
});

app.get('/abc/', (req, res) => {
    res.send('bye');
});

app.get('/abc', (req, res) => {
    res.send('hi');
});

app2.get('/abc/', (req, res) => {
    res.send('bye2');
});

app2.get('/abc', (req, res) => {
    res.send('hi2');
});

app2.use((req, res, next) => {
    res.send('404');
});

app.use((req, res, next) => {
    res.send('404');
});

app.listen(13333, async () => {

    console.log('Server is running on port 13333');

    let outputs = await Promise.all([
        fetch('http://localhost:13333/abc').then(res => res.text()),
        fetch('http://localhost:13333/abc/').then(res => res.text()),
        fetch('http://localhost:13333/abc/?test=1').then(res => res.text()),
        fetch('http://localhost:13333/test/test/').then(res => res.text()),
        fetch('http://localhost:13333/test/test').then(res => res.text()),
        fetch('http://localhost:13333/test/test/?test=1').then(res => res.text()),
    ]);


    console.log(outputs.join(' '));

    app2.listen(13334, async () => {
        console.log('Server is running on port 13334');

        let outputs2 = await Promise.all([
            fetch('http://localhost:13333/abc').then(res => res.text()),
            fetch('http://localhost:13333/abc/').then(res => res.text()),
            fetch('http://localhost:13333/abc/?test=1').then(res => res.text()),
            fetch('http://localhost:13333/test/test/').then(res => res.text()),
            fetch('http://localhost:13333/test/test').then(res => res.text()),
            fetch('http://localhost:13333/test/test/?test=1').then(res => res.text()),
        ]);

        console.log(outputs2.join(' '));
        process.exit(0);
    });

});