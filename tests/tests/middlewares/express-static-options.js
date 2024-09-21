// must support express.static() options

const express = require("express");

const app = express();

app.post('/abc', (req, res) => {
    res.send('ok');
});
app.use('/static', express.static('tests/parts'));
app.use('/static2', express.static('tests/parts', { redirect: false }));
app.use('/static3', express.static('tests/parts', { index: 'index.pug' }));
app.use('/static4', express.static('tests/parts', { dotfiles: 'allow' }));
app.use('/static5', express.static('tests/parts', { dotfiles: 'deny' }));
app.use('/static6', express.static('tests/parts', { dotfiles: 'ignore' }));
app.use('/static7', express.static('tests/parts', { fallthrough: false }));
app.use('/static8', express.static('tests/parts', { etag: false }));

app.use((err, req, res, next) => {
    res.status(500).send(err);
});

app.use((req, res, next) => {

    res.status(404).send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/static', { redirect: 'manual' });
    console.log(response.status, response.headers.get('Location'));

    const response2 = await fetch('http://localhost:13333/static2', { redirect: 'manual' });
    console.log(response2.status, response2.headers.get('Location'));

    const response3 = await fetch('http://localhost:13333/static3');
    console.log(response3.status);

    const response4 = await fetch('http://localhost:13333/static4/.test/index.html');
    console.log(response4.status, (await response4.text()).slice(0, 100));

    const response5 = await fetch('http://localhost:13333/static5/.test/index.html');
    console.log(response5.status, await response5.text());

    const response6 = await fetch('http://localhost:13333/static6/.test/index.html');
    console.log(response6.status, await response6.text());

    const response7 = await fetch('http://localhost:13333/static7/assgdgeerdf.html');
    console.log(response7.status, (await response7.text()).includes('ENOENT'));

    const response8 = await fetch('http://localhost:13333/static8/index.html');
    console.log(response8.headers.get('ETag'));

    const response9 = await fetch('http://localhost:13333/static/index.html');
    console.log(response9.headers.get('ETag'));

    process.exit(0);







});