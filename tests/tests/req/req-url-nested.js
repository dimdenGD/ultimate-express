// must support nested req.url

const express = require("express");

const app = express();
const router = express.Router();

router.use("/:test", (req, res, next) => {
    console.log(req.url);
    next();
});

app.use("/test", router);

app.get('/test/:test', (req, res) => {
    res.send(req.url);
});

app.listen(13333, async () => {

    console.log('Server is running on port 13333');

    let res = await fetch('http://localhost:13333/test/asdf');
    console.log(await res.text());

    process.exit(0);
})
