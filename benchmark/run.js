'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');

const SCENARIO_FILES = fs.readdirSync(path.join(__dirname, 'scenarios')).filter((file) => file.endsWith('.js')).map((file) => file.replace('.js', ''));

const ALL_FRAMEWORKS = [
    { id: 'express', label: 'Express 4', port: 3001 },
    { id: 'express5', label: 'Express 5', port: 3002 },
    { id: 'ultimate-express', label: 'uExpress', port: 3000 },
    { id: 'ultimate-express-v5', label: 'uExpress v5', port: 3003 }
];

const DEFAULT_FRAMEWORKS = ['express', 'ultimate-express'];

function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i++) {
        const value = argv[i];
        if (value.startsWith('--')) {
            args[value.slice(2)] = argv[i + 1];
            i++;
        }
    }
    return args;
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForReady(port, timeoutMs = 10000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const tryReady = () => {
            const request = http.get({ host: '127.0.0.1', port, path: '/__ready' }, (response) => {
                response.resume();
                if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                    resolve();
                    return;
                }
                if (Date.now() - start > timeoutMs) {
                    reject(new Error(`Timeout waiting for server on port ${port}`));
                    return;
                }
                setTimeout(tryReady, 200);
            });

            request.on('error', () => {
                if (Date.now() - start > timeoutMs) {
                    reject(new Error(`Timeout waiting for server on port ${port}`));
                    return;
                }
                setTimeout(tryReady, 200);
            });
        };

        tryReady();
    });
}

function startScenarioServer(framework, scenarioName) {
    const serverScript = path.join(__dirname, 'server.js');
    const serverArgs = [
        serverScript,
        '--framework', framework.id,
        '--scenario', scenarioName,
        '--port', String(framework.port)
    ];

    const server = spawn(process.execPath, serverArgs, {
        cwd: path.join(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderr = '';
    server.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
    });

    return { server, stderrRef: () => stderr };
}

async function stopScenarioServer(server, stderrRef) {
    if (server.exitCode === null) {
        server.kill('SIGTERM');
        await wait(300);
        if (server.exitCode === null) {
            server.kill('SIGKILL');
        }
    }

    const stderr = stderrRef();
    if (stderr.trim()) {
        process.stderr.write(stderr);
    }
}

function runHttpRequest(port, verifyConfig, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        const method = verifyConfig.method || 'GET';
        const pathName = verifyConfig.path || '/';
        const headers = { ...(verifyConfig.headers || {}) };
        const body = verifyConfig.body || null;

        if (body && headers['Content-Length'] == null && headers['content-length'] == null) {
            headers['Content-Length'] = String(Buffer.byteLength(body));
        }

        const req = http.request({
            host: '127.0.0.1',
            port,
            path: pathName,
            method,
            headers
        }, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const rawBody = Buffer.concat(chunks);
                let decodedBody = rawBody;
                try {
                    const contentEncoding = String(res.headers['content-encoding'] || '').toLowerCase().split(',')[0].trim();
                    if (contentEncoding === 'gzip') {
                        decodedBody = zlib.gunzipSync(rawBody);
                    } else if (contentEncoding === 'deflate') {
                        decodedBody = zlib.inflateSync(rawBody);
                    } else if (contentEncoding === 'br') {
                        decodedBody = zlib.brotliDecompressSync(rawBody);
                    }
                } catch (error) {
                    reject(new Error(`Failed to decode response body: ${error.message}`));
                    return;
                }

                resolve({
                    statusCode: res.statusCode || 0,
                    headers: res.headers,
                    bodyHash: crypto.createHash('sha256').update(decodedBody).digest('hex'),
                    bodySize: decodedBody.length
                });
            });
        });

        req.setTimeout(timeoutMs, () => {
            req.destroy(new Error(`Request timeout after ${timeoutMs}ms`));
        });
        req.on('error', reject);

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

