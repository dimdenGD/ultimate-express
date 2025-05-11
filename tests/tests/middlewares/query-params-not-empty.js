// must support correct query & params with data

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
app.use(express.json());

app.post('/abc/:param1', (req, res) => {
    console.log("Query Params:", req.query);   // Logs query parameters
    console.log("Route Params:", req.params);   // Logs route parameters
    console.log("Request Body:", req.body);     // Logs request body
    res.send(req.body);
});

app.listen(13333, async () => {
    const responseBody = await fetchTest('http://localhost:13333/abc/param?test=1', {
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