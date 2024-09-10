// error handling middleware

import express from "express";

const app = express();
app.set('env', 'production');

app.get('/test', (req, res) => {
    throw new Error('test');
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