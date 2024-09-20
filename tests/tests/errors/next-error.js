// support next(err)

const express = require("express");

const app = express();
app.set('env', 'production');

app.get('/:test', (req, res, next) => {
    next(new Error('test'));
});

app.get('/:test', (req, res, next) => {
    res.send('test');
});

app.use((err, req, res, next) => {
    res.status(500).send(`whoops!`);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test').then(res => res.text());
    console.log(response);
    process.exit(0);
});