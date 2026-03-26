// must support res.links()

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    res.links({
        'next': 'http://api.example.com/users?page=2',
        'last': 'http://api.example.com/users?page=5',
    });
    res.send('ok');
});

app.get('/links', (req, res) => {
    // calling links() multiple times should accumulate
    res.links({ next: 'http://example.com/page2' });
    res.links({ last: 'http://example.com/page5' });
    res.links({ last: 'http://example.com/page8' });
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.headers.get('Link'));

    const response2 = await fetch('http://localhost:13333/links');
    console.log(response2.headers.get('Link'));

    process.exit(0);
});