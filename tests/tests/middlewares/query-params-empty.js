// must support correct query & params without data

const express = require("express");

const app = express();

// app.use(require("../../middleware"));

app.use((req, res, next) => {
    console.log(req.query)
    console.log(req.params)
    next()
});

app.post('/abc', (req, res) => {
    res.send(req.body);
});

app.listen(13333, async () => {
    const response = await fetch('http://localhost:13333/abc', {
        method: 'POST',
        body: JSON.stringify({
            abc: 123
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    process.exit(0);

});