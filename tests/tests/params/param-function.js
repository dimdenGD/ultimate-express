// must support app.param and router.param as function

import express from "express";

const app = express();
const router = express.Router();

app.param(function (param, option) {
    return function (req, res, next, val) {
        console.log('param', param, option);
        next();
    }
});

app.get("/user/:id", (req, res, next) => {
   console.log('before');
   next();
});

app.param('id', 1337);

app.get('/user/:id', function (req, res, next) {
    console.log('although this matches');
    next();
});

app.get('/user/:id', function (req, res) {
    console.log('and this matches too');
    res.send('test');
});

router.get('/:id', (req, res) => {
    res.send('routertest');
});

app.use('/test', router);

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/user/123');
    console.log(response.status);
    const response2 = await fetch('http://localhost:13333/test/123');
    console.log(response2.status);
    const response3 = await fetch('http://localhost:13333/user/555').then(res => res.text());
    console.log(response3);

    process.exit(0);
});