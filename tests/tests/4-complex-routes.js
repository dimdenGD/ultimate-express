// must support complex routes

import express from "express";

const app = express();

app.get('/abc?d', (req, res) => {
    res.send('1');
});

app.get('/za*v', (req, res) => {
    res.send('2');
});

app.get('/g+t', (req, res) => {
    res.send('3');
});

app.get('/test(abc)?test', (req, res) => {
    res.send('4');
});

app.all('*', (req, res) => {
    res.send('5');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let outputs = await Promise.all([
        fetch('http://localhost:13333/abcd').then(res => res.text()),
        fetch('http://localhost:13333/abd').then(res => res.text()),
        fetch('http://localhost:13333/ad').then(res => res.text()),

        fetch('http://localhost:13333/zav').then(res => res.text()),
        fetch('http://localhost:13333/zaaaav').then(res => res.text()),
        fetch('http://localhost:13333/zv').then(res => res.text()),
        fetch('http://localhost:13333/zavv').then(res => res.text()),

        fetch('http://localhost:13333/t').then(res => res.text()),
        fetch('http://localhost:13333/gt').then(res => res.text()),
        fetch('http://localhost:13333/ggggt').then(res => res.text()),

        fetch('http://localhost:13333/testtest').then(res => res.text()),
        fetch('http://localhost:13333/testabctest').then(res => res.text()),
    ]);

    console.log(outputs.join(' '));
    process.exit(0);
});