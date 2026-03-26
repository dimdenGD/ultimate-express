const uWS = require("uWebSockets.js");
console.log(Object.keys(uWS));
const app = uWS.App().post("/*", (res, req) => {
    console.log("res.getRemoteAddressAsText:", res.getRemoteAddressAsText);
    console.log("res.getRemoteAddressAsText() type:", typeof res.getRemoteAddressAsText(), res.getRemoteAddressAsText());
    if (res.getRemoteAddressAsText()) {
        console.log("as string:", Buffer.from(res.getRemoteAddressAsText()).toString());
    }
    console.log("res.getProxiedRemoteAddressAsText:", res.getProxiedRemoteAddressAsText);
    if(res.getProxiedRemoteAddressAsText) {
        console.log("res.getProxiedRemoteAddressAsText() string:", Buffer.from(res.getProxiedRemoteAddressAsText()).toString());
    }
    console.log("res.getRemoteAddress:", res.getRemoteAddress);
    console.log("res.getRemoteAddress():", res.getRemoteAddress());
    console.log("res.onData:", res.onData);
    console.log("res.onDataV2:", res.onDataV2);
    // Let's test what collectBody looks like. Is it on uWS?
    console.log("uWS.collectBody:", uWS.collectBody);
    console.log("res.collectBody", res.collectBody); // wait, it might not be on res?
    console.log("res.writeStatus:", res.writeStatus);
    res.end("ok");
}).listen(0, (listenSocket) => {
    if (listenSocket) {
        const port = uWS.us_socket_local_port(listenSocket);
        console.log("Listening on " + port);
        
        // Make a request to ourselves
        const http = require("http");
        const req = http.request({
            port: port,
            method: "POST",
            path: "/"
        }, (res) => {
            res.on("data", (d) => console.log(d.toString()));
            res.on("end", () => {
                uWS.us_listen_socket_close(listenSocket);
            });
        });
        req.end("Hello World");
    }
});
