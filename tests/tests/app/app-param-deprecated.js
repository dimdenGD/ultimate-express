// must support app.param() with deprecated callback syntax (function as first argument)

const express = require("express");

const app = express();

// Deprecated syntax: app.param(callback)
// This allows defining a custom param handler factory
app.param(function (name, fn) {
    // Custom param handler that wraps the provided function
    if (typeof fn === 'number') {
        return function (req, res, next, val) {
            console.log('custom handler for', name, 'with option', fn);
            req.params[name] = val + '-modified';
            next();
        };
    }
    return fn;
});

// Use the deprecated syntax with a number as second argument
app.param('userId', 42);

app.get('/user/:userId', function (req, res) {
    console.log('userId param:', req.params.userId);
    res.send('user route');
});

app.param('postId', 100);

app.get('/user/:userId/post/:postId', function (req, res) {
    console.log('userId:', req.params.userId);
    console.log('postId:', req.params.postId);
    res.send('user post route');
});

app.param('itemId', function (req, res, next, val) {
    console.log('standard param handler for itemId:', val);
    next();
});

app.get('/item/:itemId', function (req, res) {
    console.log('itemId param:', req.params.itemId);
    res.send('item route');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response1 = await fetch('http://localhost:13333/user/123');
    console.log('status:', response1.status);

    const response2 = await fetch('http://localhost:13333/user/456/post/789');
    console.log('status:', response2.status);

    const response3 = await fetch('http://localhost:13333/item/abc');
    console.log('status:', response3.status);

    process.exit(0);
});
