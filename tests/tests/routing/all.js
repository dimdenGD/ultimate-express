// must support app.all

import express from "express";

const app = express();

app.all('/test', (req, res) => {
    res.send('test');
});

app.use((req, res) => {
    res.send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res = await fetch('http://localhost:13333/test');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/test', {
        method: 'POST',
    });
    console.log(await res.text());

    res = await fetch('http://localhost:13333/test', {
        method: 'PUT',
    });
    console.log(await res.text());

    res = await fetch('http://localhost:13333/test', {
        method: 'DELETE',
    });
    console.log(await res.text());

    res = await fetch('http://localhost:13333/test', {
        method: 'PATCH',
    });
    console.log(await res.text());

    res = await fetch('http://localhost:13333/testas', {
        method: 'OPTIONS',
    });
    console.log(await res.text());

    process.exit(0);
})
