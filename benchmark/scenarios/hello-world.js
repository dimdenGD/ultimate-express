'use strict';

module.exports = {
    name: 'routing/hello-world',
    path: '/',
    setup(app) {
        app.get('/', (req, res) => res.send('Hello world'));
    }
};
