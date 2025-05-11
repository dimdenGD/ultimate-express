// must support cors middleware

const express = require("express");
const { fetchTest } = require("../../utils");
const cors = require("cors");

const app = express();

app.get('/abc', cors(), (req, res) => {
    res.send('1');
});

app.get('/def', cors({
    origin: 'http://example.com',
}), (req, res) => {
    res.send('2');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/abc');
    console.log(response.headers.get('access-control-allow-origin'));

    const response2 = await fetchTest('http://localhost:13333/def');
    console.log(response2.headers.get('access-control-allow-origin'));

    process.exit(0);

});