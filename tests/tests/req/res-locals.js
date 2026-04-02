// test res.locals as object for response-level local variables

const express = require("express");
const path = require("path");

const app = express();

app.set('view engine', 'pug');
app.set('views', 'tests/parts');
app.set('env', 'production');

// Middleware that sets res.locals
app.use((req, res, next) => {
    // res.locals should be an object
    console.log('res.locals is object:', typeof res.locals === 'object' && res.locals !== null);
    
    // Set values in middleware
    res.locals.fromMiddleware = 'middleware-value';
    res.locals.requestId = req.query.id || 'default';
    next();
});

// Route that accesses res.locals set by middleware
app.get('/test-middleware', (req, res) => {
    console.log('fromMiddleware:', res.locals.fromMiddleware);
    console.log('requestId:', res.locals.requestId);
    res.send('ok');
});

// Route that sets and reads res.locals
app.get('/test-route', (req, res) => {
    res.locals.routeValue = 'set-in-route';
    console.log('routeValue:', res.locals.routeValue);
    res.send('ok');
});

// Route that tests res.locals passed to template
app.get('/test-render', (req, res) => {
    res.locals.asdf = 'locals-in-template';
    res.render('index.pug', { title: 'Test', message: 'Hello' });
});

// Multiple middleware chain to test locals propagation
app.get('/test-chain',
    (req, res, next) => {
        res.locals.step1 = 'first';
        next();
    },
    (req, res, next) => {
        console.log('chain step1:', res.locals.step1);
        res.locals.step2 = 'second';
        next();
    },
    (req, res) => {
        console.log('chain step1:', res.locals.step1);
        console.log('chain step2:', res.locals.step2);
        res.send('ok');
    }
);

// Route to test request-scoped isolation
app.get('/test-scope', (req, res) => {
    // Each request should have its own res.locals
    res.locals.scopeTest = req.query.value;
    console.log('scope value:', res.locals.scopeTest);
    res.send('ok');
});

app.use((err, req, res, next) => {
    console.log('error:', err.message);
    res.status(500).send('error');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    // Test 1: res.locals is available in middleware and route handlers
    console.log('--- Test middleware access ---');
    await fetch('http://localhost:13333/test-middleware?id=123');

    // Test 2: res.locals can be set in route handler
    console.log('--- Test route access ---');
    await fetch('http://localhost:13333/test-route');

    // Test 3: res.locals is passed to templates during rendering
    console.log('--- Test template rendering ---');
    const renderResponse = await fetch('http://localhost:13333/test-render').then(r => r.text());
    console.log('render contains locals:', renderResponse.includes('locals-in-template'));

    // Test 4: res.locals propagates through middleware chain
    console.log('--- Test middleware chain ---');
    await fetch('http://localhost:13333/test-chain');

    // Test 5: res.locals is request-scoped (different for each request)
    console.log('--- Test request scope ---');
    await fetch('http://localhost:13333/test-scope?value=request1');
    await fetch('http://localhost:13333/test-scope?value=request2');

    process.exit(0);
});
