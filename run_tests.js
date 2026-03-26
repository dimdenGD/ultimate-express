const { exec } = require("child_process");
const fs = require("fs");

console.log("Starting tests...");
exec("node tests/index.js", { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    fs.writeFileSync("test_output2.txt", stdout + "\n" + stderr);
    if (error) {
        fs.appendFileSync("test_output2.txt", "\nERROR: " + error.message);
        console.log("Tests failed, see test_output2.txt");
    } else {
        console.log("Tests succeeded, see test_output2.txt");
    }
});
