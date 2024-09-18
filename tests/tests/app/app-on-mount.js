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

app.use('/student', student);
app.use('/teacher', teacher);

app.listen(13333, (err) => {
    console.log("Server is running on port 13333");
    
    process.exit(0);
});
