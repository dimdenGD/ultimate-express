"use strict";

const express = require("../src/index");

const LONG_STRING = "hello".repeat(10_000);

const app = express();

app.set("etag", false);
app.set("declarative responses", false);
app.set("catch async errors", true);

app.get("/", (req, res) => {
  res.send("ok");
});

app.get("/long-string", (req, res) => {
  res.send(LONG_STRING);
});

app.use((req, res) => {
  console.error("404:", req.method, req.url.toString());
  res.status(404).json({
    message: "NOT FOUND",
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
  });
});

app.use((err, req, res, _next) => {
  console.error("500:", req.method, req.url.toString(), err);
  res.status(500).json({
    message: err.message,
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
  });
});

app.listen((process.platform === "linux" || process.platform === "darwin") ? "/tmp/express-bench.sock" : 3000, () => {
    console.log("SERVER_READY");
});
