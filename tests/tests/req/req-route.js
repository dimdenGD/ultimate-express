// must support req.route for accessing current route information

const express = require("express");

const app = express();

app.get('/simple', (req, res) => {
    console.log('simple route path:', req.route.path);
    res.send('ok');
});

app.get('/users/:id', (req, res) => {
    console.log('param route path:', req.route.path);
    res.send('user');
});

app.get('/posts/:postId/comments/:commentId', (req, res) => {
    console.log('multi param route path:', req.route.path);
    res.send('comment');
});

app.route('/resource')
    .get((req, res) => {
        console.log('resource GET path:', req.route.path);
        res.send('get resource');
    })
    .post((req, res) => {
        console.log('resource POST path:', req.route.path);
        res.send('post resource');
    });

app.get('/check-defined', (req, res) => {
    console.log('route handler req.route defined:', req.route !== undefined);
    console.log('route handler req.route.path:', req.route.path);
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    await fetch('http://localhost:13333/simple').then(res => res.text());

    await fetch('http://localhost:13333/users/123').then(res => res.text());

    await fetch('http://localhost:13333/posts/1/comments/2').then(res => res.text());

    await fetch('http://localhost:13333/resource').then(res => res.text());
    await fetch('http://localhost:13333/resource', { method: 'POST' }).then(res => res.text());

    await fetch('http://localhost:13333/check-defined').then(res => res.text());

    process.exit(0);
});
