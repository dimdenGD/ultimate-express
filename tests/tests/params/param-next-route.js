// must support next('route') in param

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.param('id', (req, res, next, value, key) => {
    console.log('param 1');
    if(value === '333') {
        return next('route');
    }
    next();
});

app.param('id', (req, res, next, value, key) => {
    console.log('param 2');
    next();
});

app.get('/user/:id', [
    function (req, res, next) {
        console.log('route 1');
        res.send(req.params.id);
    },
    function (req, res, next) {
        console.log('route 2');
        res.send(req.params.id);
    },
    function (req, res, next) {
        console.log('route 3');
        res.send(req.params.id);
    }
]);
  
app.use((err, req, res, next) => {
    res.send(err.message);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/user/555').then(res => res.text());
    console.log(response);
    const response2 = await fetchTest('http://localhost:13333/user/333').then(res => res.text());
    console.log(response2);

    process.exit(0);
});