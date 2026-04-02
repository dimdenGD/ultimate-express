'use strict';

const artTemplate = require("express-art-template");

module.exports = {
    name: 'engines/art',
    path: '/test',
    setup(app, express, context) {
        context.ensureAssets();
        app.engine('art', artTemplate);
        app.set('view engine', 'art');
        app.set('views', context.viewsDir);
        app.set('view options', {
            ignore: ['Math', 'Date', 'JSON', 'encodeURIComponent'],
            minimize: false
        });


        app.get('/test', (req, res) => {
            res.render('benchmark', {
                title: 'Benchmark',
                items: ['a', 'b', 'c', 'd']
            });
        });
    }
};
