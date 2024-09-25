// must support 10 nested middlewares

const express = require("express");

const app = express();
let middleware = (req, res, next) => {
    next();
};
let middlewares = [];
for(let i = 0; i < 10; i++) {
    middlewares.push(middleware);
}

for(let i = 0; i < 100; i++) {
    app.get(`/${i}`, ...middlewares, (req, res) => {
        res.send(i.toString());
    });
}


app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res = await fetch('http://localhost:13333/90');
    console.log(await res.text());
    process.exit(0);
})
