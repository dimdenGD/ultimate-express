// must support "env" setting for environment configuration

const express = require("express");

const app = express();
const app2 = express();
const app3 = express();

// Test default env value (should be 'development' or NODE_ENV)
const defaultEnv = app.get('env');

// Set different environments
app.set('env', 'production');
app2.set('env', 'development');
app3.set('env', 'staging');

app.get('/env', (req, res) => {
    res.send(req.app.get('env'));
});

app2.get('/env', (req, res) => {
    res.send(req.app.get('env'));
});

app3.get('/env', (req, res) => {
    res.send(req.app.get('env'));
});

app.listen(13333, async () => {
    app2.listen(13334, async () => {
        app3.listen(13335, async () => {
            // Test default env value
            console.log(typeof defaultEnv);
            console.log(defaultEnv === 'development' || defaultEnv === process.env.NODE_ENV);

            // Test app.get('env') returns the set value
            console.log(app.get('env'));
            console.log(app2.get('env'));
            console.log(app3.get('env'));

            // Test env value accessible via request
            const outputs = await Promise.all([
                fetch('http://localhost:13333/env').then(res => res.text()),
                fetch('http://localhost:13334/env').then(res => res.text()),
                fetch('http://localhost:13335/env').then(res => res.text()),
            ]);

            console.log(outputs);

            process.exit(0);
        });
    });
});
