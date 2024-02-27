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

- Update the graphql file to add new types
- Run `yarn codegen` to generate types
- Run `yarn build` to build the subgraph
- Run `yarn deploy-local` to deploy the subgraph to a local graph node
- For hosted deployment, create an account on subquery.network and deploy the subgraph