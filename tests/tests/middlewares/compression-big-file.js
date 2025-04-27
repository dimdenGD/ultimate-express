// must support compression middleware with big file

const express = require("express");
const compression = require("compression");

const app = express();

app.use(compression({
    threshold: 1,
}));

app.use(express.static('tests/parts'));

app.get('/abc', (req, res) => {
    res.send('Hello World');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/large-file.json');
    
    console.log(response.headers.get('content-encoding'));
    console.log(await response.json());

    process.exit(0);

});