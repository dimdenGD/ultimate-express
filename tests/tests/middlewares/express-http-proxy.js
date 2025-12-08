// must support express-http-proxy
process.env.DEBUG = 'express-http-proxy';

const express = require("express");
const proxy = require("express-http-proxy");

const app = express();
app.use('/echo', (req, res) => {
  req.pipe(res);
})

app.use('/proxy', proxy('http://localhost:13333/echo', {
  // parseReqBody: false,
  proxyReqPathResolver: (req) => {
    return '/echo'
  }
}));

app.listen(13333, async () => {
  console.log("Server is running on port 13333");

  const responses = await fetch("http://localhost:13333/proxy", {
    method: "POST",
    body: 'plain text'
  }).then((r) =>
    r.text()
  );
  console.log(responses);

  process.exit(0);
});