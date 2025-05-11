// must support json body parser with large body

const express = require("express");
const { fetchTest } = require("../../utils");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json({ limit: '10mb' }));

app.post('/abc', (req, res) => {
    res.send({ result: req.body?.items?.length });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/abc', {
        method: 'POST',
        body: JSON.stringify({ items: Array(100_000).fill().map((_, i) => i + 1) }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const text = await response.text();
    console.log(text);

    process.exit(0);

});