// must support req.acceptsLanguages()

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get('/test', (req, res) => {
    console.log(req.acceptsLanguages('en'));
    console.log(req.acceptsLanguages('en', 'fr'));
    console.log(req.acceptsLanguages('en', 'fr', 'de'));
    console.log(req.acceptsLanguages('en', 'fr', 'de', 'fr'));
    console.log(req.acceptsLanguages('fr', 'de', 'fr', 'en'));
    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    await fetchTest('http://localhost:13333/test').then(res => res.text());
    await fetchTest('http://localhost:13333/test', {
        headers: {
            'Accept-Language': 'en'
        }
    }).then(res => res.text());
    await fetchTest('http://localhost:13333/test', {
        headers: {
            'Accept-Language': 'en, fr'
        }
    }).then(res => res.text());
    await fetchTest('http://localhost:13333/test', {
        headers: {
            'Accept-Language': 'fr, de'
        }
    }).then(res => res.text());
    await fetchTest('http://localhost:13333/test', {
        headers: {
            'Accept-Language': 'en, fr, de, fr'
        }
    }).then(res => res.text());
    process.exit(0);
});