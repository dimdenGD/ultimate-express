const express = require("express");

const swaggerUi = require("swagger-ui-express");

const app = express();

const options = {
  explorer: true,
  swaggerOptions: {
    urls: [
      {
        url: "http://petstore.swagger.io/v2/swagger.json",
        name: "Spec1",
      },
      {
        url: "http://petstore.swagger.io/v2/swagger.json",
        name: "Spec2",
      },
    ],
  },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(null, options));

app.listen(13333, async () => {
  console.log("Server is running on port 13333");

  const responses = await fetch("http://localhost:13333/api-docs").then((r) =>
    r.text()
  );
  console.log(responses);

  process.exit(0);
});
