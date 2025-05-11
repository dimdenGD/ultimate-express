// must support nested req.url

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
const router = express.Router();

router.use("/:test", (req, res, next) => {
    console.log(req.url);
    console.log(req.params);
    next();
});

app.use("/test", router);

app.get('/test/:test', (req, res) => {
    console.log(req.params);
    res.send(req.url);
});

app.listen(13333, async () => {

    console.log('Server is running on port 13333');

    let res = await fetchTest('http://localhost:13333/test/asdf');
    console.log(await res.text());

    process.exit(0);
})
