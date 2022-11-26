import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import knex from "knex";

const knexClient = knex({
    client: "mysql",
    connection: {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "secret",
        database: "TESTDB",
    },
});
const getGraphs = async () => {
    const result = await knexClient.select().from("graphs");
    return result;
};
const insertToGraph = async (name: string) => {
    console.log("insertGraph", name);
    return knexClient("graphs").insert({ name: name });
};

const typeDefs = `#graphql
# Comments in GraphQL strings (such as this one) start with the hash (#) symbol.
type Graphs {
    id: Int
    name: String
}
type GraphOutput {
    id: Int
}

type Query {
    graphs: [Graphs]
    test: String
}
type Mutation {
    insertGraph(name: String):GraphOutput
}
`;

const resolvers = {
    Query: {
        graphs: async () => await getGraphs(),
        test: async (_, { id }, { dataSources }) => {
            return dataSources.restAPI.getRest(id);
        },
    },
    Mutation: {
        insertGraph: (parent, args) => {
            return insertToGraph(args.name)
                .then((result) => {
                    console.log("result", result[0]);
                    return { id: result[0] };
                })
                .catch(() => {
                    return { id: null };
                });
        },
    },
};

// The ApolloServer constructor
const server = new ApolloServer({
    typeDefs,
    resolvers,
});
const { cache } = server;
const { url } = await startStandaloneServer(server, {
    context: async ({ req, res }) => {
        return {
            dataSources: {
                cache
            },
        };
    },
    listen: { port: 4000 },
});

console.log(`Server ready at: ${url}`);
