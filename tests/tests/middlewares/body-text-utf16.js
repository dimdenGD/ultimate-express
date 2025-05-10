// must support text body parser with utf-16 encoding

const express = require("express");
const app = express();

app.use(express.text());

app.post('/abc', (req, res) => {
    res.send(req.body);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const uint16 = new Uint16Array([0, 104, 0, 101, 0, 108, 0, 108, 0, 111]);

    const response = await fetch('http://localhost:13333/abc', {
        method: 'POST',
        body: uint16,
        headers: {
            'Content-Type': 'text/plain; charset=utf-16le'
        }
    });

    const text = await response.text();
    console.log(response.headers.get('content-type'));
    console.log(text);

    process.exit(0);

});