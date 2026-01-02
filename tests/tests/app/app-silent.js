// must support uws silent
const express = require("express");

const app = express({
  uwsOptions: {
    silent: true,
  },
});

app.get("/asdf", (req, res) => {
  res.send("asdf");
});

app.listen(13333, async () => {
  console.log("Server is running on port 13333");

  const outputs = await fetch("http://localhost:13333/asdf").then((res) => res.text());

  console.log(outputs);
  process.exit(0);
});
