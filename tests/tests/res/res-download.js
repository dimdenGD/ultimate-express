// must support res.download()

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get('/test', (req, res) => {
    res.download('src/index.js', { root: "." });
});

app.get('/test2', (req, res) => {
    res.download('src/index.js', "hi.js", (err) => {
        console.log(err);
    });
});

app.get('/test3', (req, res) => {
    res.download('src/index.js', { root: "." }, (err) => {
        console.log(err);
    });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test');
    console.log([await response.text(), response.headers.get('content-disposition'), response.headers.get('content-type')?.toLowerCase()]);

    const response2 = await fetchTest('http://localhost:13333/test2');
    console.log([await response2.text(), response2.headers.get('content-disposition'), response.headers.get('content-type')?.toLowerCase()]);

    const response3 = await fetchTest('http://localhost:13333/test3');
    console.log([await response3.text(), response3.headers.get('content-disposition'), response.headers.get('content-type')?.toLowerCase()]);

    process.exit(0);
});