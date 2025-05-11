// must support param regex

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get('/test/:id(t\\d+t)', (req, res) => {
    res.send(`id: ${req.params.id}`);
});

app.use((req, res) => {
    res.status(404).send(`404`);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let outputs = await Promise.all([
        fetchTest('http://localhost:13333/test/').then(res => res.text()),
        fetchTest('http://localhost:13333/test/t123t').then(res => res.text()),
        fetchTest('http://localhost:13333/test/f').then(res => res.text()),
    ]);

    console.log(outputs.join(' '));
    process.exit(0);
});