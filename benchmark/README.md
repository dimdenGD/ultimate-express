# Benchmark suite

Run all scenarios and compare `express` vs `ultimate-express`:

```bash
npm run benchmark:compare -- --duration 20 --output benchmark_summary.md
```

Run a single scenario:

```bash
npm run benchmark:compare -- --duration 20 --scenario hello-world
```

Scenarios:

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
