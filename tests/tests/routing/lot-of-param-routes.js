// must support a lot of param routes

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

for(let i = 0; i < 1000; i++) {
    app.get(`/:test`, (req, res, next) => {
        next();
    });
}

app.get('/:test', (req, res) => {
    res.send(req.params.test);
})


app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res = await fetchTest('http://localhost:13333/asdf');
    console.log(await res.text());


    process.exit(0);
})
