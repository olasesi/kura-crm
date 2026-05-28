import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { typeDefs } from "./typeDefs";
import { resolvers } from "./resolvers";
import { JwtPayload } from "../types";

export interface GraphQLContext {
  user?: JwtPayload;
}

export const createApolloServer = (httpServer: any) => {
  return new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    context: ({ req }: { req: { user?: JwtPayload } }) => {
      return { user: req.user };
    },
    formatError: (formattedError) => {
      return {
        message: formattedError.message,
        code: formattedError.extensions?.code || "INTERNAL_SERVER_ERROR",
        locations: formattedError.locations,
        path: formattedError.path,
      };
    },
    introspection: true,
  });
};
