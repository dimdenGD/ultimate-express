// must remove uws header from response

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.get("/test", (req, res) => {
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    console.log((await fetch('http://localhost:13333/test')).headers.get('uwebsockets'));
    process.exit(0);
})
