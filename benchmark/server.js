'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const KB = 1024;
const MB = 1024 * KB;
const STREAM_SIZE_BYTES = 5 * MB;
const STREAM_CHUNK_SIZE = 64 * KB;
const STREAM_CHUNK = Buffer.alloc(STREAM_CHUNK_SIZE, 'x');

function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i++) {
        const value = argv[i];
        if (!value.startsWith('--')) {
            continue;
        }
        const key = value.slice(2);
        args[key] = argv[i + 1];
        i++;
    }
    return args;
}

function resolveFramework(frameworkName) {
    if (frameworkName === 'express') {
        return require('express');
    }

    if (frameworkName === 'ultimate-express') {
        return require('../src/index');
    }

    throw new Error(`Unknown framework: ${frameworkName}`);
}

function createContext() {
    const assetsDir = path.join(__dirname, 'assets');
    const viewsDir = path.join(__dirname, 'views');
    const staticFilePath = path.join(assetsDir, 'static-250kb.txt');
    const compressedPayload = Buffer.from('small-file-content-'.repeat(4096), 'utf8');

    function ensureAssets() {
        fs.mkdirSync(assetsDir, { recursive: true });
        fs.mkdirSync(viewsDir, { recursive: true });

        if (!fs.existsSync(staticFilePath)) {
            fs.writeFileSync(staticFilePath, Buffer.alloc(250 * KB, 'a'));
        }
    }

    return {
        assetsDir,
        viewsDir,
        staticFilePath,
        compressedPayload,
        streamSizeBytes: STREAM_SIZE_BYTES,
        ensureAssets,
        pipeLargeStream(res, includeContentLength) {
            if (includeContentLength) {
                res.setHeader('Content-Length', String(STREAM_SIZE_BYTES));
            }
            res.setHeader('Content-Type', 'application/octet-stream');
            let remaining = STREAM_SIZE_BYTES;
            const stream = new Readable({
                read() {
                    if (remaining <= 0) {
                        this.push(null);
                        return;
                    }

                    const chunk = remaining >= STREAM_CHUNK_SIZE ? STREAM_CHUNK : STREAM_CHUNK.subarray(0, remaining);
                    remaining -= chunk.length;
                    this.push(chunk);
                }
            });

            stream.pipe(res);
        },
        createHashFromRequest(req, done) {
            const hash = crypto.createHash('sha256');
            req.on('data', (chunk) => {
                hash.update(chunk);
            });
            req.on('end', () => {
                done(hash.digest('hex'));
            });
            req.on('error', (error) => {
                done(null, error);
            });
        }
    };
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const frameworkName = args.framework;
    const scenarioName = args.scenario;
    const port = Number(args.port || 3000);

    if (!frameworkName || !scenarioName) {
        throw new Error('Missing required args: --framework and --scenario');
    }

    const express = resolveFramework(frameworkName);
    const app = express();
    const context = createContext();
    const scenarioPath = path.join(__dirname, 'scenarios', `${scenarioName}.js`);
    const scenario = require(scenarioPath);

    if (typeof app.set === 'function') {
        app.set('etag', false);
        app.set('x-powered-by', false);
        app.set('env', 'production');
        if (frameworkName === 'ultimate-express') {
            app.set('declarative responses', false);
        }
    }

    app.get('/__ready', (req, res) => {
        res.send('ok');
    });

    await scenario.setup(app, express, context);

    const server = app.listen(port, () => {
        process.stdout.write(`ready:${frameworkName}:${scenarioName}:${port}\n`);
    });

    function shutdown() {
        server.close(() => {
            process.exit(0);
        });
    }

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exit(1);
});
