// must support method-override middleware

const express = require("express");
const { fetchTest } = require("../../utils");
const methodOverride = require("method-override");

const app = express();

app.use(methodOverride('X-HTTP-Method-Override'));

app.post('/abc', (req, res) => {
    res.send(req.method+'1');
});

app.use((req, res, next) => {
    res.send(req.method+'2');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/abc', {
        method: 'GET',
        headers: {
            'X-HTTP-Method-Override': 'POST',
        },
    });

    const text = await response.text();
    console.log(text);

    process.exit(0);

});