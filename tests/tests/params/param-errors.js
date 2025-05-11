// must support param errors

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
const router = express.Router();

app.param('id', (req, res, next, value, key) => {
    if(value === '555') {
        return res.send('bypassed');
    }
    if(value === '333') {
        return next(new Error('test error'));
    }
    next();
});
  
app.get('/user/:id', function (req, res, next) {
    console.log('this matches');
    next();
});

app.get('/user/:id', function (req, res) {
    console.log('and this matches too');
    res.send('test');
});

router.param('id', function (req, res, next, id) {
    console.log('Router param call');
    next();
});

router.get('/:id', (req, res) => {
    res.send('routertest');
});

app.use('/test', router);

app.use((err, req, res, next) => {
    res.send(err.message);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/user/123');
    console.log(response.status);
    const response2 = await fetchTest('http://localhost:13333/test/123');
    console.log(response2.status);
    const response3 = await fetchTest('http://localhost:13333/user/333');
    console.log(await response3.text());
    const response4 = await fetchTest('http://localhost:13333/user/555').then(res => res.text());
    console.log(response4);

    process.exit(0);
});