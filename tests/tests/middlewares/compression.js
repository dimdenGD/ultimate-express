// must support compression middleware OFF

const express = require("express");
const compression = require("compression");
const net = require("net");

async function sendRequest(method, url) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        const [host, port] = url.split('://')[1].split('/')[0].split(':');
        const path = '/' + url.split('/').slice(3).join('/');

        client.connect(parseInt(port), host, () => {
            let request = `${method} ${path} HTTP/1.1\r\n`;
            request += `Host: ${host}:${port}\r\n`;
            request += `Accept-Encoding: gzip, deflate, br\r\n`;
            
            request += '\r\n';

            client.on('data', data => {
                resolve(data.toString());
            });
            
            client.write(request);
        });
    });
}

const app = express();

app.use(compression({
    threshold: 1,
}));

app.get('/abc', (req, res) => {
    res.send('Hello World'.repeat(100));
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    const response = await sendRequest('GET', 'http://localhost:13333/abc');
    console.log(response.split('\r\n').slice(-6).join('\r\n'));

    process.exit(0);

});