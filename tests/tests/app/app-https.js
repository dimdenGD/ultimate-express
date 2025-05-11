// must support https
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // ignore self-signed certificate error

const express = require("express");
const { fetchTest } = require("../../utils");
const https = require("https");
const fs = require("fs");

const app = express({
  uwsOptions: {
    key_file_name: "tests/parts/localhost.key",
    cert_file_name: "tests/parts/localhost.crt",
  },
});

app.get("/asdf", (req, res) => {
  res.send("asdf");
});

let server = app;
// if is express app, create a https server
if (!app.uwsApp) {
  server = https.createServer(
    {
      key: fs.readFileSync("tests/parts/localhost.key", "utf8"),
      cert: fs.readFileSync("tests/parts/localhost.crt", "utf8"),
    },
    app
  );
}

server.listen(13333, async () => {
  console.log("Server is running on port 13333");

  const outputs = await fetchTest("https://localhost:13333/asdf", {
    agent: new https.Agent({
      rejectUnauthorized: false,
    }),
  }).then((res) => res.text());

  console.log(outputs);
  process.exit(0);
});
