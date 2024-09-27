// must support fs threads

const express = require("express");

const app = express({ threads: 0 });
const app2 = express({ threads: 2 });
const app3 = express({ threads: 4 });

app.get('/test', (req, res) => {
    res.sendFile('tests/parts/big.jpg', {
        root: '.'
    });
});

app2.get('/test', (req, res) => {
    res.sendFile('tests/parts/big.jpg', {
        root: '.'
    });
});

app3.get('/test', (req, res) => {
    res.sendFile('tests/parts/big.jpg', {
        root: '.'
    });
});
app.listen(13333, async () => {
    app2.listen(13334, async () => {
        app3.listen(13335, async () => {
            console.log('Server is running on port 13333, 13334, 13335');
            const response = await fetch('http://localhost:13333/test');
            console.log(response.status, response.headers.get('Content-Length'));
            const response2 = await fetch('http://localhost:13334/test');
            console.log(response2.status, response2.headers.get('Content-Length'));
            const response3 = await fetch('http://localhost:13335/test');
            console.log(response3.status, response3.headers.get('Content-Length'));
            process.exit(0);
        });
    });
});