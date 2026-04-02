// Test req.secure property for HTTPS and HTTP connections with trust proxy
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // ignore self-signed certificate error

const express = require("express");
const https = require("https");
const fs = require("fs");

// HTTP app without trust proxy
const app = express();

// HTTP app with trust proxy enabled
const appTrustProxy = express();
appTrustProxy.set('trust proxy', true);

// HTTPS app
const appHttps = express({
    uwsOptions: {
        key_file_name: "tests/parts/localhost.key",
        cert_file_name: "tests/parts/localhost.crt",
    },
});

app.get("/test", (req, res) => {
    res.send(String(req.secure));
});

appTrustProxy.get("/test", (req, res) => {
    res.send(String(req.secure));
});

appHttps.get("/test", (req, res) => {
    res.send(String(req.secure));
});

let httpsServer = appHttps;
// if is express app, create a https server
if (!appHttps.uwsApp) {
    httpsServer = https.createServer(
        {
            key: fs.readFileSync("tests/parts/localhost.key", "utf8"),
            cert: fs.readFileSync("tests/parts/localhost.crt", "utf8"),
        },
        appHttps
    );
}

app.listen(13333, async () => {
    appTrustProxy.listen(13334, async () => {
        httpsServer.listen(13335, async () => {
            console.log("Server is running on port 13333");

            const outputs = await Promise.all([
                // HTTP without trust proxy - should be false
                fetch('http://localhost:13333/test').then(res => res.text()),
                // HTTP with trust proxy and X-Forwarded-Proto: https - should be true
                fetch('http://localhost:13334/test', { headers: { 'X-Forwarded-Proto': 'https' } }).then(res => res.text()),
                // HTTP with trust proxy and X-Forwarded-Proto: http - should be false
                fetch('http://localhost:13334/test', { headers: { 'X-Forwarded-Proto': 'http' } }).then(res => res.text()),
                // HTTP with trust proxy but no header - should be false
                fetch('http://localhost:13334/test').then(res => res.text()),
                // HTTPS - should be true
                fetch('https://localhost:13335/test').then(res => res.text()),
            ]);

            console.log(outputs.join(' '));
            process.exit(0);
        });
    });
});
