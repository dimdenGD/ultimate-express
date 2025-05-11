// must support res.header()

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get('/test', (req, res) => {
    res.header('asdf', 'foo');
    res.header('asdf', 'bar');
    res.header('def', 'des');
    console.log(res.getHeaders()['asdf']);
    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test');
    console.log(response.headers.get('asdf'));
    console.log(response.headers.get('def'));
    process.exit(0);
});