import uWS from 'uWebSockets.js';

const app = uWS.App();

app.get('/', (res, req) => {
    res.end('Hello World');
});

app.listen(13333, () => {
    console.log('Server is running on port 13333');
});