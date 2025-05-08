// must support correct query & params with data

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.use(express.json());

app.post('/abc/:param1', (req, res) => {
    console.log("Query Params:", req.query);   // Logs query parameters
    console.log("Route Params:", req.params);   // Logs route parameters
    console.log("Request Body:", req.body);     // Logs request body
    res.send(req.body);
});

app.listen(13333, async () => {
    const responseBody = await fetch('http://localhost:13333/abc/param?test=1', {
        method: 'POST',
        body: JSON.stringify({
            abc: 123
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    process.exit(0);
});