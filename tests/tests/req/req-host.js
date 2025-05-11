// must support req.host

const net = require("net");
const express = require("express");
const { fetchTest } = require("../../utils");

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
            
            client.write(request);

            setTimeout(() => {
                client.destroy();
                resolve();
            }, 100);
        });
    });
}

const app = express();
app.get("/test", (req, res) => {
    console.log(req.host);
    res.send("test");
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let res;
    res = await fetchTest('http://localhost:13333/test');
    console.log(await res.text());

    res = await sendRequest('GET', 'http://localhost:13333/test', 'test:13333');

    process.exit(0);
})
