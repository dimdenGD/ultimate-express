// must support params in use

const express = require("express");

const app = express();

app.use('/:id', (req, res) => {
    res.send(`id: ${req.params.id}`);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let outputs = await Promise.all([
        fetch('http://localhost:13333/123').then(res => res.text()),
    ]);

    console.log(outputs.join(' '));
    process.exit(0);
});