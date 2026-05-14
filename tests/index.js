// npm run test - runs all tests
// npm run test routing - runs all tests in the routing category
// npm run test tests/tests/routing - runs all tests in the routing category
// npm run test tests/tests/listen/listen-random.js - runs the test at tests/tests/listen/listen-random.js

const fs = require("fs");
const path = require("path");
const test = require("node:test");
const childProcess = require("node:child_process");
const exec = require("util").promisify(childProcess.exec)
const assert = require("node:assert");

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
            let testCode = fs.readFileSync(testPath, 'utf8').replace(`const express = require("../../../src/index.js");`, 'const express = require("express");');
            if(!testCode.includes(`const express = require("express")`)) {
                throw new Error("Test code does not contain require express");
            }
            fs.writeFileSync(testPath, testCode);
            let testDescription = testCode.split('\n')[0].slice(2).trim();

            const skip = testDescription.endsWith('OFF')

            await new Promise(resolve => {
                test(testDescription, async (t) => {
                    if (skip) {
                        t.skip();
                        return resolve();
                    }

                    let timeout;
                    let timeoutFunc = (module) => {
                        setTimeout(() => process.exit(1));
                        throw `${module} timed out`;
                    };

                    try {
                        // Run with Express 4
                        timeout = setTimeout(() => timeoutFunc('express'), 60000);
                        let expressOutput = (await exec(`node ${testPath}`, {maxBuffer: 1024 * 1024 * 100})).stdout;
                        clearTimeout(timeout);

                        // Run with Express 5
                        let express5Output = null;
                        let express5Error = null;
                        const express5Code = testCode.replace(`const express = require("express");`, `const express = require("express5");`);
                        fs.writeFileSync(testPath, express5Code);
                        try {
                            timeout = setTimeout(() => timeoutFunc('express5'), 60000);
                            express5Output = (await exec(`node ${testPath}`, {maxBuffer: 1024 * 1024 * 100})).stdout;
                            clearTimeout(timeout);
                        } catch(e) {
                            clearTimeout(timeout);
                            express5Error = e;
                        }

                        // Run with ultimate-express
                        const newCode = testCode.replace(`const express = require("express");`, `const express = require("../../../src/index.js");`);
                        if(newCode === testCode) {
                            throw new Error("Test code does not contain require express");
                        }
                        fs.writeFileSync(testPath, newCode);
                        timeout = setTimeout(() => timeoutFunc('ultimate-express'), 60000)
                        let uExpressOutput = (await exec(`node ${testPath}`, {maxBuffer: 1024 * 1024 * 100})).stdout;
                        clearTimeout(timeout);

                        // Compare with Express 4 (strict)
                        assert.strictEqual(uExpressOutput, expressOutput);

                        // Compare with Express 5 (diagnostic)
                        if(express5Error) {
                            t.diagnostic(`express5: ERROR - ${(express5Error.stderr || express5Error.message || String(express5Error)).split('\n')[0]}`);
                        } else if(uExpressOutput === express5Output) {
                            t.diagnostic('express5: PASS');
                        } else {
                            t.diagnostic('express5: MISMATCH');
                        }
                    } catch (error) {
                        throw error;
                    } finally {
                        clearTimeout(timeout);
                        fs.writeFileSync(testPath, testCode);
                        resolve();
                    }
                });
            });
        }
    });
}
