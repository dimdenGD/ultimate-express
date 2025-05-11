// must support req.originalUrl

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
const router = express.Router();

app.get("/test", (req, res) => {
    res.send(req.originalUrl);
});

router.get("/test", (req, res) => {
    res.send(req.originalUrl);
});

app.use("/router", router);

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res;
    res = await fetchTest('http://localhost:13333/test#asdf');
    console.log(await res.text());

    res = await fetchTest('http://localhost:13333/router/test?test');
    console.log(await res.text());

    process.exit(0);
})
