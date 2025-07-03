// must not modify body if it doesnt match the type

const express = require("express");

const app = express();

app.use((req, res, next) => {
    req.body = 'test';
    next();
});

app.post('/json', express.json(), (req, res) => {
    res.send(req.body);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/json', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        }
    });
    const text = await response.text();
    console.log(text);

    process.exit(0);

});