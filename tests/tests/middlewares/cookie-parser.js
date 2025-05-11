// must support cookie parser

const express = require("express");
const { fetchTest } = require("../../utils");
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
        fetchTest('http://localhost:13333/abc', {
            headers: {
                'Cookie': `abc=123; def=456; ghi=j${encodeURIComponent(':' + JSON.stringify({n: 789}))};`
            }
        }).then(res => res.text())
    ]);

    process.exit(0);

});