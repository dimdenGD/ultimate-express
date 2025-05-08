// must support response-time middleware

const express = require("express");
const responseTime = require("response-time");

const app = express();

app.use(require("../../middleware"));

app.use(responseTime((req, res, time) => {
    console.log(typeof time);
}));

app.post('/abc', (req, res) => {
    res.send('1');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/abc', {
        method: 'POST',
        body: 'abc',
    });

    const text = await response.text();
    console.log(text);

    process.exit(0);

});