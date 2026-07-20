# Benchmark suite

Run all scenarios and compare `express` vs `ultimate-express` (default):

```bash
npm run benchmark:compare -- --duration 20 --output benchmark_summary.md
```

Run a single scenario:

```bash
npm run benchmark:compare -- --duration 20 --scenario hello-world
```

## Comparing against Express 5

Compare all four frameworks (Express 4, Express 5, uExpress v4 mode, uExpress v5 mode):

```bash
npm run benchmark:compare -- --duration 20 --frameworks express,express5,ultimate-express,ultimate-express-v5
```

Compare only Express 5 vs uExpress v5:

```bash
npm run benchmark:compare -- --duration 20 --frameworks express5,ultimate-express-v5
```

## Available frameworks

| ID | Description |
|----|-------------|
| `express` | Express 4 (latest-4 tag) |
| `express5` | Express 5 (latest tag) |
| `ultimate-express` | µExpress in v4 mode (default) |
| `ultimate-express-v5` | µExpress in v5 mode (`version: 5`) |

## Scenarios

- `hello-world`
- `routes-1000`
- `middlewares-100`
- `nested-routers-3`
- `static-250kb`
- `art-render`
- `post-urlencoded`
- `compression-small-file`
- `streaming-without-content-length`
- `streaming-with-content-length`
- `readable-hash-4mb`

## Requirements

- Linux (wrk is required)
- `wrk` installed and in PATH
