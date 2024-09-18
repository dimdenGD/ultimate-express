// must support res.jsonp()

const express = require("express");

const app = express();
app.set('jsonp callback name', 'callback2');

app.get('/test', (req, res) => {
    res.jsonp({ test: 'test' });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test?callback2=test');
    console.log(await response.text());

    const response2 = await fetch('http://localhost:13333/test');
    console.log(await response2.text());

    const response3 = await fetch('http://localhost:13333/test?asdf=test');
    console.log(await response3.text());

    process.exit(0);
});