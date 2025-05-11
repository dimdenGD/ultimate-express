// must support array arguments

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

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

    let output = await fetchTest('http://localhost:13333/asdf').then(res => res.text());

    console.log(output);
    process.exit(0);
});