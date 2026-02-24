// must support req.hostname

const net = require("net");
const express = require("express");

async function sendRequest(method, url, customHost) {
    // arrayHeaders is an array of [key, value] pairs
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        const [host, port] = url.split('://')[1].split('/')[0].split(':');
        const path = '/' + url.split('/').slice(3).join('/');

        client.on('data', () => client.end());
        client.on('end', resolve);

        client.connect(parseInt(port), host, () => {
            let request = `${method} ${path} HTTP/1.1\r\n`;
            for (const [key, value] of customHost) {
                request += `${key}: ${value}\r\n`;
            }
            request += '\r\n';
            client.write(request);
        });
    });
}

const app = express();
app.get("/test", (req, res) => {
    console.log(req.hostname);
    res.send("test");
});

// trust proxy app
const trustedApp = express();
trustedApp.set('trust proxy', true);

trustedApp.get("/test", (req, res) => {
    console.log(req.hostname);
    res.send("ok");
});

app.listen(13333, async () => {
    trustedApp.listen(13334, async () => {
        console.log('Server is running on port 13333');

        let res;

        res = await fetch('http://localhost:13333/test');
        console.log(await res.text());

        // host with port
        res = await sendRequest('GET', 'http://localhost:13333/test', [
            ['Host', 'example.com:8080']
        ]);

        // IPv6 literal with port
        res = await sendRequest('GET', 'http://localhost:13333/test', [
            ['Host', '[::1]:13333']
        ]);

        // IPv6 literal without port
        res = await sendRequest('GET', 'http://localhost:13333/test', [
            ['Host', '[::1]']
        ]);

        // --- trust proxy tests ---

        // trusted: X-Forwarded-Host present
        res = await sendRequest('GET', 'http://localhost:13334/test', [
            ['Host', 'real.host.com'],
            ['X-Forwarded-Host', 'forwarded.example.com']
        ]);

        // trusted: X-Forwarded-Host with comma (multiple values)
        res = await sendRequest('GET', 'http://localhost:13334/test', [
            ['Host', 'real.host.com'],
            ['X-Forwarded-Host', 'first.example.com, second.example.com']
        ]);

        // trusted: X-Forwarded-Host with port
        res = await sendRequest('GET', 'http://localhost:13334/test', [
            ['Host', 'real.host.com'],
            ['X-Forwarded-Host', 'forwarded.example.com:8443']
        ]);

        // trusted: no X-Forwarded-Host → should fallback to Host header
        res = await sendRequest('GET', 'http://localhost:13334/test', [
            ['Host', 'fallback.host.com']
        ]);

        process.exit(0);
    });
});
