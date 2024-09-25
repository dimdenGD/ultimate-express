// must support a lot of routes inside simple routers

const express = require("express");

const app = express();
const router = express.Router();

for(let i = 0; i < 1000; i++) {
    router.get(`/${i}`, (req, res) => {
        res.send(i.toString());
    });
}

for(let i = 1000; i < 2000; i++) {
    router.use((req, res, next) => {
        next();
    });
}

for(let i = 2000; i < 3000; i++) {
    router.get(`/${i}`, (req, res) => {
        res.send(i.toString());
    });
}

app.use("/router", router);

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res = await fetch('http://localhost:13333/router/999');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/router/2999');
    console.log(await res.text());

    process.exit(0);
})
