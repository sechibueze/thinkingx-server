const { ApolloServer, gql } = require("apollo-server");

const typeDefs = gql`
  type Todo {
    title: String!
    description: String
    due_date: String!
    completed: Boolean
  }

  type Query {
    todos: [Todo]
  }
`;
const todos = [
  {
    title: "Hello",
    decription: "Hey! a quick reminder",
    completed: false,
    due: "12-05-2021",
  },
];
const resolvers = {
  Query: {
    todos: () => todos,
  },
};
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server
  .listen()
  .then(({ url }) => console.log(`Apollo Server started on ${url}`));
