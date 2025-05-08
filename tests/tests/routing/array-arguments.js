// must support array arguments

const express = require("express");

const app = express();

app.use(require("../../middleware"));

app.use([(req, res, next) => {
    console.log('first');
    next();
}, (req, res, next) => {
    console.log('second');
    next();
}]);

app.use('/asdf', (req, res, next) => {
    console.log('third');
    next();
}, (req, res, next) => {
    console.log('fourth');
    next();
});

app.get('/asdf', (req, res) => {
    res.send('asdf');
});


app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let output = await fetch('http://localhost:13333/asdf').then(res => res.text());

    console.log(output);
    process.exit(0);
});