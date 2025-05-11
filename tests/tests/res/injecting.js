// must support replacing methods

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

const _send = express.response.send;

express.response.send = function(body) {
    console.log('send', body);
    return _send.call(this, body);
}

app.get('/test', (req, res) => {
    res.send('test');
});


app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test');
    console.log(await response.text());
    process.exit(0);
});