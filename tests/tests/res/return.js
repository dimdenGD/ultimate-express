// must support return

const express = require("express");

const app = express();

app.get('/', async (req, res) => {
  return res.send('ok');
});

app.listen(13333, async () => {
  console.log("Server is running on port 13333");

  const responses = await fetch("http://localhost:13333/").then((res) =>
    res.text()
  );

  console.log(responses);
  process.exit(0);
});
