const express = require("../src/index");

const app = express({
  http3: true,
  uwsOptions: {
    key_file_name: './demo/localhost.key',
    cert_file_name: './demo/localhost.crt'
  }
});

app.get("/test", (req, res) => {
  res.send("Hello World!");
});

app.listen(13333, () => {
  console.log("Server is running at http://localhost:13333");
});
