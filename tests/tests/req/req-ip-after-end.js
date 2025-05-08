// must support req.ip after response

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.get("/test", (req, res) => {
    res.send('ok');
    console.log(req.ip.replace('0000:0000:0000:0000:0000:0000:0000:000', "::"));
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res;
    res = await fetch('http://localhost:13333/test');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/test');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/test');
    console.log(await res.text());

    process.exit(0);
})
