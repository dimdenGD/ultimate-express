"use strict";

const autocannon = require("autocannon");
const express = require("../src/index");

const benchmarks = [
  {
    name: "short string",
    path: "/",
    response: "hello",
  },
  {
    name: "long string",
    path: "/long",
    response: "hello".repeat(10_000),
  },
];

function runServer(benchmark) {
  return new Promise((resolve, reject) => {
    const app = express();

    app.set("etag", false);
    app.set("declarative responses", false);

    app.all(benchmark.path ?? '/', (req, res) => {
      res.send(benchmark.response ?? '');
    });

    let server;
    server = app.listen(3000, () => resolve(server));
    server.on("error", reject);
  });
}

async function runBenchmark(benchmark) {
  const server = await runServer(benchmark);

  return new Promise((resolve) => {
    const instance = autocannon(
      {
        url: "http://localhost:3000" + benchmark.path ?? '/',
        connections: 50,
        duration: 5,
        pipelining: 1,
        headers: benchmark.headers ?? {},
        method: benchmark.method ?? "GET",
      },
      (err, result) => {
        server?.close();
        resolve(result);
      }
    );

    autocannon.track(instance, { renderProgressBar: false });
  });
}

(async () => {
  let maxName = 0;
  for (const b of benchmarks) maxName = Math.max(maxName, b.name.length);

  for (const b of benchmarks) {
    const result = await runBenchmark(b);

    const ops = (result.requests.average).toFixed(0);
    const msg = b.name.padEnd(maxName, ".") + ` x ${ops} req/sec`;

    console.log(msg);
  }
})();
