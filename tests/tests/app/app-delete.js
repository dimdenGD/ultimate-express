// must support app.delete() and app.del()

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.delete('/delete', (req, res) => {
    res.send('delete');
});

app.del('/del', (req, res) => {
    res.send('del');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const outputs = await Promise.all([
        fetchTest('http://localhost:13333/delete', {method: 'DELETE'}).then(res => res.text()),
        fetchTest('http://localhost:13333/del', {method: 'DELETE'}).then(res => res.text()),
    ]);

    console.log(outputs);
    process.exit(0);
});
