// must match express behavior for non-slash route start

const express = require("express");

const app = express();
const router = express.Router();
const router2 = express.Router();
const router3 = express.Router();

app.get("test", (req, res) => {
    res.send("test");
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res = await fetch('http://localhost:13333/test');
    console.log(await res.text());

    process.exit(0);
})
