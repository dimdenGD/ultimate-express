'use strict';

module.exports = {
    name: 'streaming/readable-hash-4mb',
    path: '/hash-body',
    wrk: {
        script: 'post-hash-body-4mb.lua',
        connections: 25
    },
    verify: {
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream'
        },
        bodyRepeat: {
            char: 'a',
            count: 4 * 1024 * 1024
        }
    },
    setup(app, express, context) {
        app.post('/hash-body', (req, res, next) => {
            context.createHashFromRequest(req, (digest, error) => {
                if (error) {
                    next(error);
                    return;
                }
                res.type('text/plain').send(digest);
            });
        });
    }
};
