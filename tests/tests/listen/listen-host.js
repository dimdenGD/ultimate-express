// must listen on specified host

const express = require("express");

const app = express();

app.listen(13333, 'localhost', () => {
    console.log('Server is running on port 13333');

    fetch('http://localhost:13333').then(res => res.text()).then(body => {
        console.log(body);
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });
});