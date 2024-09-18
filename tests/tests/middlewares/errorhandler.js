// must support errorhandler middleware

const express = require("express");
const errorhandler = require('errorhandler')

const app = express();

app.get('/abc', (req, res) => {
    throw new Error('test');
    res.send(req.body);
});

app.use(errorhandler({
    log: (err) => {
        console.log(`hi`, err.message);
    }
}));

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/abc');

    process.exit(0);

});