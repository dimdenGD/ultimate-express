"use strict";

const autocannon = require("autocannon");
const { spawn } = require("child_process");
const path = require("path");

const os = require("os");
const cores = os.cpus().length;

const workers = Math.max(1, Math.min(cores - 1, 4));

const benchmarks = [
  {
    name: "long string",
    path: "/long-string",
  }
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runServer() {
  return new Promise((resolve, reject) => {
    const server = spawn(
      process.execPath,
      ["--expose-gc", path.join(__dirname, "server.js")],
      {
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          NODE_ENV: "production",
        },
      }
    );

    server.stdout.on("data", (data) => {
      const message = data.toString();  
      if (message.includes("SERVER_READY")) {
        resolve(server);
      } else if (message.includes("SERVER_ERROR")) {
        reject(new Error("SERVER_ERROR"));
      }
    });

    server.on("error", (err) => {
      reject(err);
    });
  });
}

async function runBenchmark(benchmark) {
  if (global.gc) global.gc();

  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: "http://localhost:3000" + benchmark.path,
        duration: 30,
        connections: 20,
        pipelining: 1,
        headers: {
          "accept-encoding": "identity",
          ...(benchmark.headers ?? {})
        },
        method: benchmark.method ?? "GET",
        body: benchmark.body ?? undefined,
        workers,
        socketPath: (process.platform === "linux" || process.platform === "darwin") ? "/tmp/express-bench.sock" : undefined,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.requests.average);
      }
    );

    // autocannon.track(instance, { renderProgressBar: true });
  });
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

(async () => {
  let maxName = 0;

  const server = await runServer();

  for (const b of benchmarks) maxName = Math.max(maxName, b.name.length);

  for (const b of benchmarks) {
    const results = [];
    for (let i = 0; i < 5; i++) {
      const result = await runBenchmark(b);
      if (i === 0) continue; // discard first run for warmup
      results.push(result);
      await sleep(1000); // add small delay between runs for free resources
    }
    const alignedName = b.name.padEnd(maxName, ".");
    const m = median(results);
    console.log(`${alignedName} x ${m.toFixed(0)} req/sec`);
  }

  server.kill("SIGTERM");
})().catch((err) => {
  console.error("Fatal error:", err);
});
