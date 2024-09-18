const uWS = require("uWebSockets.js");

const app = uWS.App();

app.get('/', (res, req) => {
    res.cork(() => {
        res.write('Hello World');
        res.end();
    });
});

app.listen(13333, () => {
    console.log('Server is running on port 13333');
});