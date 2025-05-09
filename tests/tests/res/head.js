// must support HEAD method for res.send()

const express = require("express");
const net = require("net");

async function sendRequest(method, url, arrayHeaders) {
    // arrayHeaders is an array of [key, value] pairs
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        const [host, port] = url.split('://')[1].split('/')[0].split(':');
        const path = '/' + url.split('/').slice(3).join('/');

        client.connect(parseInt(port), host, () => {
            let request = `${method} ${path} HTTP/1.1\r\n`;
            request += `Host: ${host}:${port}\r\n`;
            
            for (const [key, value] of arrayHeaders) {
                request += `${key}: ${value}\r\n`;
            }
            
            request += '\r\n';

            client.on('data', (data) => {
                resolve(data.toString());
            });
            
            client.write(request);

        });
    });
}
const app = express();

// app.use(require("../../middleware"));

app.get('/test', (req, res) => {
    res.send('Hello World');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await sendRequest('HEAD', 'http://localhost:13333/test', []);
    const body = response.split('\r\n\r\n')[1];
    const contentLength = response.match(/Content-Length: (\d+)/)[1];
    console.log([contentLength, body.length]);

    process.exit(0);
});