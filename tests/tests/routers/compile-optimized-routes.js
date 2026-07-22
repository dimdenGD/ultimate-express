// must compile optimized routes at listen for nested routers and skip mixed use(path, mw, router)

const express = require("express");

const app = express();
const singleRouter = express.Router();
singleRouter.get("/data", (req, res) => res.send("single"));
app.use("/api", singleRouter);

const nested = express.Router();
const inner = express.Router();
inner.get("/ddd", (req, res) => res.send("ddd"));
nested.use("/nested", inner);
nested.get("/ccc", (req, res) => res.send("ccc"));
app.use("/abccc", nested);

const mixedRouter = express.Router();
mixedRouter.get("/data", (req, res) => res.send("mixed"));
app.use(
    "/mixed",
    (req, res, next) => {
        if (req.headers.authorization === "yes") return next();
        res.status(401).send("denied");
    },
    mixedRouter
);

app.listen(13333, async () => {
    console.log("Server is running on port 13333");

    let res = await fetch("http://localhost:13333/api/data");
    console.log("single", res.status, await res.text());

    res = await fetch("http://localhost:13333/abccc/ccc");
    console.log("nested-ccc", res.status, await res.text());

    res = await fetch("http://localhost:13333/abccc/nested/ddd");
    console.log("nested-ddd", res.status, await res.text());

    res = await fetch("http://localhost:13333/mixed/data");
    console.log("mixed", res.status, await res.text());

    res = await fetch("http://localhost:13333/mixed/data", {
        headers: { authorization: "yes" },
    });
    console.log("mixed-auth", res.status, await res.text());

    process.exit(0);
});
