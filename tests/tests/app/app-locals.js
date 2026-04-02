// test app.locals as object for application-level local variables

const express = require("express");

const app = express();

// Set application-level local variables
app.locals.title = 'My App';
app.locals.email = 'test@example.com';
app.locals.version = '1.0.0';

// Log initial app.locals
console.log('app.locals.title:', app.locals.title);
console.log('app.locals.email:', app.locals.email);
console.log('app.locals.version:', app.locals.version);

// Route that accesses app.locals
app.get('/info', (req, res) => {
    // app.locals is accessible via req.app.locals
    console.log('route - title:', req.app.locals.title);
    console.log('route - email:', req.app.locals.email);
    res.send('ok');
});

// Route that modifies app.locals
app.get('/update', (req, res) => {
    req.app.locals.counter = (req.app.locals.counter || 0) + 1;
    console.log('counter:', req.app.locals.counter);
    res.send('updated');
});

// Route to verify shared state
app.get('/check', (req, res) => {
    console.log('check counter:', req.app.locals.counter);
    res.send('checked');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    // Test accessing app.locals from route
    await fetch('http://localhost:13333/info');

    // Test that app.locals is shared between requests
    await fetch('http://localhost:13333/update');
    await fetch('http://localhost:13333/update');
    await fetch('http://localhost:13333/check');

    process.exit(0);
});
