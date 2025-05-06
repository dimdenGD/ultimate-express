// must support graphql-http

const express = require("express");
const { createHandler } = require('graphql-http/lib/use/express');
const { GraphQLSchema, GraphQLObjectType, GraphQLString } = require('graphql');

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      hello: {
        type: GraphQLString,
        resolve: () => 'world',
      },
    },
  }),
});


const app = express();
app.all('/graphql', createHandler({ schema }));

app.listen(13333, async () => {
    console.log("Server is running on port 13333");

    const response = await fetch('http://localhost:13333/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: '{ hello }',
        }),
    })
    .then(res => res.json())

    console.log(response);

    process.exit(0);
});