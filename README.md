# Subgraph for Sushi

## Description
This project is a subgraph for tracking events on sushi fighters

## Installation

```sh
yarn install
yarn codegen # to generate types
yarn build # to build the subgraph
yarn create-local # to create a local subgraph
yarn deploy-local # to deploy the subgraph to a local graph node
```

## Usage

Update the following before running the commands above:

1. LP address in mappingHandlers with LP address for your 404
2. Contract address in project.ts with the contract address for your 404
3. Token address in project.ts with the token address for your 404 (cw20)

## Note
- For hosted deployment, create an account on subquery.network and deploy the subgraph