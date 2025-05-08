// must support app.delete() and app.del()

const express = require("express");

const app = express();

app.use(require("../../middleware")); 

app.delete('/delete', (req, res) => {
    res.send('delete');
});

app.del('/del', (req, res) => {
    res.send('del');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const outputs = [
        await fetch('http://localhost:13333/delete', {method: 'DELETE'}).then(res => res.text()),
        await fetch('http://localhost:13333/del', {method: 'DELETE'}).then(res => res.text()),
    ];

    console.log(outputs);
    process.exit(0);
});
