// must support res.append()

import express from "express";

const app = express();

app.get('/test', (req, res) => {
    res.append('X-Test', '1');
    res.append('X-Test', '2');
    res.append('Set-Cookie', 'test=1');
    res.append('Set-Cookie', 'test2=2');
    res.append('Link', ['<http://example.com>', '<http://example.com/other>']);
    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.headers.get('X-Test'));
    console.log(response.headers.get('Set-Cookie'));
    console.log(response.headers.get('Link'));
    process.exit(0);
});