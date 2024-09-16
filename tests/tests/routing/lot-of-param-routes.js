// must support a lot of param routes

import express from "express";

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

    let res = await fetch('http://localhost:13333/asdf');
    console.log(await res.text());


    process.exit(0);
})
