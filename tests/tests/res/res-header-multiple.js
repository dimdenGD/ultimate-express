// must support setting multiple headers with the same name

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

          client.on('data', data => {
              client.destroy();
              resolve(data);
          });
          
          client.write(request);
      });
  });
}

const app = express();

app.use(require("../../middleware"));

app.get("/abc", (req, res) => {
  res.header('set-cookie', ['my_cookie=foo', 'my_cookie2=bar']);
  res.send('ok');
});

app.listen(13333, async () => {
  console.log("Server is running at http://localhost:13333");

  let response = await sendRequest('GET', 'http://localhost:13333/abc', []);
  console.log(
    response
    .toString()
    .split('\r\n')
    .map(line => line.toLowerCase().trim())
    .filter(line => !line.startsWith('date: ') && !line.startsWith('x-powered-by: ') && !line.startsWith('http/') && !line.startsWith('keep-alive:'))
    .sort((a, b) => a.localeCompare(b))
  );
  
  process.exit(0);
});