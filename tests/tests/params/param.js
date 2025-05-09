// must support app.param and router.param

const express = require("express");

const app = express();

// app.use(require("../../middleware"));

const router = express.Router();

app.get("/user/:id", (req, res, next) => {
   console.log('before');
   next();
});

app.param('id', (req, res, next, value, key) => {
    if(value === '555') {
        return res.send('bypassed');
    }
    next();
});

app.param('id', function (req, res, next, value, key) {
    console.log('CALLED ONLY ONCE', value, key);
    next();
});

app.param('id', function (req, res, next, id) {
    console.log('test 2');
    next();
});

app.param('id', async function (req, res, next, id) {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('test 3');
    next();
});
  
app.get('/user/:id', function (req, res, next) {
    console.log('although this matches');
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