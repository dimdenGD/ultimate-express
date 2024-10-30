// must handle invalid path

const express = require("express");
const app = express();

app.use(express.static('public'));

app.use((req, res, next) => {
    res.status(404).send('Not found');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetch('http://localhost:13333/bg%test', {
        method: 'GET'
    });

    const text = await response.text();
    console.log(text);

    process.exit(0);

});