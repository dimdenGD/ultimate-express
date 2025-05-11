// must support express.json()

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.post('/abc', express.json(), (req, res) => {
    res.send(req.body);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/abc', {
        method: 'POST',
        body: JSON.stringify({
            abc: 123
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const text = await response.text();
    console.log(text);

    process.exit(0);

});