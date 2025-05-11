// must support . and - in routes

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get('/test/hi.bye*a', (req, res) => {
    res.send('hi.bye');
});

app.get('/hi-bye*a', (req, res) => {
    res.send('hi-bye');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res = await fetchTest('http://localhost:13333/test/hi.byeaa');
    console.log(await res.text());

    res = await fetchTest('http://localhost:13333/hi-byeaa');
    console.log(await res.text());

    res = await fetchTest('http://localhost:13333/test/hiAbyeaa');
    console.log(await res.text());

    process.exit(0);
})
