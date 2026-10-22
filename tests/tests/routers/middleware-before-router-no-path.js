// must run middlewares registered before a router mounted without a path

const express = require("express");

const app = express();
const router = express.Router();
const outer = express.Router();
const inner = express.Router();

app.use(express.json());
app.use((req, res, next) => {
    if (req.headers.authorization === "yes") return next();
    res.status(401).send("denied");
});

router.get("/data", (req, res) => {
    res.send("secret");
});

inner.post("/echo", (req, res) => {
    res.json({ body: req.body ?? null });
});

outer.use(inner);
app.use(router);
app.use(outer);

app.listen(13333, async () => {
    console.log("Server is running on port 13333");
    await new Promise((resolve) => setTimeout(resolve, 200));

    let res = await fetch("http://localhost:13333/data");
    console.log(res.status, await res.text());

    res = await fetch("http://localhost:13333/data", {
        headers: { authorization: "yes" },
    });
    console.log(res.status, await res.text());

    res = await fetch("http://localhost:13333/echo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ a: 1 }),
    });
    console.log(res.status, await res.text());

    res = await fetch("http://localhost:13333/echo", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "yes" },
        body: JSON.stringify({ a: 1 }),
    });
    console.log(res.status, await res.text());

    process.exit(0);
});
