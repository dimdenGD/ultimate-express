// must support vhost middleware

const net = require("net");

async function sendRequest(method, url, customHost) {
    // arrayHeaders is an array of [key, value] pairs
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        const [host, port] = url.split('://')[1].split('/')[0].split(':');
        const path = '/' + url.split('/').slice(3).join('/');

        client.connect(parseInt(port), host, () => {
            let request = `${method} ${path} HTTP/1.1\r\n`;
            request += `Host: ${customHost}\r\n`;
            
            request += '\r\n';

            client.on('data', (data) => {
                resolve(data.toString().split('\r\n\r\n')[1]);
            });
            
            client.write(request);

        });
    });
}

const express = require("express");
const { fetchTest } = require("../../utils");
const vhost = require("vhost");

const app = express();

app.use(vhost('*.example.com', (req, res) => {
    res.send('Hello from example.com');
}));

app.get('/abc', (req, res) => {
    res.send('hi');
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    console.log(await sendRequest('GET', 'http://localhost:13333/abc', 'example.com'));
    console.log(await sendRequest('GET', 'http://localhost:13333/abc', 'sub.example.com'));
    console.log(await sendRequest('GET', 'http://localhost:13333/abc', 'localhost.com'));

    process.exit(0);

});