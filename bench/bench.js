"use strict";

const autocannon = require("autocannon");
const express = require("../src/index");
const path = require("path");

const LONG_STRING = "hello".repeat(10_000);

const benchmarks = [
  {
    name: "short string",
    path: "/short-string",
  },
  {
    name: "long string",
    path: "/long-string",
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

    app.get("/short-string", (req, res) => {
      res.send("hello");
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

  return new Promise((resolve) => {
    const instance = autocannon(
      {
        url: "http://localhost:3000" + benchmark.path,
        duration: 15,
        connections: 20,
        pipelining: 1,
        headers: benchmark.headers ?? {},
        method: benchmark.method ?? "GET",
        body: benchmark.body ?? undefined,
      },
      (err, result) => {
        resolve(result.requests.average);
      }
    );

    // autocannon.track(instance, { renderProgressBar: false });
  });
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

(async () => {
  let maxName = 0;

  const app = await runServer(benchmark);

  for (const b of benchmarks) maxName = Math.max(maxName, b.name.length);

  for (const b of benchmarks) {
    const results = [];
    for (let i = 0; i < 3; i++) {
      const result = await runBenchmark(b);
      if (i === 0) continue; // discard first run for warmup
      results.push(result);
    }
    const alignedName = b.name.padEnd(maxName, ".");
    const m = median(results);
    console.log(`${alignedName} x ${m.toFixed(0)} req/sec`);
  }
  if (app.uwsApp) {
    app.uwsApp.close();
  } else {
    app.close();
  }
})();
