// must support empty json body parser

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.set('body methods', 'DELETE');

app.use(express.json());

app.delete('/abc', (req, res) => {
    res.send(req.body);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/abc', {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'DELETE'
    });
    const text = await response.text();
    console.log(text);

    process.exit(0);

});