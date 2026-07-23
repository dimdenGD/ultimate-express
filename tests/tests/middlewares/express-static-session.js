// must serve static files under 768KB when res.end is wrapped by express-session

const express = require("express");
const session = require("express-session");

// force the non-optimized dispatch path (the uWS route optimizer masks this bug),
// and route small files through the file worker (default on multi-core machines)
function makeApp(options, useSession) {
    const app = options ? express(options) : express();
    app.set("case sensitive routing", false);
    if(useSession) {
        app.use(session({ secret: "x", resave: false, saveUninitialized: true }));
    }
    app.use("/static", express.static("tests/parts"));
    app.use((req, res) => {
        res.status(404).send("catchall");
    });
    return app;
}

async function check(label, app, port, file) {
    await new Promise(resolve => app.listen(port, resolve));
    await new Promise(resolve => setTimeout(resolve, 200)); // wait past the optimizer window
    const res = await fetch(`http://localhost:${port}/static/${file}`);
    const body = await res.text();
    console.log(label, res.status, body.length);
}

(async () => {
    // small file (< 768KB): worker path. With default threads on multi-core, this is the bug.
    await check("default+session small", makeApp(undefined, true), 13334, "index.ejs");
    // control: no workers, so the pipe path is used
    await check("threads0+session small", makeApp({ threads: 0 }, true), 13335, "index.ejs");
    // control: without session, an unwrapped end() accepts the worker result
    await check("default nosession small", makeApp(undefined, false), 13336, "index.ejs");
    // control: file > 768KB is streamed, bypassing the worker
    await check("default+session large", makeApp(undefined, true), 13337, "big.jpg");
    process.exit(0);
})();
