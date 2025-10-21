// must support http-proxy-middleware
process.env.DEBUG='http-proxy-middleware';

const express = require("express");

const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

const proxyMiddleware = createProxyMiddleware({
  target: "https://api.github.com/",
  changeOrigin: true,
  logger: console,
  on: {
    error: (err, req, res) => {
      console.error(err);
      res.json({
        error: err.message,
      });
    },
  },
});

app.use("/api", proxyMiddleware);

app.listen(13333, async () => {
  console.log("Server is running on port 13333");

  const responses = await fetch("http://localhost:13333/api").then((r) =>
    r.text()
  );
  console.log(responses);

  process.exit(0);
});