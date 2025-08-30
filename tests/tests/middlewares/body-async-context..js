// must keep async context

const express = require("express");
const { AsyncLocalStorage } = require("async_hooks");

const app = express();
const ctx = new AsyncLocalStorage();

app.use((req, res, next) => {
    ctx.run('anything', next);
});

app.use(express.json());

app.post('/abc', (req, res) => {
    res.setHeader('ctx', ctx.getStore());
    res.send(req.body);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/abc', {
        method: 'POST',
        body: JSON.stringify({
            abc: 123
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const text = await response.text();
    console.log(response.headers.get('content-type'));
    console.log(response.headers.get('ctx'));
    console.log(text);

    process.exit(0);

});