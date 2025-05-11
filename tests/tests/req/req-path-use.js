// must support req.path in use

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
const router = express.Router();

router.use("/test", (req, res) => {
    res.send(req.path);
});

router.get("/test2", (req, res) => {
    res.send(req.path);
});

app.use("/router", router);

app.use("/test", (req, res) => {
    res.send(req.path);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    console.log(await fetchTest('http://localhost:13333/test').then(res => res.text()));
    console.log(await fetchTest('http://localhost:13333/router/test').then(res => res.text()));
    console.log(await fetchTest('http://localhost:13333/router/test2').then(res => res.text()));
    process.exit(0);
});