// must answer 413 for a body over the limit, with the error body-parser gives

const express = require("express");

const app = express();

app.use(express.json({ limit: '20b' }));

app.post('/abc', (req, res) => {
    res.json({ ok: true });
});

app.post('/handled', (req, res) => {
    res.json({ ok: true });
});

// the error as the application sees it, minus the stack
app.use('/handled', (err, req, res, next) => {
    res.status(err.status || 500).json({
        name: err.name,
        message: err.message,
        status: err.status,
        statusCode: err.statusCode,
        expose: err.expose,
        type: err.type,
        limit: err.limit,
        length: err.length,
        expected: err.expected
    });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const big = JSON.stringify({ a: 'b'.repeat(100) });

    // over the limit by content-length, through the default error handler
    let response = await fetch('http://localhost:13333/abc', {
        method: 'POST',
        body: big,
        headers: { 'Content-Type': 'application/json' }
    });
    console.log(response.status);

    // the same, to an error handler that reads the error
    response = await fetch('http://localhost:13333/handled', {
        method: 'POST',
        body: big,
        headers: { 'Content-Type': 'application/json' }
    });
    console.log(response.status, await response.text());

    // a chunked body carries no content-length, so the limit is caught while reading
    const body = new ReadableStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode('{"aaaaaaaaaa":'));
            controller.enqueue(new TextEncoder().encode('"bbbbbbbbbbbbbbbbbbbb"}'));
            controller.close();
        }
    });
    response = await fetch('http://localhost:13333/abc', {
        method: 'POST',
        body,
        duplex: 'half',
        headers: { 'Content-Type': 'application/json' }
    });
    console.log(response.status);

    process.exit(0);
});
