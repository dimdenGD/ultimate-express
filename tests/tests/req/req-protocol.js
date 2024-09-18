// must support req.protocol and req.secure

const express = require("express");

const app = express();

app.get("/test", (req, res) => {
    res.send(req.protocol + ' ' + req.secure);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res;
    res = await fetch('http://localhost:13333/test');
    console.log(await res.text());


    process.exit(0);
})
