// must support server-sent events

const express = require("express");
const { createSession } = require("better-sse");
const { EventSource } = require("eventsource");

const app = express();

app.use(require("../../middleware"));

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.get('/sse', async (req, res) => {
    const session = await createSession(req, res);
    session.push('hello');
    await sleep(50);
    session.push('world');
    await sleep(50);
    session.push('!');
    await sleep(50);

    for(let i = 0; i < 20; i++) {
        await sleep(10);
        session.push(`${i}`);
    }
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const es = new EventSource('http://localhost:13333/sse');
    es.onmessage = (e) => {
        console.log(e.data);
    };

    setTimeout(() => {
        process.exit(0);
    }, 3000);
});