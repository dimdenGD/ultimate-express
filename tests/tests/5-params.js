// must support params

import express from "express";

const app = express();

app.get('/:id', (req, res) => {
    res.send(`id: ${req.params.id}`);
});

app.get('/:id/test', (req, res) => {
    res.send(`testid: ${req.params.id}`);
});

app.get('/:id/test/:testid', (req, res) => {
    res.send(`id: ${req.params.id} testid: ${req.params.testid}`);
});

app.get('/:id/test/:testid/testy', (req, res) => {
    res.send(`id: ${req.params.id} testid: ${req.params.testid}`);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let outputs = await Promise.all([
        fetch('http://localhost:13333/123').then(res => res.text()),
        fetch('http://localhost:13333/456/test').then(res => res.text()),
        fetch('http://localhost:13333/789/test/123').then(res => res.text()),
        fetch('http://localhost:13333/456/test/789/testy').then(res => res.text()),
    ]);

    console.log(outputs.join(' '));
    process.exit(0);
});