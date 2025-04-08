// must support multiple cookies in set-cookie header

const express = require("express");

const app = express();

app.get("/abc", (req, res) => {
  res.header('set-cookie', ['my_cookie=foo', 'my_cookie2=bar']);
  res.send('ok');
});

app.listen(13333, async () => {
  console.log("Server is running at http://localhost:13333");

  let response = await fetch('http://localhost:13333/abc');

  const cookie = response.headers.get('set-cookie');
  console.log(cookie);
  
  process.exit(0);
});