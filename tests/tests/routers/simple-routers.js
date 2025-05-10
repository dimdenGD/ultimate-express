// must support simple routers

const express = require("express");

const app = express();
const router = new express.Router();

router.get('/:test', (req, res, next) => {
    console.log(req.url, req.params.test);
    next();
});

router.get('/test', (req, res) => {
    console.log(req.url);
    res.send('test');
});

app.use('/asdf', router);

app.use((req, res, next) => {
    res.send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');
    await new Promise(resolve => setTimeout(resolve, 1000));

    let output1 = await fetch('http://localhost:13333/test');
    console.log(await output1.text());
    let output2 = await fetch('http://localhost:13333/asdf/asdf');
    console.log(await output2.text());
    let output3 = await fetch('http://localhost:13333/asdf/test');
    console.log(await output3.text());
    
    process.exit(0);
});