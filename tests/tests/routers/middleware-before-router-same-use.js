// must run middlewares in the same use() call as a mounted router

const express = require("express");

const app = express();
const router = express.Router();

router.get("/data", (req, res) => {
    res.send("secret");
});

app.use(
    "/private",
    (req, res, next) => {
        if (req.headers.authorization === "yes") return next();
        res.status(401).send("denied");
    },
    router
);

app.listen(13333, async () => {
    console.log("Server is running on port 13333");
    await new Promise((resolve) => setTimeout(resolve, 200));

    let res = await fetch("http://localhost:13333/private/data");
    console.log(res.status, await res.text());

    res = await fetch("http://localhost:13333/private/data", {
        headers: { authorization: "yes" },
    });
    console.log(res.status, await res.text());

    process.exit(0);
});
