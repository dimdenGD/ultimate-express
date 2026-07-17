// v5 res.clearCookie must ignore maxAge and expires options
// SKIP_V4: Express 5 ignores maxAge/expires in clearCookie

const express = require("express");

const app = express({ version: 5 });

app.get('/test', (req, res) => {
    res.clearCookie('session', { path: '/', maxAge: 3600, expires: new Date('2030-01-01') });
    const setCookie = res.get('Set-Cookie');
    res.send(setCookie);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test').then(res => res.text());
    console.log(response);
    process.exit(0);
});
