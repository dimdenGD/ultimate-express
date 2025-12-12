"use strict";

const { workerData: benchmark, parentPort } = require("worker_threads");

const Benchmark = require("benchmark");
Benchmark.options.minSamples = 100;

const suite = Benchmark.Suite();

const express = require("../src/index");
const app = express();

app.set("etag", false);
app.set("declarative responses", false);

app.all(benchmark.path ?? '/', (req, res) => {
    res.send(benchmark.response ?? 'Hello world');
});

app.listen(3000, () => {
  suite
    .add(benchmark.name, async() => {
      await fetch(`http://localhost:3000${benchmark.path ?? '/'}`, {
        method: benchmark.method ?? "GET",
        body: benchmark.body ?? undefined,
        headers: benchmark.headers ?? {}
      }).then(res => res.text());
    })
    .on("cycle", (event) => {
      parentPort.postMessage(String(event.target));
    })
    .on("complete", () => {})
    .run();
});
