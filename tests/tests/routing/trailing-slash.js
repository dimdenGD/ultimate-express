// must support trailing slash in routes

const express = require("../../../src/index.js");

const app = express();

app.get('/test', (req, res) => {
    res.send('test');
});

app.get("/baba/", (req, res) => {
    res.send("baba");
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res = await fetch('http://localhost:13333/test');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/test/');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/test/test');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/baba');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/baba/');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/test/?test=1');
    console.log(await res.text());

    process.exit(0);
})
