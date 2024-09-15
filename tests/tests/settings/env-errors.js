// must support "env" errors

import express from "express";

const app = express();
const app2 = express();
app.set('env', 'production');
app2.set('env', 'development');

app.get('/abc', (req, res) => {
    throw new Error('Ignore this error, its used in a test');
});

app2.get('/abc', (req, res) => {
    throw new Error('Ignore this error, its used in a test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let outputs = await Promise.all([
        fetch('http://localhost:13333/abc').then(res => res.text()),
    ]);

    console.log(outputs.join(' ').includes('Internal Server Error'));

    app2.listen(13334, async () => {
        console.log('Server is running on port 13334');

        let outputs2 = await Promise.all([
            fetch('http://localhost:13334/abc').then(res => res.text()),
        ]);

        console.log(outputs2.join(' ').includes('Ignore this error, its used in a test'));
        process.exit(0);
    });

});