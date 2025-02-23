'use strict';

const express = require('express-4');
const app = express();

app.get('/', async (req, res) => res.send('Hello world'));
app.listen(3001);
