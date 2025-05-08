// must support req.url

const express = require("express");

const app = express();

app.use(require("../../middleware"));

const router = express.Router();

app.get("/test", (req, res) => {
    res.send(req.url);
});

router.get("/test", (req, res) => {
    res.send(req.url);
});

app.use("/router", router);

app.use("/router", (req, res) => {
    res.send(req.url);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res;
    res = await fetch('http://localhost:13333/test#asdf');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/router/test?test');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/router');
    console.log(await res.text());

    process.exit(0);
})
