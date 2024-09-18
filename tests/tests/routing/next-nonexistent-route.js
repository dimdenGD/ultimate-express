// must support non-existent next("route")

const express = require("express");

const app = express();
app.set('env', 'production');

app.get('te*st', (req, res, next) => {
    console.log('1');
    next("route");
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/teest').then(res => res.text());
    console.log(response);
    process.exit(0);
});