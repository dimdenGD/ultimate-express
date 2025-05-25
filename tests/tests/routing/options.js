// must support OPTIONS method on GET routes

const express = require("express");

const app = express();
const router = express.Router();
const router2 = express.Router();


app.get('/test', (req, res) => {
    res.send('hello');
});

app.post('/test', (req, res) => {
    res.send('hello');
});

router.get('/test', (req, res) => {
    res.send('hello');
});

router.delete('/test', (req, res) => {
    res.send('hello');
});

router.options('/test2', (req, res) => {
    res.send('hello');
});

router2.get('/test', (req, res) => {
    res.send('hello');
});

app.use('/router', router);
router.use('/router2', router2);

app.post('/router/test', (req, res) => {
    res.send('hello');
});

app.options('/options', (req, res, next) => {
    next();
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res = await fetch('http://localhost:13333/test', { method: 'OPTIONS' });
    console.log(await res.text(), res.status, res.headers.get('allow'));

    res = await fetch('http://localhost:13333/router/test', { method: 'OPTIONS' });
    console.log(await res.text(), res.status, res.headers.get('allow'));

    res = await fetch('http://localhost:13333/router/router2/test', { method: 'OPTIONS' });
    console.log(await res.text(), res.status, res.headers.get('allow'));

    res = await fetch('http://localhost:13333/router/test2', { method: 'OPTIONS' });
    console.log(await res.text(), res.status, res.headers.get('allow'));

    res = await fetch('http://localhost:13333/options', { method: 'OPTIONS' });
    console.log(await res.text(), res.status, res.headers.get('allow'));

    process.exit(0);
})
