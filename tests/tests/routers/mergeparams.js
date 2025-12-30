// must support mergeParams

const express = require("express");

const app = express();
const router = express.Router({ mergeParams: true });
const router2 = express.Router({ mergeParams: true });

app.use('/:param1', router);
router.use('/:param2', router2);

router2.get('/:param3', (req, res, next) => {
    if(req.params.param1 === '1') {
        return next();
    }
    res.send([req.params.param1, req.params.param2, req.params.param3]);
});

app.get('/:param4/:param5/:param6', (req, res) => {
    res.send([req.params.param4, req.params.param5, req.params.param6]);
});


app.use((req, res, next) => {

    res.send('404');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let responses = await Promise.all([
        fetch('http://localhost:13333/1/2/3').then(res => res.text()),
        fetch('http://localhost:13333/4/5/6').then(res => res.text()),
    ]);


    console.log(responses);

    process.exit(0);

});