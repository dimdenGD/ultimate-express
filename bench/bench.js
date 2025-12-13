"use strict";

const autocannon = require("autocannon");
const express = require("../src/index");
const path = require("path");

const benchmarks = [
  {
    name: "short string",
    path: "/",
    method: "GET",
    response: "hello",
  },
  {
    name: "long string",
    path: "/long",
    method: "GET",
    response: "hello".repeat(10_000),
  },
  {
    name: "static big.jpg",
    path: "/static/big.jpg",
  },
  {
    name: "send-file big.jpg",
    path: "/send-file/big.jpg",
  },
];

function runServer(benchmark) {
  return new Promise((resolve, reject) => {
    const app = express();

    app.set("etag", false);
    app.set("declarative responses", false);
    app.set("catch async errors", true);

    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.text());
    app.use(express.raw());
    app.use("/static", express.static(path.join(__dirname, "../tests/parts")));

    app.get("/send-file/:file", (req, res) =>
      res.sendFile(path.join(__dirname, "../tests/parts", req.params.file))
    );

    app.all(benchmark.path ?? "/", (req, res) => {
      res.send(benchmark.response ?? "");
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

    app.use((err, req, res) => {
      console.error("500:", req.method, req.url.toString(), err);
      res.status(500).json({
        message: err.message,
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
      });
    });

    const server = app.listen(3000, () => resolve(app));

    server.on("error", (err) => {
      console.error("Server error:", err);
      reject(err);
    });
  });
}

async function runBenchmark(benchmark) {
  
  if (global.gc) global.gc();

  const server = await runServer(benchmark);

  return new Promise((resolve) => {
    const instance = autocannon(
      {
        url: "http://localhost:3000" + (benchmark.path ?? "/"),
        duration: 15,
        connections: 20,
        pipelining: 1,
        headers: benchmark.headers ?? {},
        method: benchmark.method ?? "GET",
      },
      (err, result) => {
        if (server.uwsApp) {
          server.uwsApp.close();
        } else {
          server.close();
        }
        resolve(result);
      }
    );

    // autocannon.track(instance, { renderProgressBar: false });
  });
}

(async () => {
  let maxName = 0;
  for (const b of benchmarks) maxName = Math.max(maxName, b.name.length);

  for (const b of benchmarks) {
    const result = await runBenchmark(b);

    const ops = result.requests.average.toFixed(0);
    const alignedName = b.name.padEnd(maxName, ".");

    console.log(`${alignedName} x ${ops} req/sec`);
  }
})();
