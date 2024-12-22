const fs = require('fs');
const path = require('path');

function loadBenchmarkResults(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function calculatePerformanceChange(baseline, current) {
  const changes = {};
  
  current.results.forEach(currentResult => {
    const baselineResult = baseline.results.find(r => r.name === currentResult.name);
    if (baselineResult) {
      const percentChange = ((currentResult.hz - baselineResult.hz) / baselineResult.hz) * 100;
      changes[currentResult.name] = {
        percentChange,
        baseline: baselineResult.hz,
        current: currentResult.hz
      };
    }
  });
  
  return changes;
}

function generateReport(changes) {
  let summary = '';
  let details = '';
  let hasRegression = false;
  
  Object.entries(changes).forEach(([testName, change]) => {
    const changeEmoji = change.percentChange > 0 ? '🚀' : '🐌';
    const changeColor = change.percentChange > -5 ? 'green' : 'red';
    
    if (change.percentChange < -5) {
      hasRegression = true;
    }
    
    details += `### ${testName}\n`;
    details += `${changeEmoji} ${change.percentChange.toFixed(2)}% change\n`;
    details += `- Baseline: ${change.baseline.toFixed(2)} ops/sec\n`;
    details += `- Current: ${change.current.toFixed(2)} ops/sec\n\n`;
  });
  
  summary = hasRegression 
    ? '⚠️ Performance regression detected! Please review the detailed results.'
    : '✅ No significant performance regression detected.';
    
  return { summary, details };
}

// Main execution
try {
  const baseline = loadBenchmarkResults('master-benchmark.json');
  const current = loadBenchmarkResults('benchmark-results.json');
  
  const changes = calculatePerformanceChange(baseline, current);
  const report = generateReport(changes);
  
  fs.writeFileSync(
    'benchmark-comparison.json',
    JSON.stringify(report, null, 2)
  );
  
  process.exit(0);
} catch (error) {
  console.error('Error comparing benchmark results:', error);
  process.exit(1);
} 