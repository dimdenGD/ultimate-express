// must support multiple mountpaths

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
const router = express();

router.get('/asdf', (req, res) => {
    res.send('asdf');
});

app.use('/abc', router);
app.use('/def', router);

app.use((req, res, next) => {
    res.send('404');
});

console.log(router.mountpath); // should be last one

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res = await fetchTest('http://localhost:13333/abc/asdf');
    console.log(await res.text());

    res = await fetchTest('http://localhost:13333/def/asdf');
    console.log(await res.text());

    res = await fetchTest('http://localhost:13333/ghi/asdf');
    console.log(await res.text());

    process.exit(0);
})
