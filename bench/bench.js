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
    app.set("catch async errors", true);
    
    app.use(express.json());

    app.all(benchmark.path ?? '/', (req, res) => {
      res.send(benchmark.response ?? '');
    });

    app.listen(3000, () => resolve(app));
    server.on("error", (err) => {
        console.error("Server error:", err);
        reject(err);
    });
  });
}

async function runBenchmark(benchmark) {
  const server = await runServer(benchmark);

  return new Promise((resolve) => {
    const instance = autocannon(
      {
        url: "http://localhost:3000" + (benchmark.path ?? '/'),
        connections: 50,
        duration: 5,
        pipelining: 1,
        headers: benchmark.headers ?? {},
        method: benchmark.method ?? "GET",
      },
      (err, result) => {
        server.uwsApp.close();
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
