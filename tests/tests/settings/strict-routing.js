// must support "strict routing"

const express = require("express");

const app = express();
const app2 = express();
app.set('strict routing', true);
app2.set('strict routing', false);

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
        fetch('http://localhost:13333/test/test/').then(res => res.text()),
        fetch('http://localhost:13333/test/test').then(res => res.text()),
    ]);


    console.log(outputs.join(' '));

    app2.listen(13334, async () => {
        console.log('Server is running on port 13334');

        let outputs2 = await Promise.all([
            fetch('http://localhost:13334/abc').then(res => res.text()),
            fetch('http://localhost:13334/abc/').then(res => res.text()),
        ]);

        console.log(outputs2.join(' '));
        process.exit(0);
    });

});