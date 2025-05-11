// must support passport middleware

const express = require("express");
const { fetchTest } = require("../../utils");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");

const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(function verify(username, password, cb) {
    if (username === "admin" && password === "admin") {
      return cb(null, { username: "admin" });
    }
    return cb(null, false, { message: "Incorrect username or password." });
  })
);

passport.serializeUser((user, cb) => cb(null, user.username));
passport.deserializeUser((username, cb) => cb(null, { username }));

app.post(
  "/login/password",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

app.listen(13333, async () => {
  console.log("Server is running on port 13333");

  let response = await fetchTest("http://localhost:13333/login/password", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ username: "admin", password: "admin" }),
    redirect: "manual",
  });
  console.log("Redirected to:", response.headers.get("location"));
  console.log("vary:", response.headers.get("vary"));

 /*
  response = await fetchTest("http://localhost:13333/login/password", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ username: "foo", password: "bar" }),
    redirect: "manual",
  });
  console.log("Redirected to:", response.headers.get("location"));
  console.log("vary:", response.headers.get("vary"));
*/

  process.exit(0);
});