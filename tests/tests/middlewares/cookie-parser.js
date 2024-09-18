// must support cookie parser

const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser());

app.get('/abc', (req, res) => {
    console.log(req.cookies);
    res.send('ok');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    await Promise.all([
        fetch('http://localhost:13333/abc', {
            headers: {
                'Cookie': 'abc=123; def=456'
            }
        }).then(res => res.text())
    ]);

    process.exit(0);

});