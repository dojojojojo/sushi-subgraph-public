import {
  CosmosDatasourceKind,
  CosmosHandlerKind,
  CosmosProject,
} from "@subql/types-cosmos";

// Can expand the Datasource processor types via the genreic param
const project: CosmosProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "sushi-subgraph",
  description:
    "This project can be use as a starting point for developing your Cosmos Injective based 404 subgraph.",
  runner: {
    node: {
      name: "@subql/node-cosmos",
      version: ">=3.0.0",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    /* The genesis hash of the network (hash of block 0) */
    chainId: "injective-1",
    endpoint: [
      "https://sentry.tm.injective.network:443",
    ],
    chaintypes: new Map([
    ]),
  },
  dataSources: [
    {
      kind: CosmosDatasourceKind.Runtime,
      startBlock: 61027149,
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            handler: "handleNFT",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "wasm",
              attributes: {
                _contract_address: "inj12eca9xszt84qm9tztyuje96nn3v2wd3v4yrzge", // pair address
              },
            },
          },
          {
            handler: "handleNFT",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "wasm",
              attributes: {
                _contract_address: "inj1n73yuus64z0yrda9hvn77twkspc4uste9j9ydd", // sushi
              },
            },
          },
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;