async function validateScenarioResponses(scenarioName, scenario, frameworks) {
    const verify = scenario.verify || {};
    let verifyBody = verify.body;
    if (verify.bodyRepeat && typeof verify.bodyRepeat === 'object') {
        const repeat = verify.bodyRepeat;
        verifyBody = String(repeat.char || 'a').repeat(Number(repeat.count || 0));
    }
    const verifyConfig = {
        method: verify.method || 'GET',
        path: verify.path || scenario.path,
        headers: verify.headers || {},
        body: verifyBody || null
    };
    const results = {};

    for (const framework of frameworks) {
        const { server, stderrRef } = startScenarioServer(framework, scenarioName);
        try {
            await waitForReady(framework.port);
            results[framework.id] = await runHttpRequest(framework.port, verifyConfig);
        } finally {
            await stopScenarioServer(server, stderrRef);
        }
    }

    // Compare all frameworks against the first one
    const baseId = frameworks[0].id;
    const baseResult = results[baseId];
    const mismatches = [];

    for (let i = 1; i < frameworks.length; i++) {
        const fwId = frameworks[i].id;
        const fwResult = results[fwId];
        const sameStatus = baseResult.statusCode === fwResult.statusCode;
        const sameBodyHash = baseResult.bodyHash === fwResult.bodyHash;
        if (!sameStatus || !sameBodyHash) {
            mismatches.push(
                `${fwId}: status=${fwResult.statusCode}, hash=${fwResult.bodyHash}, size=${fwResult.bodySize}`
            );
        }
    }

    if (mismatches.length === 0) {
        return {
            ok: true,
            message: `status ${baseResult.statusCode}, body sha256 ${baseResult.bodyHash.slice(0, 12)}`
        };
    }

    return {
        ok: false,
        message: [
            `${baseId}: status=${baseResult.statusCode}, hash=${baseResult.bodyHash}, size=${baseResult.bodySize}`,
            ...mismatches
        ].join(' | ')
    };
}

function parseRequestsPerSec(output) {
    const totalMatch = output.match(/Requests\/sec:\s+([0-9.]+)/);
    if (totalMatch) {
        return Number(totalMatch[1]);
    }

    const reqSecMatch = output.match(/Req\/Sec\s+([0-9.]+)/);
    return reqSecMatch ? Number(reqSecMatch[1]) : 0;
}

function parseTransferPerSec(output) {
    const match = output.match(/Transfer\/sec:\s+([0-9.]+)([KMG]?B)/);
    if (!match) {
        return 0;
    }

    const value = Number(match[1]);
    const unit = match[2];
    if (unit === 'KB') {
        return value * 1024;
    }
    if (unit === 'MB') {
        return value * 1024 * 1024;
    }
    if (unit === 'GB') {
        return value * 1024 * 1024 * 1024;
    }
    return value;
}

function parseErrorLines(output) {
    const errorLines = [];
    const socketErrorMatch = output.match(/Socket errors:[^\n]+/);
    if (socketErrorMatch) {
        errorLines.push(socketErrorMatch[0]);
    }
    const non2xxMatch = output.match(/Non-2xx or 3xx responses:\s+[0-9]+/);
    if (non2xxMatch) {
        errorLines.push(non2xxMatch[0]);
    }
    return errorLines;
}

function formatReqPerSec(value) {
    if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}k`;
    }
    return value.toFixed(2);
}

function formatBytesPerSec(bytes) {
    const units = ['B/sec', 'KB/sec', 'MB/sec', 'GB/sec'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    return `${value.toFixed(2)} ${units[unitIndex]}`;
}

async function runScenario(framework, scenarioName, scenario, durationSeconds) {
    const { server, stderrRef } = startScenarioServer(framework, scenarioName);

    try {
        await waitForReady(framework.port);

        const wrk = scenario.wrk || {};
        const args = [
            '-t', String(wrk.threads || 1),
            '-c', String(wrk.connections || 200),
            '-d', `${durationSeconds}s`
        ];

        if (wrk.script) {
            args.push('-s', path.join(__dirname, 'wrk-scripts', wrk.script));
        }

        const targetUrl = wrk.script
            ? `http://127.0.0.1:${framework.port}`
            : `http://127.0.0.1:${framework.port}${scenario.path}`;
        args.push(targetUrl);

        const wrkResult = spawnSync('wrk', args, {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf8'
        });

        if (wrkResult.status !== 0) {
            throw new Error(`wrk failed: ${wrkResult.stderr || wrkResult.stdout}`);
        }

        const requestsPerSec = parseRequestsPerSec(wrkResult.stdout);
        const transferPerSecBytes = parseTransferPerSec(wrkResult.stdout);
        const wrkErrors = parseErrorLines(wrkResult.stdout);

        if (requestsPerSec === 0) {
            throw new Error(
                `wrk produced invalid benchmark output for ${framework.id}/${scenarioName}:\n${wrkErrors.join('\n')}\n\n${wrkResult.stdout}`
            );
        }

        return {
            requestsPerSec,
            transferPerSecBytes,
            raw: wrkResult.stdout
        };
    } finally {
        await stopScenarioServer(server, stderrRef);
    }
}

