// must support req.header()

const net = require("net");
const express = require("express");

// this is needed to actually test multiple headers with the same name
// because fetch just combines them into one
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
            
            client.write(request);

            setTimeout(() => {
                client.destroy();
                resolve();
            }, 100);
        });
    });
}

const app = express();

app.use(require("../../middleware"));

app.get("/test", (req, res) => {
    console.log(req.header('X-Test'));
    res.send("test");
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res;
    res = await fetch('http://localhost:13333/test');
    console.log(await res.text());

    res = await fetch('http://localhost:13333/test', {
        headers: {
            'X-Test': 'test'
        }
    });
    console.log(await res.text());

    const headers = [];
    headers.push(['X-Test', 'test']);
    res = await sendRequest('GET', 'http://localhost:13333/test', headers);

    process.exit(0);
})
