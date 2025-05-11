// must support res.cookie()

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

const sharedOptions = { maxAge: 1000 };

app.get('/test', (req, res) => {
    res.cookie('test', '1');
    res.cookie('test2', '2', { maxAge: 1000 });
    res.cookie('test3', '3', { maxAge: 1000, path: '/test' });
    res.cookie('test4', '4', { maxAge: 1000, path: '/test', httpOnly: true });
    res.cookie('test5', '5', { maxAge: 1000, path: '/test', secure: true });

    // see: https://github.com/dimdenGD/ultimate-express/issues/68
    res.cookie('test6', '2', sharedOptions);
    res.cookie('test6', '2', sharedOptions);
    console.log(JSON.stringify(sharedOptions))

    res.send('test');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await fetchTest('http://localhost:13333/test');
    console.log(response.headers.get('Set-Cookie').replace(/\d\d\:\d\d\:\d\d/g, 'xx:xx:xx'));
    process.exit(0);
});