// must support express-session middleware

const express = require("express");
const session = require('express-session');

const app = express();

app.use(require("../../middleware"));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

app.get('/abc', (req, res) => {
    req.session.views = (req.session.views || 0) + 1;
    res.status(202).send(`Viewed ${req.session.views} times.`);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/abc');
    const cookie = response.headers.get('Set-Cookie').match(/connect.sid=(.*?);/)[1];
    const text = await response.text();
    console.log(text, response.status);

    const response2 = await fetch('http://localhost:13333/abc', {
        headers: {
            'Cookie': `connect.sid=${cookie}`
        }
    });
    const text2 = await response2.text();
    console.log(text2);

    process.exit(0);

});