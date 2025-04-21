// must support cookie parser with signed cookies

const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser('secret'));

app.get('/abc', (req, res) => {
    res.cookie('abc', '123', { signed: true });
    res.cookie('def', { count: 345 }, { signed: true });
    res.send('ok');
});

app.get('/def', (req, res) => {
    console.log(req.signedCookies, req.headers.cookie);
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const cookie = await fetch('http://localhost:13333/abc').then(res => res.headers.get('Set-Cookie'));
    console.log(cookie);
    await fetch('http://localhost:13333/def', {
        headers: {
            'Cookie': cookie.split('; ')[0]
        }
    }).then(res => res.text());
    process.exit(0);
});