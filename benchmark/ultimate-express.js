'use strict';

const express = require('../src/index');
const app = express();
app.set("etag", false);
app.set("declarative responses", false);

app.get('/', async (req, res) => res.send('Hello world'));
app.listen(3000);
