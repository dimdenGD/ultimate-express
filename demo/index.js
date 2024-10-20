
const express = require('../src/index');
const compression = require('compression');

const app = express();

app.set('catch async errors');

app.use(compression({
    threshold: 1,
}));

app.get('/long-response', async(req, res) => {
    res.send('Hello World'.repeat(1000) + 'end');
});

app.get('/error', async(req, res) => {
    throw new Error('test')
});

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send(err.message)
})

app.listen(13333, async () => {
    console.log('Server is running on port 13333');
});