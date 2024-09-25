// must support unoptimized after optimized

const express = require("express");

const app = express();
app.set('env', 'production');

app.get('/test',
    (req, res, next) => {
        console.log('1');
        next();
    },
    (req, res, next) => {
        console.log('2');
        next('route');
    },
    (req, res, next) => {
        console.log('3');
        next();
    }
);

app.get('/test', (req, res, next) => {
    console.log('4');
    next();
});

app.get('/:test', (req, res) => {
    console.log('5');
    res.send('Hello World');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test').then(res => res.text());
    console.log(response);
    process.exit(0);
});