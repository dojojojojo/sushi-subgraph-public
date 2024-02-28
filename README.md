# Subgraph for Sushi

## Description
This project is a subgraph for tracking events on sushi fighters

## Installation

Update the following before running the commands above:

- Token address in project.ts with the token address for your 404 (cw20)

```sh
yarn install
yarn codegen # to generate types
yarn build # to build the subgraph
yarn create-local # to create a local subgraph
yarn deploy-local # to deploy the subgraph to a local graph node
```

## Usage

The current subgraph only tracks the mints emitted after a successful swaps, if you are using similar mechanism, you can use the subgraph as is. If you are using a different mechanism, you can update the subgraph to track the events you are interested in.

Update the following if your mechanism is based on swaps.
- Contract address in project.ts with the contract address for your 404, aka pair address,
- LP address in mappingHandlers with LP address for your 404. Current subgraph is dependent of swaps for sushi-dojo pair. (optional)

If not: 
- Update the mappingHandlers to track the events you are interested in.
- remove the pair from the schema.graphql and project.ts. 

## Note
- For hosted deployment, create an account on subquery.network and deploy the subgraph