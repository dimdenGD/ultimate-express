// must support declarative response write status

const express = require("express");

const app = express();

app.get('/test1', (req, res) => {
    res.sendStatus(404);
});

app.listen(13333, async () => {
    const response1 = await fetch('http://localhost:13333/test1');
    console.log(response1.status);
    
    process.exit(0);
});