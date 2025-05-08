// must support express-subdomain middleware

const express = require("express");
const subdomain = require("express-subdomain");
const net = require("net");

async function sendRequest(method, url, fakeHost) {
    // arrayHeaders is an array of [key, value] pairs
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        const [host, port] = url.split('://')[1].split('/')[0].split(':');
        const path = '/' + url.split('/').slice(3).join('/');

        client.connect(parseInt(port), host, () => {
            let request = `${method} ${path} HTTP/1.1\r\n`;
            request += `Host: ${fakeHost}:${port}\r\n`;
            
            
            request += '\r\n';

            client.on('data', data => {
                resolve(data.toString());
            });
            
            client.write(request);
        });
    });
}

const app = express();

app.use(require("../../middleware"));

const router = express.Router();

console.log(typeof router);

router.get('/abc', (req, res) => {
    res.send('Hello World');
});

app.use('/', subdomain('www', router));
app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await sendRequest('GET', 'http://localhost:13333/abc', 'www.localhost.com');
    console.log(response.split('\r\n').slice(-1)[0]);

    process.exit(0);

});