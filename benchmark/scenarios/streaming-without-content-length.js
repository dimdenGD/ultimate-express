'use strict';

module.exports = {
    name: 'streaming/writable-no-content-length',
    path: '/stream-without-content-length',
    wrk: {
        connections: 20
    },
    setup(app, express, context) {
        app.get('/stream-without-content-length', (req, res) => {
            context.pipeLargeStream(res, false);
        });
    }
};
