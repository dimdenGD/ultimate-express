'use strict';

module.exports = {
    name: 'routing/middlewares-100',
    path: '/90',
    setup(app) {
        for (let i = 0; i < 100; i++) {
            app.use((req, res, next) => {
                req.middlewareCount = i;
                next();
            });
        }

        app.get('/90', (req, res) => {
            res.send(String(req.middlewareCount));
        });
    }
};
