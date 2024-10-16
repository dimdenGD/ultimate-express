const { describe, before, it: node_it } = require('node:test');

global.it = (name, fn) => {
  node_it(name, async (t) => {
    // Create a fake `this` context with a no-op `timeout` function
    const testContext = {
      timeout: () => {
        console.log('Ignoring this.timeout() call');
      },
    };

    // Call the test function with the custom `this` context
    if (fn.length > 0) {
      // Handle callback-based tests with `done()`
      await new Promise((resolve, reject) => {
        fn.call(testContext, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } else {
      // Handle sync/async tests
      await fn.call(testContext, t);
    }
  });
};

global.describe = describe;
global.before = before;
global.after = (count, callback) => {
  let remaining = count;
  let hasError = false;

  return function (err) {
    if (hasError) return; // Stop if an error has already occurred
    if (err) {
      hasError = true;
      return callback(err); // Immediately invoke callback on error
    }

    remaining -= 1;
    if (remaining === 0) {
      callback(); // Invoke the callback when all methods are done
    }
  };
}