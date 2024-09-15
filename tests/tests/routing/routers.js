// must support routers

import express from "express";

const app = express();
const router = new express.Router();
const router2 = new express.Router();
const router3 = express.Router();

router.get('/test', (req, res) => {
    res.send('test');
});

router2.get('/test', (req, res) => {
    res.send('test2');
});

router3.get('/meow', (req, res) => {
    res.send('meow');
});

app.use('/', router);
app.use('/asdf', router2);
app.use(router3);

app.get('/gaa', (req, res) => {
    res.send('gaa');
});

app.use((req, res, next) => {
    res.send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let output1 = await fetch('http://localhost:13333/test').then(res => res.text());
    let output2 = await fetch('http://localhost:13333/asdf/asdf').then(res => res.text());
    let output3 = await fetch('http://localhost:13333/asdf/test').then(res => res.text());
    let output4 = await fetch('http://localhost:13333/meow').then(res => res.text());
    let output5 = await fetch('http://localhost:13333/gaa').then(res => res.text());

    console.log(output1, output2, output3, output4, output5);
    process.exit(0);
});