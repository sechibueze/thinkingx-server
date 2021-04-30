const { ApolloServer, gql } = require("apollo-server");
const { config } = require("dotenv");
config();
const admin = require("./src/config/firebase-admin");
const typeDefs = gql`
  type Todo {
    title: String!
    description: String
    due_date: String!
    completed: Boolean
  }

  type User {
    username: String!
    email: String!
    password: String!
  }

  type Query {
    todos: [Todo]
  }
  type Mutation {
    signup: User
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
  Mutation: {
    signup: (_, { username, email, password }, context) => {
      console.log("signup mutation", context);
      return { username, email, password };
    },
  },
};
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const authorization = req.headers.authorization;
    console.log(" auth", authorization);
    if (!authorization.startsWith("Bearer ")) {
      return null;
    }
    const token = authorization.split(" ")[1];
    const decodedToken = admin.auth().verifyIdToken(token);

    console.log("decoded token", decodedToken);

    return decodedToken;
  },
});

server
  .listen()
  .then(({ url }) => console.log(`Apollo Server started on ${url}`));
