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
    users: [User]
  }
  type Mutation {
    signup(username: String!, email: String!, password: String!): User
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
    users: () => {
      return admin
        .auth()
        .getUsers([
          { uid: "b1r05AlHChbNWtZxYUNI2oh7tdY2" },
          { uid: "vSbQhQgXGMTCux1uerviTIvtZiB2" },
        ])
        .then((getUsersResult) => {
          console.log("Query.user", getUsersResult);
          if (getUsersResult.notFound.length < 1) {
            return getUsersResult.users.map((userRecord) => ({
              uid: userRecord.uid,
              username: userRecord.displayName,
              email: userRecord.email,
              password: userRecord.uid,
              emailVerified: userRecord.emailVerified,
              photoURL: userRecord.photoURL,
            }));
          } else {
            throw new Error("No user was found");
          }
        })
        .catch((err) => {
          console.log("Query.users error: ", err);
          throw new Error(err);
        });
    },
  },
  Mutation: {
    signup: (_, { username, email, password }, context) => {
      console.log("TODO:[Mutation.signup]:validate users input", {
        username,
        email,
        password,
      });
      const newUser = {
        displayName: username,
        email,
        password,
      };
      console.log("[Mutation.signup]:Creating a new user", newUser);
      return admin
        .auth()
        .createUser(newUser)
        .then((userRecord) => {
          console.log("[Mutation.signup]:new user record", userRecord);

          return { username, email, password };
        })
        .catch((error) => {
          const err = {
            trace: error.code,
            message: error.message,
          };
          console.log("[Mutation.signup]:error 0", err);
          throw new Error(error);
        });
    },
  },
};
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    let token = "";
    const authorization = req.headers.authorization;
    console.log(" auth token", authorization);
    if (!authorization) {
      return {
        uid: null,
      };
    }

    if (authorization.startsWith("Bearer ")) {
      token = authorization.split(" ")[1];
    } else {
      return {
        uid: null,
      };
    }

    return admin
      .auth()
      .verifyIdToken(token)
      .then((decoded) => {
        console.log("Decoded token", decoded);

        return {
          uid: decoded.uid,
        };
      })
      .catch((error) => {
        console.log("error in decodeing token", error);
        return { uid: null };
      });
  },
});

server.listen().then(({ url }) => console.log(`Server started on ${url}`));
