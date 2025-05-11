// must support helmet middleware

const express = require("express");
const { fetchTest } = require("../../utils");
const helmet = require("helmet");

const app = express();
app.use(helmet());

app.get("/", (req, res) => {
  res.send("1");
});

app.listen(13333, async () => {
  console.log("Server is running on port 13333");

  const response = await fetchTest("http://localhost:13333/");
  console.log(
    response.headers.get("X-DNS-Prefetch-Control"),
    response.headers.get("X-Frame-Options"),
    response.headers.get("Strict-Transport-Security"),
    response.headers.get("X-Download-Options"),
    response.headers.get("X-Content-Type-Options"),
    response.headers.get("X-Permitted-Cross-Domain-Policies"),
    response.headers.get("Referrer-Policy")
  );
  process.exit(0);
});
