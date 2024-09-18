// must support res.set(), res.header()

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    res.set('X-Test', 'test');
    res.set({
        'X-Test2': 'test2',
        'X-Test3': 'test3'
    });
    res.header('X-Test4', 'test4');
    res.setHeader('X-Test5', 'test5');
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test');
    console.log(response.headers.get('X-Test'));
    console.log(response.headers.get('X-Test2'));
    console.log(response.headers.get('X-Test3'));
    console.log(response.headers.get('X-Test4'));
    console.log(response.headers.get('X-Test5'));
    process.exit(0);
});