// must not emit unhandled error when client closes mid-stream

const net = require("net");
const express = require("express");

const app = express();

app.get("/test", (req, res) => {
  let closed = false;
  let writes = 0;

  res.on("close", () => {
    closed = true;
    console.log("res close");
  });

  const interval = setInterval(() => {
    if (closed) {
      clearInterval(interval);
      return;
    }

    res.write(Buffer.alloc(64 * 1024));
    writes++;

    if (writes === 100) {
      clearInterval(interval);
      res.end();
    }
  }, 5);
});

app.listen(13333, () => {
  console.log("Server is running on port 13333");

  const client = new net.Socket();
  let received = 0;

  client.connect(13333, "127.0.0.1", () => {
    client.write("GET /test HTTP/1.1\r\nHost: localhost:13333\r\n\r\n");
  });

  client.on("data", (data) => {
    received += data.length;
    if (received > 200000) {
      client.destroy();
      setTimeout(() => {
        console.log("done");
        process.exit(0);
      }, 200);
    }
  });
});
