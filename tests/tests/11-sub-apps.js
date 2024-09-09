// must support sub-apps

import express from "express";

const app = express();
const app2 = express();

app.get('/test', (req, res) => {
    res.send('test1');
});
    
app2.get('/test', (req, res) => {
    res.send('test2');
});

app.use('/asdf', app2);

app.use((req, res, next) => {
    res.send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const outputs = await Promise.all([
        fetch('http://localhost:13333/test').then(res => res.text()),
        fetch('http://localhost:13333/asdf/test').then(res => res.text()),
    ]);

    console.log(outputs.join(' '));
    process.exit(0);
});