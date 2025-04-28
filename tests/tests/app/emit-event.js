// must support emit event

const express = require("express");

const app = express();

app.post("/test", (req, res) => {
    const events = [];
  req
    .on("close", () => {
        events.push("req close");
        console.log(events.sort((a, b) => a.localeCompare(b)));
    })
    .on("data", () => events.push("req data"))
    .on("end", () => events.push("req end"));

  res
    .on("close", () => events.push("res close"))
    .on("data", () => events.push("res data"))
    .on("end", () => events.push("res end"));

  res.send("hello");
});

app.listen(13333, async () => {
  console.log("Server is running on port 13333");

  const data = await fetch("http://localhost:13333/test", {method: 'POST'}).then((res) =>
    res.text()
  );
  console.log(data);

  process.exit(0);
});
