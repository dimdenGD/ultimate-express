// unexpected error handling inside router

const express = require("express");

const app = express();

// app.use(require("../../middleware"));

const router = express.Router();
app.set('env', 'production');

router.get('/test', (req, res) => {
    throw new Error('Ignore this error, its used in a test');
});

app.use(router);

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/test').then(res => res.text());
    console.log(response);
    process.exit(0);
});