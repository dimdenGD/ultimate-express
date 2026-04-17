'use strict';

const compression = require('compression');

module.exports = {
    name: 'middlewares/compression-file',
    path: '/small-file',
    wrk: {
        script: 'compression-small-file.lua',
        connections: 200
    },
    verify: {
        method: 'GET',
        headers: {
            'Accept-Encoding': 'gzip'
        }
    },
    setup(app, express, context) {
        app.use(compression());
        app.get('/small-file', (req, res) => {
            res.type('text/plain').send(context.compressedPayload);
        });
    }
};
