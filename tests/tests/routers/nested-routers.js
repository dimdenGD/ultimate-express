// must support nested routers

const express = require("express");

const app = express();
const router = new express.Router();
const router2 = new express.Router();
const router3 = new express.Router();

router.get('/test', (req, res) => {
    res.send('test2');
});

router2.get('/ccc', (req, res) => {
    res.send('ccc');
});

router2.use('/nested', router3);

router2.get("/nested", (req, res) => {
    res.send('nested');
});

router3.get('/ddd', (req, res) => {
    res.send('ddd');
});

app.use('/:test', router);
app.use('/abccc', router2);

app.use((req, res, next) => {
    res.send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const outputs = await Promise.all([
        fetch('http://localhost:13333/test').then(res => res.text()),
        fetch('http://localhost:13333/gdgdf').then(res => res.text()),
        fetch('http://localhost:13333/ccc').then(res => res.text()),
        fetch('http://localhost:13333/abccc').then(res => res.text()),
        fetch('http://localhost:13333/abccc/ddd').then(res => res.text()),
        fetch('http://localhost:13333/abccc/ccc').then(res => res.text()),
        fetch('http://localhost:13333/abccc/ddd/ddd').then(res => res.text()),
        fetch('http://localhost:13333/abccc/nested/ddd').then(res => res.text()),
        fetch('http://localhost:13333/abccc/nested').then(res => res.text()),
    ]);

    console.log(outputs.join(' '));
    process.exit(0);
});