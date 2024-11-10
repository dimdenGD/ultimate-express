const NullObject = function() {};
NullObject.prototype = Object.create(null);
const cnt = 100000;
const runs = 50;

function benchmark(callback) {
    const timings = [];
    for (let i = 0; i < runs; i++) {
        const start = process.hrtime.bigint();
        callback();
        const end = process.hrtime.bigint();
        timings.push(Number(end - start) / 1e6); // Convert to milliseconds
    }
    return timings;
}

function calculateStats(timings) {
    const sum = timings.reduce((acc, val) => acc + val, 0);
    const avg = sum / timings.length;
    const min = Math.min(...timings);
    const max = Math.max(...timings);
    return { min, max, avg };
}

const plainObjectTimings = benchmark(() => {
    let plainObjects = [];
    for (let i = 0; i < cnt; i++) {
        plainObjects.push({});
    }
    plainObjects = null; // Clear memory
});

const nullObjectTimings = benchmark(() => {
    let nullObjects = [];
    for (let i = 0; i < cnt; i++) {
        nullObjects.push(new NullObject());
    }
    nullObjects = null; // Clear memory
});

const nullObjectTimingsWithSpread = benchmark(() => {
    let nullObjectsW = [];
    for (let i = 0; i < cnt; i++) {
        nullObjectsW.push({...new NullObject()});
    }
    nullObjectsW = null; // Clear memory
});

const plainObjectStats = calculateStats(plainObjectTimings);
const nullObjectStats = calculateStats(nullObjectTimings);
const nullObjectTimingsWithSpreadStats = calculateStats(nullObjectTimingsWithSpread);

console.log("Benchmark results for creating empty objects using {}:");
console.log(`Min: ${plainObjectStats.min.toFixed(2)} ms`);
console.log(`Max: ${plainObjectStats.max.toFixed(2)} ms`);
console.log(`Avg: ${plainObjectStats.avg.toFixed(2)} ms`);

console.log("\nBenchmark results for creating empty objects using new NullObject():");
console.log(`Min: ${nullObjectStats.min.toFixed(2)} ms`);
console.log(`Max: ${nullObjectStats.max.toFixed(2)} ms`);
console.log(`Avg: ${nullObjectStats.avg.toFixed(2)} ms`);

console.log("\nBenchmark results for creating empty objects using new NullObject() with spread:");
console.log(`Min: ${nullObjectTimingsWithSpreadStats.min.toFixed(2)} ms`);
console.log(`Max: ${nullObjectTimingsWithSpreadStats.max.toFixed(2)} ms`);
console.log(`Avg: ${nullObjectTimingsWithSpreadStats.avg.toFixed(2)} ms`);
