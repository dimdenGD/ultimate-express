// v5 must handle async errors natively without express-async-errors
// SKIP_V4: Express 5 handles async errors natively

const express = require("express");

const app = express({ version: 5 });
app.set('env', 'production');

app.get('/test', async (req, res) => {
    throw new Error('async error');
});

app.get('/test2', async (req, res) => {
    await Promise.reject(new Error('rejected promise'));
});

app.use((err, req, res, next) => {
    res.status(500).send('caught: ' + err.message);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const responses = await Promise.all([
        fetch('http://localhost:13333/test').then(res => res.text()),
        fetch('http://localhost:13333/test2').then(res => res.text()),
    ]);

    console.log(responses);
    process.exit(0);
});
