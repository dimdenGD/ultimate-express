// must support compression middleware

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
            request += `Connection: close\r\n`;
            
            request += '\r\n';

            let fullData = '';

            client.on('data', data => {
                fullData += data.toString('utf-8');
            });

            client.on('end', () => {
                const rawHttpMessage = fullData;
                const parts = rawHttpMessage.split(/\r?\n\r?\n/);
                const headersPart = parts[0];
                const bodyPart = parts.slice(1).join('\n\n');
                const headersEndIndex = rawHttpMessage.indexOf('\r\n\r\n') + 4; 
                const bodyBuffer = fullData.slice(headersEndIndex);
                resolve(bodyBuffer);
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

    console.log('1');
    let compressedResponse = await sendRequest('GET', 'http://localhost:13333/abc');
    console.log(compressedResponse);

    console.log('2');
    let uncompressedResponse = await fetch('http://localhost:13333/abc', {
        headers: {
            'Connection': 'close',
        }
    });
    console.log(await uncompressedResponse.text());

    // second run
    console.log('3');
    compressedResponse = await sendRequest('GET', 'http://localhost:13333/abc');
    console.log(compressedResponse);

    console.log('4');
    uncompressedResponse = await fetch('http://localhost:13333/abc', {
        headers: {
            'Connection': 'close',
        }
    });
    console.log(await uncompressedResponse.text());

    process.exit(0);

});