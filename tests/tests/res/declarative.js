// must support declarative response

const express = require("express");

const app = express();
const app2 = express();
app2.set('etag', false);

app.get('/test', (req, res) => {
    res.send('Hello World');
});

app.get('/test2', (req, res) => {
    res.send(`test ${req.query.name} sfdgd ${req.query.name2}`);
});

app.get('/test3/:id', (req, res) => {
    res.send(req.params.id);
});

app.get('/test4', (req, res) => {
    res.send(req.query.name);
});

app.get('/test5/:id', (req, res) => {
    res.send(req.query.name + ' ' + req.params.id);
});

app.get('/test6', (req, res) => {
    res.send(req.query.name + ' ' + req.query.name2 + ' ' + req.query.name3);
});

app.get('/test7', (req, res) => {
    res.send(202);
});

app.get('/test8', (req, res) => {
    res.header('x-test', 'test').send('test');
});

app2.get('/test', (req, res) => {
    res.send('Hello World');
});

app2.get('/test2', (req, res) => {
    res.send(`test ${req.query.name} sfdgd ${req.query.name2}`);
});

app2.get('/test3/:id', (req, res) => {
    res.send(req.params.id);
});

app2.get('/test4', (req, res) => {
    res.send(req.query.name);
});

app2.get('/test5', (req, res) => {
    res.send(req.query.name + ' ' + req.params.id);
});

app2.get('/test6', (req, res) => {
    res.send(req.query.name + ' ' + req.query.name2 + ' ' + req.query.name3);
});

app2.get('/test7', (req, res) => {
    res.send(202);
});

app2.get('/test8', (req, res) => {
    res.header('x-test', 'test').send('test');
});

// app.get('/test9/:id', ({ params: { id }, query: { name } }, res) => {
//     res.setHeader('x-powered-by', 'benchmark')
//         .setHeader('content-type', 'text/plain')
//         .send(`${id} ${name}`);
// });

app.listen(13333, async () => {
    app2.listen(13334, async () => {
        console.log('Server is running on port 13333');
        console.log('Server is running on port 13334');

        const responses = await Promise.all([
            fetch('http://localhost:13333/test').then(res => [res.text(), res.headers.get('etag')]),
            fetch('http://localhost:13333/test2?name=test&name2=test2').then(res => res.text()),
            fetch('http://localhost:13333/test3/123').then(res => res.text()),
            fetch('http://localhost:13333/test4?name=test').then(res => res.text()),
            fetch('http://localhost:13333/test5/123?name=test').then(res => res.text()),
            fetch('http://localhost:13333/test6?name=test&name2=test2&name3=test3').then(res => res.text()),
            fetch('http://localhost:13333/test7').then(res => res.status),
            fetch('http://localhost:13333/test8').then(res => res.headers.get('x-test')),
            // fetch('http://localhost:13333/test9/123?name=test').then(res => res.text()),

            fetch('http://localhost:13334/test').then(res => res.text()),
            fetch('http://localhost:13334/test2?name=test&name2=test2').then(res => res.text()),
            fetch('http://localhost:13334/test3/123').then(res => res.text()),
            fetch('http://localhost:13334/test4?name=test').then(res => res.text()),
            fetch('http://localhost:13334/test5/123?name=test').then(res => res.text()),
            fetch('http://localhost:13334/test6?name=test&name2=test2&name3=test3').then(res => res.text()),
            fetch('http://localhost:13334/test7').then(res => res.status),
            fetch('http://localhost:13334/test8').then(res => res.headers.get('x-test')),
        ]);

        console.log(responses);
        process.exit(0);
    });
});