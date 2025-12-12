"use strict";

const Benchmark = require("benchmark");
const express = require("../src/index");

const benchmarks = [
  {
    name: "short string",
    response: "hello",
  },
  {
    name: "long string",
    response: "hello".repeat(10_000),
  },
];

async function runBenchmark(benchmark) {
  return new Promise((resolve, reject) => {
    Benchmark.options.minSamples = 100;

    const suite = Benchmark.Suite();

    const app = express();

    app.set("etag", false);
    app.set("declarative responses", false);

    app.all(benchmark.path ?? "/", (req, res) => {
      res.send(benchmark.response ?? "Hello world");
    });

    const server = app.listen(3000, () => {
      suite
        .add(benchmark.name, {
          defer: true,
          fn: async (deferred) => {
            await fetch(`http://localhost:3000${benchmark.path ?? "/"}`, {
              method: benchmark.method ?? "GET",
              body: benchmark.body ?? undefined,
              headers: benchmark.headers ?? {},
              keepalive: true,
            });
            deferred.resolve();
          },
        })
        .on("cycle", (event) => {
          resolve(String(event.target));
        })
        .on("complete", () => {
            server.close()
        })
        .run();
    });
  });
}

async function runBenchmarks() {
  let maxNameLength = 0;
  for (const benchmark of benchmarks) {
    maxNameLength = Math.max(benchmark.name.length, maxNameLength);
  }

  for (const benchmark of benchmarks) {
    benchmark.name = benchmark.name.padEnd(maxNameLength, ".");
    const resultMessage = await runBenchmark(benchmark);
    console.log(resultMessage);
  }
}

runBenchmarks();
