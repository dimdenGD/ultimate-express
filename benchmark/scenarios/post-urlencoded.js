'use strict';

module.exports = {
    name: 'middlewares/body-urlencoded',
    path: '/abc',
    wrk: {
        script: 'post-urlencoded.lua',
        connections: 100
    },
    verify: {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'name=ultimate&value=express&feature=benchmark&count=12345'
    },
    setup(app, express) {
        app.use(express.urlencoded({ extended: false }));
        app.post('/abc', (req, res) => {
            res.send(`${Object.keys(req.body).length}`);
        });
    }
};
