'use strict';

module.exports = {
    name: 'routing/nested-routers',
    path: '/abccc/nested/ddd',
    setup(app, express) {
        const outerRouter = express.Router();
        const middleRouter = express.Router();
        const innerRouter = express.Router();

        innerRouter.get('/ddd', (req, res) => {
            res.send('nested');
        });

        middleRouter.use('/nested', innerRouter);
        outerRouter.use('/abccc', middleRouter);
        app.use('/', outerRouter);
    }
};
