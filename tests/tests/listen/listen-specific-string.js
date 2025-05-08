// must open specified string port

const express = require("express");

const app = express();

// app.use(require("../../middleware"));

app.listen("13333", () => {
    console.log('Server is running on port 13333');

    fetch('http://localhost:13333').then(res => res.text()).then(body => {
        console.log(body);
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });
});