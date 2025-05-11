// must support res.location()

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get('/test', (req, res) => {
    res.location('http://example.com');
    res.send('ok');
});

app.get('/test2', (req, res) => {
    res.location('back');
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test');
    console.log(response.headers.get('Location'));

    const response2 = await fetchTest('http://localhost:13333/test2');
    console.log(response2.headers.get('Location'));

    const response3 = await fetchTest('http://localhost:13333/test2', {
        headers: {
            'Referrer': 'http://example.com',
        },
    });
    console.log(response3.headers.get('Location'));

    process.exit(0);
});