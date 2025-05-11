// error handling middleware inside router

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
const router = express.Router();
app.set('env', 'production');

router.get('/test', (req, res) => {
    throw new Error('test');
});

app.use(router);

app.use((err, req, res, next) => {
    res.status(500).send(`whoops!`);
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test').then(res => res.text());
    console.log(response);
    process.exit(0);
});