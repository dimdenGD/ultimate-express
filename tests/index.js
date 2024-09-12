// npm run test - runs all tests
// npm run test routing - runs all tests in the routing category
// npm run test tests/tests/routing - runs all tests in the routing category
// npm run test tests/tests/listen/listen-random.js - runs the test at tests/tests/listen/listen-random.js

import fs from 'fs';
import path from 'path';
import test from 'node:test';
import childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testPath = path.join(__dirname, 'tests');

let testCategories = fs.readdirSync(testPath).sort((a, b) => parseInt(a) - parseInt(b));
const filterPath = process.argv[2];

if(filterPath) {
    if(!filterPath.endsWith('.js')) {
        testCategories = testCategories.filter(category => category.startsWith(path.basename(filterPath)));
    } else {
        testCategories = [path.dirname(filterPath).split(path.sep).pop()];
    }
}

for (const testCategory of testCategories) {
    test(testCategory, async () => {
        let tests = fs.readdirSync(path.join(__dirname, 'tests', testCategory)).sort((a, b) => parseInt(a) - parseInt(b));
        for (const testName of tests) {
            if(filterPath && filterPath.endsWith('.js')) {
                if(path.basename(testName) !== path.basename(filterPath)) {
                    continue;
                }
            }
            let testPath = path.join(__dirname, 'tests', testCategory, testName);
            let testCode = fs.readFileSync(testPath, 'utf8').replace(`import express from "../../../src/index.js";`, 'import express from "express";');
            fs.writeFileSync(testPath, testCode);
            let testDescription = testCode.split('\n')[0].slice(2).trim();
            if(testDescription.endsWith('OFF')) {
                return true;
            }

            await new Promise(resolve => {
                test(testDescription, () => {
                    try {
                        let expressOutput = childProcess.execSync(`node ${testPath}`).toString();

                        fs.writeFileSync(testPath, testCode.replace(`import express from "express";`, `import express from "../../../src/index.js";`));
                        let uExpressOutput = childProcess.execSync(`node ${testPath}`).toString();

                        assert.strictEqual(uExpressOutput, expressOutput);
                    } catch (error) {
                        throw error;
                    } finally {
                        fs.writeFileSync(testPath, testCode);
                        resolve();
                    }
                });
            });
        }
    });
}