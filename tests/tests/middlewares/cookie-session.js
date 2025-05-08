// must support cookie-session middleware

const express = require("express");
const cookieSession = require('cookie-session');

const app = express();

app.use(require("../../middleware"));

app.use(cookieSession({
    name: 'session',
    keys: ["test"],
  
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.get('/abc', (req, res) => {
    req.session.views = (req.session.views || 0) + 1;
    res.status(202).send(`Viewed ${req.session.views} times.`);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/abc');
    const sessionCookie = response.headers.get('Set-Cookie').match(/session=(.*?);/)[1];
    const sessionSig = response.headers.get('Set-Cookie').match(/session.sig=(.*?);/)[1];
    const text = await response.text();
    console.log(text, sessionCookie, sessionSig, response.status);

    const response2 = await fetch('http://localhost:13333/abc', {
        headers: {
            'Cookie': `session=${sessionCookie}; session.sig=${sessionSig}`
        }
    });
    const text2 = await response2.text();
    console.log(text2);

    process.exit(0);

});