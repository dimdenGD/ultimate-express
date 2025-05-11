// must support router options

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();
app.set("case sensitive routing", false);
app.set("strict routing", false);
const router = express.Router({
    caseSensitive: true,
    strict: true
});

router.get('/TEST', (req, res) => {
    res.send('hi');
});

router.get('/asdf/', (req, res) => {
    res.send('hi');
});

app.use('/TEST', router);


app.get("/ASDF", (req, res) => {
    res.send('asdf');
});

app.get("/def/", (req, res) => {
    res.send('def');
});

app.use((req, res, next) => {


    res.send('404');
});

app.listen(13333, async () => {

    console.log('Server is running on port 13333');

    let responses = await Promise.all([
        fetchTest('http://localhost:13333/TEST').then(res => res.text()),
        fetchTest('http://localhost:13333/TEST/TEST').then(res => res.text()),
        fetchTest('http://localhost:13333/test/test').then(res => res.text()),
        fetchTest('http://localhost:13333/test/TEST/').then(res => res.text()),
        fetchTest('http://localhost:13333/Test/Test').then(res => res.text()),
        fetchTest('http://localhost:13333/test/TeST').then(res => res.text()),
        fetchTest('http://localhost:13333/Test/test/').then(res => res.text()),

        fetchTest('http://localhost:13333/asdf').then(res => res.text()),
        fetchTest('http://localhost:13333/asdf/').then(res => res.text()),
        fetchTest('http://localhost:13333/def').then(res => res.text()),
        fetchTest('http://localhost:13333/def/').then(res => res.text()),

        fetchTest('http://localhost:13333/ASDF').then(res => res.text()),
        fetchTest('http://localhost:13333/ASDF/').then(res => res.text()),
        fetchTest('http://localhost:13333/def/').then(res => res.text()),

        fetchTest('http://localhost:13333/TEST/asdf').then(res => res.text()),
        fetchTest('http://localhost:13333/TEST/asdf/').then(res => res.text()),
        fetchTest('http://localhost:13333/TEST/asdf/asdf').then(res => res.text()),
        fetchTest('http://localhost:13333/TEST/asdf/asdf/').then(res => res.text()),
    ]);

    console.log(responses.join(' '));
    process.exit(0);
});