// must support correct redirect

const express = require("express");

const app = express();

app.use((req, res, next) => {
    console.log(req.headers.accept);
    express.static('tests/parts')(req, res, next);
});

app.use((req, res, next) => {
    res.status(404).send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/trailing', {
        redirect: 'manual',
        headers: {
            'accept': 'text/html'
        }
    });

    console.log(
        response.status, 
        response.headers.get('location'), 
        response.headers.get('vary'), 
        response.headers.get('content-type'),
        await response.text(),
    );

    const response2 = await fetch('http://localhost:13333/trailing', {
        redirect: 'manual',
        headers: {
            'accept': 'text/plain'
        }
    });

    console.log(
        response2.status, 
        response2.headers.get('location'), 
        response2.headers.get('vary'), 
        response2.headers.get('content-type'),
        await response2.text(),
    );

    process.exit(0);

});