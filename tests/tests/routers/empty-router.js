// must support empty routers

const express = require("express");

const app = express();
const router = new express.Router();

router.get('/', (req, res) => {
    res.send('test2');
});

app.use('/test', router);

app.use((req, res, next) => {
    res.send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let output1 = await fetch('http://localhost:13333/test').then(res => res.text());

    console.log(output1);
    process.exit(0);
});