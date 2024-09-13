// must support array req.xhr

import express from "express";

const app = express();

app.get('/test', (req, res) => {
    console.log(req.xhr);
    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    await fetch('http://localhost:13333/test').then(res => res.text());
    await fetch('http://localhost:13333/test', {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    }).then(res => res.text());

    process.exit(0);
});