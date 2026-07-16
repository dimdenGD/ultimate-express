// v5 req.params must have null prototype
// SKIP_V4: Express 5 uses null prototype for params

const express = require("express");

const app = express({ version: 5 });

app.get('/users/:id', (req, res) => {
    const hasToString = 'toString' in req.params;
    const hasHasOwn = 'hasOwnProperty' in req.params;
    res.json({
        id: req.params.id,
        hasToString,
        hasHasOwn
    });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/users/42').then(res => res.text());
    console.log(response);

    process.exit(0);
});
