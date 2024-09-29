// must support express.json deflate

const express = require("express");
const { deflate } = require("pako");

const app = express();
app.use(express.json());

app.post('/abc', (req, res) => {
    res.send(req.body);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const def = await deflate(JSON.stringify({ a: 1, b: 2 }));

    console.log(def);

    const response = await fetch('http://localhost:13333/abc', {
        method: 'POST',
        body: def,
        headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'deflate'
        }
    });

    const text = await response.text();
    console.log(text);

    process.exit(0);

});