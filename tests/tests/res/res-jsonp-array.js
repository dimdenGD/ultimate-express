// must support res.jsonp() array

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
app.set('jsonp callback name', 'callback2');

app.get('/test', (req, res) => {
    res.jsonp({ test: 'test' });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test?callback2=test&callback2=test2');
    console.log(await response.text());

    const response2 = await fetchTest('http://localhost:13333/test');
    console.log(await response2.text());

    const response3 = await fetchTest('http://localhost:13333/test?asdf=test');
    console.log(await response3.text());

    const response4 = await fetchTest('http://localhost:13333/test?callback3=test');
    console.log(await response4.text());

    process.exit(0);
});