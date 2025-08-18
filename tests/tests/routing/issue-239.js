// issue 239

const express = require("express");

const router = express.Router();

router.post("/path", function handler(req, res) {
    throw new Error("Whoops");
});

const app = express();

app.use(express.json());

app.set("catch async errors", true);

app.use(function jsonErrorHandler(err, req, res, next){
    if(err){
        return res.send("JSON error");
    }
    next();
})

app.use("/route", router);

app.use(function errorHandler(err, req, res, next) {
    if(err){
        return res.json(err.toString());
    }
    next();
});

app.listen(13333, async() => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/route/path', { method: 'POST' });
    const body = await response.text();
    console.log(response.status, body);
    process.exit(0);
});
