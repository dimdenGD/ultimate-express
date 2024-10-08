// must support express.static() dotfiles behavior

const express = require("express");

const app = express();

app.post('/abc', (req, res) => {
    res.send('ok');
});
app.use('/static', express.static('tests/parts'));
app.use('/static2', express.static('tests/parts', { dotfiles: 'allow' }));
app.use('/static3', express.static('tests/parts', { dotfiles: 'deny' }));
app.use('/static4', express.static('tests/parts', { dotfiles: 'ignore' }));

app.use((err, req, res, next) => {

    res.status(500).send(err);
});

app.use((req, res, next) => {

    res.status(404).send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const responses = await Promise.all([
        fetch('http://localhost:13333/static/.test.txt'),
        fetch('http://localhost:13333/static2/.test.txt'),
        fetch('http://localhost:13333/static3/.test.txt'),
        fetch('http://localhost:13333/static4/.test.txt'),
        fetch('http://localhost:13333/static/.test/index.html'),
        fetch('http://localhost:13333/static2/.test/index.html'),
        fetch('http://localhost:13333/static3/.test/index.html'),
        fetch('http://localhost:13333/static4/.test/index.html'),
        fetch('http://localhost:13333/static/.gitignore'),
        fetch('http://localhost:13333/static2/.gitignore'),
        fetch('http://localhost:13333/static3/.gitignore'),
        fetch('http://localhost:13333/static4/.gitignore'),
    ]);

    console.log(responses.map(r => r.status), await Promise.all(responses.map(r => r.text())));

    process.exit(0);

});