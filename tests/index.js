import fs from 'fs';
import path from 'path';
import test from 'node:test';
import childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tests = fs.readdirSync(path.join(__dirname, 'tests'));

for (const testName of tests) {
    let testPath = path.join(__dirname, 'tests', testName);
    let testCode = fs.readFileSync(testPath, 'utf8').replace(`import express from "../../src/index.js";`, 'import express from "express";');
    fs.writeFileSync(testPath, testCode);
    let testDescription = testCode.split('\n')[0].slice(2, 0).trim();

    await new Promise(resolve => {
        test(testDescription, () => {
            try {
                let expressOutput = childProcess.execSync(`node ${testPath}`).toString();

                fs.writeFileSync(testPath, testCode.replace(`import express from 'express';`, `import express from '../../src/index.js';`));
                let uExpressOutput = childProcess.execSync(`node ${testPath}`).toString();

                assert.strictEqual(expressOutput, uExpressOutput);
            } catch (error) {
                throw error;
            } finally {
                fs.writeFileSync(testPath, testCode);
                resolve();
            }
        });
    });
}