function buildMarkdown(results, frameworks) {
    const lines = [];
    lines.push('<!-- benchmark-comment -->');
    lines.push('## Benchmark Comparison');
    lines.push('');

    // Build header
    const headerCols = ['Test'];
    for (const fw of frameworks) {
        headerCols.push(`${fw.label} req/sec`);
        headerCols.push(`${fw.label} throughput`);
    }
    // Add speedup column (last framework vs first)
    if (frameworks.length >= 2) {
        headerCols.push(`${frameworks[frameworks.length - 1].label} speedup`);
    }
    lines.push(`| ${headerCols.join(' | ')} |`);
    lines.push(`| ${headerCols.map(() => '---:').join(' | ')} |`);

    const failures = [];
    for (const row of results) {
        const cols = [row.name];
        for (const fw of frameworks) {
            const r = row.results[fw.id];
            if (r && r.ok) {
                cols.push(formatReqPerSec(r.requestsPerSec));
                cols.push(formatBytesPerSec(r.transferPerSecBytes));
            } else {
                cols.push('FAILED');
                cols.push('FAILED');
                if (r && !r.ok) {
                    failures.push({ scenario: row.name, framework: fw.id, message: r.error });
                }
            }
        }
        // Speedup: last vs first
        if (frameworks.length >= 2) {
            const first = row.results[frameworks[0].id];
            const last = row.results[frameworks[frameworks.length - 1].id];
            if (first && first.ok && last && last.ok && first.transferPerSecBytes > 0) {
                cols.push(`**${(last.transferPerSecBytes / first.transferPerSecBytes).toFixed(2)}x**`);
            } else {
                cols.push('N/A');
            }
        }
        lines.push(`| ${cols.join(' | ')} |`);
    }

    if (failures.length > 0) {
        lines.push('');
        lines.push(`> Warning: ${failures.length} benchmark run(s) failed. See details below.`);
        lines.push('');
        lines.push('### Failed Scenarios');
        lines.push('');
        for (const failure of failures) {
            lines.push(`- \`${failure.scenario}\` on \`${failure.framework}\`\n\`\`\`\n${failure.message}\n\`\`\``);
        }
    }

    lines.push('');
    return `${lines.join('\n')}\n`;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const durationSeconds = Number(args.duration || 20);
    const outputPath = path.resolve(process.cwd(), args.output || 'benchmark_summary.md');
    const requestedScenario = args.scenario;
    const scenarioList = requestedScenario ? [requestedScenario] : SCENARIO_FILES;

    // Parse --frameworks flag (comma-separated list of framework ids)
    const requestedFrameworks = args.frameworks
        ? args.frameworks.split(',').map((s) => s.trim())
        : DEFAULT_FRAMEWORKS;
    const FRAMEWORKS = ALL_FRAMEWORKS.filter((fw) => requestedFrameworks.includes(fw.id));

    if (FRAMEWORKS.length === 0) {
        throw new Error(`No valid frameworks specified. Available: ${ALL_FRAMEWORKS.map((f) => f.id).join(', ')}`);
    }

    process.stdout.write(`Frameworks: ${FRAMEWORKS.map((f) => f.label).join(', ')}\n`);

    const results = [];
    for (const scenarioName of scenarioList) {
        const scenario = require(path.join(__dirname, 'scenarios', `${scenarioName}.js`));
        process.stdout.write(`Running scenario: ${scenario.name}\n`);
        let validation = null;

        try {
            validation = await validateScenarioResponses(scenarioName, scenario, FRAMEWORKS);
            if (validation.ok) {
                process.stdout.write(`[validation] PASS ${scenario.name}: ${validation.message}\n`);
            } else {
                process.stderr.write(`[validation] FAIL ${scenario.name}: ${validation.message}\n`);
            }
        } catch (error) {
            validation = {
                ok: false,
                message: error.stack || error.message || String(error)
            };
            process.stderr.write(`[validation] ERROR ${scenario.name}: ${validation.message}\n`);
        }

        const scenarioResults = {};
        for (const framework of FRAMEWORKS) {
            try {
                const successfulResult = await runScenario(framework, scenarioName, scenario, durationSeconds);
                scenarioResults[framework.id] = { ok: true, ...successfulResult };
            } catch (error) {
                const errorMessage = error.stack || error.message || String(error);
                scenarioResults[framework.id] = { ok: false, error: errorMessage };
                process.stderr.write(`[benchmark] FAILED ${framework.id}/${scenarioName}\n${errorMessage}\n`);
            }
        }

        results.push({
            name: scenario.name,
            validation,
            results: scenarioResults
        });

        process.stdout.write(`Done: ${scenario.name}\n`);
    }

    const hasAnySuccess = results.some((row) =>
        Object.values(row.results).some((r) => r.ok)
    );
    if (!hasAnySuccess) {
        throw new Error('All benchmark scenarios failed. No summary table generated.');
    }

    results.sort((a, b) => a.name.localeCompare(b.name));

    const markdown = buildMarkdown(results, FRAMEWORKS);
    fs.writeFileSync(outputPath, markdown, 'utf8');
    process.stdout.write(markdown);
}

main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exit(1);
});
