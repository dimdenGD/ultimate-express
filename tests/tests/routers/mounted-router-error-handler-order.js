// must run the error handler declared after a mounted router, not one before it

const express = require("express");

// router defined before the parent's middlewares, so its routes get lower routeKeys
// (this is what happens when a router is required from another module)
const router = express.Router();
router.post("/path", function handler(req, res) {
    throw new Error("Whoops");
});
router.get("/ok", function ok(req, res) {
    res.send("ok");
});

const app = express();
app.use(express.json());
app.set("catch async errors", true);

app.use(function jsonErrorHandler(err, req, res, next) {
    if(err) {
        return res.send("JSON error");
    }
    next();
});

app.use("/route", router);

app.use(function errorHandler(err, req, res, next) {
    if(err) {
        return res.json(err.toString());
    }
    next();
});

app.listen(13333, async () => {
    console.log("Server is running on port 13333");
    await new Promise(resolve => setTimeout(resolve, 200));

    // error thrown in the router must reach the error handler declared AFTER the mount
    let res = await fetch("http://localhost:13333/route/path", { method: "POST" });
    console.log(res.status, await res.text());

    // a normal route in the same router still works
    res = await fetch("http://localhost:13333/route/ok");
    console.log(res.status, await res.text());

    process.exit(0);
});
