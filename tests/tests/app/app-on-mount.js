// must emit 'mount' when using subapp

const express = require("express");

const app = express();
const student = express();
const teacher = express();

teacher.on('mount', (parent) => {
	console.log('aaaaaaaaaaaaaaaaaaaaaaaaaa');
});

student.on('mount', (parent) => {
	console.log('dewd');
});

teacher.use((req, res, next) => {
    console.log('teacher 1');
    next();
});

teacher.get('/', (req, res) => {
    res.end('teacher 2');
})

teacher.use('/student', student);

student.use((req, res, next) => {
    console.log('student 1');
    next();
});

app.use('/student', student);
app.use('/teacher', teacher);

app.listen(13333, async (err) => {
    console.log("Server is running on port 13333");

    const output = await fetch('http://localhost:13333/teacher').then(res => res.text());
    console.log(output);
    await fetch('http://localhost:13333/teacher/student')

    process.exit(0);
});
