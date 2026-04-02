'use strict';

module.exports = {
    name: 'middlewares/express-static',
    path: '/static/static-250kb.txt',
    setup(app, express, context) {
        context.ensureAssets();
        app.use('/static', express.static(context.assetsDir));
    }
};
