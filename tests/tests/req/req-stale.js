// Test req.stale property - must be the boolean inverse of req.fresh

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    res.set('ETag', '"abc123"');
    // req.stale should be the inverse of req.fresh
    console.log('fresh:', req.fresh, 'stale:', req.stale, 'inverse:', req.stale === !req.fresh);
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    // Test 1: Without conditional headers - stale should be true (not fresh)
    const res1 = await fetch('http://localhost:13333/test');
    await res1.text();
    console.log('Test 1 - No conditional headers');

    // Test 2: With If-None-Match matching ETag - stale should be false (fresh)
    const res2 = await fetch('http://localhost:13333/test', {
        headers: {
            'Cache-Control': 'max-age=604800',
            'If-None-Match': '"abc123"'
        }
    });
    await res2.text();
    console.log('Test 2 - If-None-Match matches ETag, status:', res2.status);

    // Test 3: With If-None-Match NOT matching ETag - stale should be true (not fresh)
    const res3 = await fetch('http://localhost:13333/test', {
        headers: {
            'Cache-Control': 'max-age=604800',
            'If-None-Match': '"different"'
        }
    });
    await res3.text();
    console.log('Test 3 - If-None-Match does not match ETag, status:', res3.status);

    process.exit(0);
});
