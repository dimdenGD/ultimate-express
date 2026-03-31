// Test res.cookie() with all options (maxAge, expires, httpOnly, secure, sameSite, domain, path, signed)

const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser('my-secret-key'));

app.get('/maxage', (req, res) => {
    res.cookie('maxage_cookie', 'value1', { maxAge: 3600000 }); // 1 hour
    res.send('ok');
});


app.get('/expires', (req, res) => {
    const expiresDate = new Date('2030-01-01T00:00:00.000Z');
    res.cookie('expires_cookie', 'value2', { expires: expiresDate });
    res.send('ok');
});

app.get('/httponly', (req, res) => {
    res.cookie('httponly_true', 'value3', { httpOnly: true });
    res.cookie('httponly_false', 'value4', { httpOnly: false });
    res.send('ok');
});

app.get('/secure', (req, res) => {
    res.cookie('secure_true', 'value5', { secure: true });
    res.cookie('secure_false', 'value6', { secure: false });
    res.send('ok');
});

app.get('/samesite', (req, res) => {
    res.cookie('samesite_strict', 'value7', { sameSite: 'strict' });
    res.cookie('samesite_lax', 'value8', { sameSite: 'lax' });
    res.cookie('samesite_none', 'value9', { sameSite: 'none', secure: true }); // none requires secure
    res.cookie('samesite_true', 'value10', { sameSite: true }); // true defaults to strict
    res.cookie('samesite_false', 'value11', { sameSite: false });
    res.send('ok');
});

app.get('/domain', (req, res) => {
    res.cookie('domain_cookie', 'value12', { domain: 'localhost' });
    res.send('ok');
});

app.get('/path', (req, res) => {
    res.cookie('path_root', 'value13', { path: '/' });
    res.cookie('path_custom', 'value14', { path: '/custom/path' });
    res.send('ok');
});

app.get('/signed', (req, res) => {
    res.cookie('signed_cookie', 'value15', { signed: true });
    res.cookie('unsigned_cookie', 'value16', { signed: false });
    res.send('ok');
});

app.get('/combined', (req, res) => {
    res.cookie('combined_cookie', 'value17', {
        maxAge: 7200000, // 2 hours
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api'
    });
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    // Test maxAge
    const maxageRes = await fetch('http://localhost:13333/maxage');
    console.log('maxAge:', maxageRes.headers.get('Set-Cookie').replace(/\d\d\:\d\d\:\d\d/g, 'xx:xx:xx'));

    // Test expires
    const expiresRes = await fetch('http://localhost:13333/expires');
    console.log('expires:', expiresRes.headers.get('Set-Cookie'));

    // Test httpOnly
    const httponlyRes = await fetch('http://localhost:13333/httponly');
    console.log('httpOnly:', httponlyRes.headers.get('Set-Cookie'));

    // Test secure
    const secureRes = await fetch('http://localhost:13333/secure');
    console.log('secure:', secureRes.headers.get('Set-Cookie'));

    // Test sameSite
    const samesiteRes = await fetch('http://localhost:13333/samesite');
    console.log('sameSite:', samesiteRes.headers.get('Set-Cookie'));

    // Test domain
    const domainRes = await fetch('http://localhost:13333/domain');
    console.log('domain:', domainRes.headers.get('Set-Cookie'));

    // Test path
    const pathRes = await fetch('http://localhost:13333/path');
    console.log('path:', pathRes.headers.get('Set-Cookie'));

    // Test signed
    const signedRes = await fetch('http://localhost:13333/signed');
    console.log('signed:', signedRes.headers.get('Set-Cookie'));

    // Test combined options
    const combinedRes = await fetch('http://localhost:13333/combined');
    console.log('combined:', combinedRes.headers.get('Set-Cookie').replace(/\d\d\:\d\d\:\d\d/g, 'xx:xx:xx'));

    process.exit(0);
});
