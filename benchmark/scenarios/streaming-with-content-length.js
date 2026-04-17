'use strict';

module.exports = {
    name: 'streaming/writable-with-content-length',
    path: '/stream-with-content-length',
    wrk: {
        connections: 50
    },
    setup(app, express, context) {
        app.get('/stream-with-content-length', (req, res) => {
            context.pipeLargeStream(res, true);
        });
    }
};
