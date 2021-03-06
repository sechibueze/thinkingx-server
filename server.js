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

  input UserInput {
    email: String
    phoneNumber: String
    emailVerified: Boolean
    password: String
    displayName: String
    photoURL: String
    disabled: Boolean
  }
  type User {
    email: String
    phoneNumber: String
    emailVerified: Boolean
    password: String
    displayName: String
    photoURL: String
    disabled: Boolean
  }
  type Message {
    message: String
    token: String
  }
  type Query {
    todos: [Todo]
    todoItem(id: String!): Todo
    users: [User]
  }
  type Mutation {
    signup(name: String!, email: String!, password: String!): User
    updateUserById(uid: ID!, fields: UserInput): User
    deletUserById(uid: String!): Message
  }
`;
const todos = [
  {
    id: "1",
    title: "Firebase authentication",
    description: "Add user auth with firebase",
    completed: false,
    due_date: "12-05-2021",
  },
  {
    id: "2",
    title: "CRUD TODO",
    description: "Hey! a quick reminder",
    completed: false,
    due_date: "12-05-2021",
  },
];
const resolvers = {
  Query: {
    todos: (_, args, context) => {
      if (!context?.uid) {
        throw new Error("Token required");
      }

      return todos;
    },
    todoItem: (_, args, context) => {
      if (!context?.uid) {
        throw new Error("Token required");
      }
      if (!args.id) {
        throw new Error("ID required");
      }

      const todoItem = todos.filter((todo) => todo.id === args.id);
      return todoItem[0];
    },
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
              displayName: userRecord.displayName,
              email: userRecord.email,
              password: userRecord.uid,
              emailVerified: userRecord.emailVerified,
              photoURL: userRecord.photoURL,
              ...userRecord,
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
    signup: (_, { name, email, password }, context) => {
      console.log("TODO:[Mutation.signup]:validate users input", {
        name,
        email,
        password,
      });
      const newUser = {
        displayName: name,
        email,
        password,
      };
      console.log("[Mutation.signup]:Creating a new user", newUser);
      return admin
        .auth()
        .createUser(newUser)
        .then((userRecord) => {
          console.log("[Mutation.signup]:new user record", userRecord);

          return { ...userRecord };
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
    updateUserById: (_, { fields, uid }, context) => {
      console.log("updateUserById:TODO validate user inputs", fields);
      /***
       * Check context: user needs to be authenticated
       * Or the admin can force this update
       */

      return admin
        .auth()
        .updateUser(uid, fields)
        .then((userRecord) => {
          console.log("Update user recors", userRecord);
          return { ...userRecord };
        })
        .catch((error) => {
          console.info("Failed to update user data", error);
          throw new Error(error);
        });
    },
    deletUserById: (_, { uid }, context) => {
      console.log("About to remove user with uid: ", uid);
      return admin
        .auth()
        .deleteUser(uid)
        .then((result) => {
          console.log("User successfully removed ", result);
          return {
            message: `Goodbye: ${uid} has been removed`,
          };
        })
        .catch((error) => {
          console.log("Failed to remove user", error);
          throw new Error(error);
        });
    },
  },
};
const corsOptions = {};
const server = new ApolloServer({
  cors: {
    origin: [
      "http://localhost:3000",
      "https://thinkingx-611dc.firebaseapp.com",
      "https://thinkingx.firebaseapp.com",
    ],
    credentials: true,
  },

  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
  context: ({ req }) => {
    let token = "";
    const authorization = req.headers.authorization;

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
        console.log("Decoded token", decoded.name);
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

server
  .listen({ port: process.env.PORT || 5000 })
  .then(({ url }) => console.log(`Server started on ${url}`));
