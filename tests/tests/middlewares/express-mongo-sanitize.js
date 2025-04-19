// must support express-mongo-sanitize

const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");

const app = express();

app.use(mongoSanitize());

app.get('/abc', (req, res) => {
    console.log(req.headers);
    res.send('1');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/abc', {
        headers: {
            'X-ad.test': '123',
            "$test": '4',
            "X-aa.bb": '5',
            'X-test': '6',
        }
    });
    const text = await response.text();
    console.log(text);

    process.exit(0);

});