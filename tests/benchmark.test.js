const Benchmark = require('benchmark');
const suite = new Benchmark.Suite;

// Import your main functions/components to test
const { criticalFunction1, criticalFunction2 } = require('../src/core');

// Test data
const TEST_DATA = {
  small: { /* small dataset */ },
  medium: { /* medium dataset */ },
  large: { /* large dataset */ }
};

// Benchmark critical function 1
suite.add('criticalFunction1 - small dataset', () => {
  criticalFunction1(TEST_DATA.small);
})
.add('criticalFunction1 - medium dataset', () => {
  criticalFunction1(TEST_DATA.medium);
})
.add('criticalFunction1 - large dataset', () => {
  criticalFunction1(TEST_DATA.large);
})

// Benchmark critical function 2
.add('criticalFunction2 - small dataset', () => {
  criticalFunction2(TEST_DATA.small);
})
.add('criticalFunction2 - medium dataset', () => {
  criticalFunction2(TEST_DATA.medium);
})
.add('criticalFunction2 - large dataset', () => {
  criticalFunction2(TEST_DATA.large);
})

.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Benchmark complete');
  const results = {
    timestamp: new Date().toISOString(),
    results: this.map(benchmark => ({
      name: benchmark.name,
      hz: benchmark.hz,
      stats: benchmark.stats,
      times: benchmark.times
    }))
  };
  
  require('fs').writeFileSync(
    'benchmark-results.json',
    JSON.stringify(results, null, 2)
  );
})
.run({ 'async': true }); 