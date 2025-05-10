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

        'application/json; charset=utf-8': function () {
          res.send(JSON.stringify({ message: 'utf-8' }))
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
    console.log(response.headers.get('content-type'));
    response = await fetch('http://localhost:13333/test', {
        headers: {
            'Accept': 'text/html'
        }
    });
    console.log(await response.text());
    console.log(response.headers.get('content-type'));
    response = await fetch('http://localhost:13333/test', {
        headers: {
            'Accept': 'application/json'
        }
    });
    console.log(await response.text());
    console.log(response.headers.get('content-type')?.toLowerCase());
    response = await fetch('http://localhost:13333/test', {
        headers: {
            'Accept': 'text/plain'
        }
    });
    console.log(await response.text());
    console.log(response.headers.get('content-type')?.toLowerCase());
    response = await fetch('http://localhost:13333/test', {
        headers: {
            'Accept': 'text/html, application/json, text/plain, */*'
        }
    });
    console.log(await response.text());
    console.log(response.headers.get('content-type')?.toLowerCase());
    response = await fetch('http://localhost:13333/test', {
        headers: {
            'Accept': 'application/json; charset=utf-8'
        }
    });
    console.log(await response.text());
    console.log(response.headers.get('content-type')?.toLowerCase());
    response = await fetch('http://localhost:13333/test', {
        headers: {
            'Accept': 'application/xml'
        }
    });
    console.log(await response.text());
    console.log(response.headers.get('content-type')?.toLowerCase());
    process.exit(0);
});