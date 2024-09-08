// must support simple routes

import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(13333, () => {
    console.log('Server is running on port 13333');

    fetch('http://localhost:13333/').then(res => res.text()).then(body => {
        console.log(body);
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });
});