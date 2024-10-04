// router must be a function

const express = require("express");

const app = express();
const router = new express.Router();

router.get('/test', (req, res) => {
    res.send('test');
});

app.use((req, res, next) => {
    router(req, res, next);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let output1 = await fetch('http://localhost:13333/test').then(res => res.text());

    console.log(output1);
    process.exit(0);
});