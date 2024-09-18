// must support res.format()

const express = require("express");

const app = express();

app.get('/test', (req, res) => {
    res.format({
        'text/plain': function () {
          res.send('hey')
        },
      
        'text/html': function () {
          res.send('<p>hey</p>')
        },
      
        'application/json': function () {
          res.send(JSON.stringify({ message: 'hey' }))
        },
      
        default: function () {
          res.status(406).send('Not Acceptable')
        }
    });
});

app.listen(13333, async () => {
    console.log('Server is running on port 13333');

    let response = await fetch('http://localhost:13333/test');
    console.log(await response.text());
    response = await fetch('http://localhost:13333/test', {
        headers: {
            'Accept': 'text/html'
        }
    });
    console.log(await response.text());
    response = await fetch('http://localhost:13333/test', {
        headers: {
            'Accept': 'application/json'
        }
    });
    console.log(await response.text());
    response = await fetch('http://localhost:13333/test', {
        headers: {
            'Accept': 'text/plain'
        }
    });
    console.log(await response.text());
    response = await fetch('http://localhost:13333/test', {
        headers: {
            'Accept': 'text/html, application/json, text/plain, */*'
        }
    });
    console.log(await response.text());
    process.exit(0);
});