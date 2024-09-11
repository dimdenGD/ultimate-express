// must support a lot of routes

import express from "express";

const app = express();

for(let i = 0; i < 1000; i++) {
    app.get(`/${i}`, (req, res) => {
        res.send(i.toString());
    });
}

for(let i = 0; i < 1000; i++) {
    app.use((req, res, next) => {
        next();
    });
}

for(let i = 1000; i < 2000; i++) {
    app.get(`/${i}`, (req, res) => {
        res.send(i.toString());
    });
}

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res = await fetch('http://localhost:13333/999');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/1999');
    console.log(await res.text());


    process.exit(0);
})
