// must support trailing slash in routes

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get('/test', (req, res) => {
    res.send('test');
});

app.get("/baba/", (req, res) => {
    res.send("baba");
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res = await fetchTest('http://localhost:13333/test');
    console.log(await res.text());

    res = await fetchTest('http://localhost:13333/test/');
    console.log(await res.text());

    res = await fetchTest('http://localhost:13333/test/test');
    console.log(await res.text());

    res = await fetchTest('http://localhost:13333/baba');
    console.log(await res.text());

    res = await fetchTest('http://localhost:13333/baba/');
    console.log(await res.text());

    res = await fetchTest('http://localhost:13333/test/?test=1');
    console.log(await res.text());

    process.exit(0);
})
