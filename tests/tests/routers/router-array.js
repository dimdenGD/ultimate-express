// must support array of routers in use

const express = require("express");
const { fetchTest } = require("../../utils");
require('express-async-errors');

const app = express();
app.set('env', 'production');
app.set('catch async errors', true);

const router = express.Router();
router.get('/test', async (req, res) => {
    await new Promise((resolve, reject) => {
        reject(new Error('Ignore this error, its used in a test'));
    });
});

app.use([router]);

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test').then(res => res.text());
    console.log(response);
    process.exit(0);
});