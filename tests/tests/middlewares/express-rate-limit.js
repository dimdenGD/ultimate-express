// must support express-rate-limit middleware

const express = require("express");
const { rateLimit } = require('express-rate-limit');

const app = express();

app.use(require("../../middleware"));

app.use(rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 1, 
    legacyHeaders: true,
    handler: (req, res, next) => {
        console.log('Too Many Requests called');
        res.status(429).send('Too Many Requests');
    }
}));

app.get('/abc', (req, res) => {
    res.send('Hello World');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/abc');
    console.log(await response.text());

    const response2 = await fetch('http://localhost:13333/abc');
    console.log(await response2.text(), response2.headers.get('X-RateLimit-Limit'), response2.headers.get('X-RateLimit-Remaining'));

    process.exit(0);

});