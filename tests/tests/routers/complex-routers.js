// must support complex routers

const express = require("express");

const app = express();
const router = express.Router();

router.get('/test', (req, res) => {
    console.log('found router', req.params.test);
    res.send('test2');
});

router.get('/b/:hi', (req, res) => {
    console.log('found router2', req.params.hi);
    res.send('test2');
});

app.use('/:test', router);

app.use((req, res, next) => {
    res.send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let output1 = await fetch('http://localhost:13333/test').then(res => res.text());
    let output2 = await fetch('http://localhost:13333/asdf/asdf').then(res => res.text());
    let output3 = await fetch('http://localhost:13333/asdf/test').then(res => res.text());
    let output4 = await fetch('http://localhost:13333/test/b/asdf').then(res => res.text());

    console.log(output1, output2, output3, output4);
    process.exit(0);
});