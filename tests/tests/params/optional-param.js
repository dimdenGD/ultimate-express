// must support optional params

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get('/category/:nome?', (req, res) => {
    const nome = req.params.nome || 'default';
    res.send(`category: ${nome}`);
});

app.get('/category2/:nome?/adf', (req, res) => {
    const nome = req.params.nome || 'default';
    res.send(`category: ${nome}`);
});

app.listen(13333, async () => {
  console.log('Server is running on port 13333')

  let response = await fetchTest('http://localhost:13333/category/bar').then(res => res.text())
  console.log(response)

  response = await fetchTest('http://localhost:13333/category').then(res => res.text())
  console.log(response);

  response = await fetchTest('http://localhost:13333/category2/bar/adf').then(res => res.text())
  console.log(response)

  response = await fetchTest('http://localhost:13333/category2/adf').then(res => res.text())
  console.log(response)
  
  

  process.exit(0)
})