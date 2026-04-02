'use strict';

module.exports = {
    name: 'routing/routes-1000',
    path: '/999',
    setup(app) {
        for (let i = 0; i < 1000; i++) {
            app.get(`/${i}`, (req, res) => res.send('ok'));
        }
    }
};
