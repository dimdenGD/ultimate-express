// must support optimized req.url with router

const express = require("express");

const app = express();

app.use(require("../../middleware"));

const router = express.Router();

router.use((req, res, next) => {
    console.log('router', req.url);
    next();
});

app.use("/:test", router);

app.get("/test", (req, res) => {
    res.send(req.url);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res;
    res = await fetch('http://localhost:13333/test');
    console.log(await res.text());
    process.exit(0);
})
