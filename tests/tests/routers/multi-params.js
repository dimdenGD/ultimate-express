// must support multi params

const express = require("express");

const app = express();

app.get("/api/1.0/info/:subdir(ab|cd)?/:item([0-9A-Za-z-_]{6}.[^.])/:empty(.{0})?/details", (req, res) => {
    res.json({path: req.path, params: req.params});
});

app.get("/api/1.0/projects/:project_id/user/:user_id", (req, res) => {
    res.json({path: req.path, params: req.params});
});

app.get("/api/1.0/projects/:project_id/users", (req, res) => {
    res.json({path: req.path, params: req.params});
});

app.use((req, res, next) => {
     res.send('404');
});

app.listen(13333, async () => {
    console.log("Server is running at http://localhost:13333");

    const responses = await Promise.all([
        fetch("http://localhost:13333/api/1.0/projects/123/users").then((res) =>
            res.json()
        ),
        fetch("http://localhost:13333/api/1.0/projects/456/user/789").then((res) =>
            res.json()
        ),
        fetch("http://localhost:13333/api/1.0/info/AAAAAA.2//details").then((res) =>
            res.json()
        ),
        fetch("http://localhost:13333/api/1.0/info/zzzzzz+2//details").then((res) =>
            res.json()
        ),
        fetch("http://localhost:13333/api/1.0/info/ab/Ab_23-+$/details").then((res) =>
            res.json()
        ),
        fetch("http://localhost:13333/api/1.0/info/cd//AAAAAA.a///details").then((res) =>
            res.json()
        ),
        fetch("http://localhost:13333/api/1.0/info/Ab%20c.+//details").then((res) =>
            res.json()
        ),
    ]);

    console.log(responses);

    process.exit(0);
});
