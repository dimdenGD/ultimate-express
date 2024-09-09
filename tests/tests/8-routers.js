// must support routers

import express from "express";

const app = express();
const router = new express.Router();
const router2 = new express.Router();

router.get('/test', (req, res) => {
    console.log('found router1');
    res.send('test');
});

router2.get('/test', (req, res) => {
    console.log('found router2');
    res.send('test2');
});

app.use('/', router);
app.use('/asdf', router2);

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let output1 = await fetch('http://localhost:13333/test').then(res => res.text());
    let output2 = await fetch('http://localhost:13333/asdf/asdf').then(res => res.text());
    let output3 = await fetch('http://localhost:13333/asdf/test').then(res => res.text());

    console.log(output1, output2, output3);
    process.exit(0);
});