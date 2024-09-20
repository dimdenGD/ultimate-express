// must support param on use

const express = require("express");

const app = express();
const router = express.Router();

app.param('id', (req, res, next, value, key) => {
    if(value === '555') {
        return next('route');
    }
    console.log('id:', value);
    next();
});

router.get('/test', (req, res, next) => {
    return res.send('router');
});

app.use('/:id', router);


app.use((req, res, next) => {
    return res.send('bypassed');
});

app.listen(13333, async () => {

    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/1/test');
    console.log(await response.text());

    const response2 = await fetch('http://localhost:13333/555/test');
    console.log(await response2.text());

    process.exit(0);

});