// must support server like interface

const express = require('express');

const app = express();

const server = app.listen(3000, () => {
  console.log('Server is running');
});

console.log('Server prototype constructor name:', server.constructor.name);
console.log('Is instance of http.Server?', server instanceof require('http').Server);
// Check if it has address() method
if (server.address) {
  console.log('Address:', server.address());
} else {
  console.log('No address() method');
}
if (server.ref && server.unref) {
  console.log('Has ref/unref methods');
} else {
  console.log('Missing ref/unref methods');
}
server.close(() => {
    console.log('Server closed');
    process.exit(0);
});
