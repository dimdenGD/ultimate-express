// must support app.path()

import express from "express";

const app = express();
const app2 = express();
const app3 = express();
const router = express.Router();

app.use('/abc', app2);
app2.use('/def', app3);

app.use((req, res, next) => {
    res.send('404');
});

console.log(app.path());
console.log(app2.path());
console.log(app3.path());
console.log(router?.path?.());
console.log(app.mountpath, app2.mountpath, app3.mountpath);
