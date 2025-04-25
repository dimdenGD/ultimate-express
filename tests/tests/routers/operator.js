// must support router operators

const express = require("express");

const app = express();

const router = express.Router();

// This route path will match acd and abcd.
router.get("/ab?cd", (req, res) => {
  res.send("ab?cd -> " + req.path);
});

// This route path will match abcd, abbcd, abbbcd, and so on.
router.get("/ab+cd", (req, res) => {
  res.send("ab+cd -> " + req.path);
});

// This route path will match abcd, abxcd, abRANDOMcd, ab123cd, and so on.
router.get("/ab*cd", (req, res) => {
  res.send("ab*cd -> " + req.path);
});

// This route path will match /abe and /abcde.
router.get("/ab(cd)?e", (req, res) => {
  res.send("ab(cd)?e -> " + req.path);
});

app.use(router);
app.use('/sub', router);

app.listen(13333, async () => {
  console.log("Server is running on port 13333");

  const parts = [
    "acd",
    "abcd",
    "abxcd",
    "abRANDOMcd",
    "ab123cd",
    "abe",
    "abcde",
  ];
  const responses1 = await Promise.all(
    parts.map((part) => fetch(`http://localhost:13333/${part}`).then((res) => res.text()))
  );
  const responses2 = await Promise.all(
    parts.map((part) => fetch(`http://localhost:13333/sub/${part}`).then((res) => res.text()))
  );
  console.log(responses1);
  console.log(responses2);
  process.exit(0);
});
