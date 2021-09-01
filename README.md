# Aritrage-Crypto-Trader
## Requirements
* An Ethereum account with enough Ether to pay for gas.
* An **Infura** project url for connecting to Ethereum networks.
* **Nodejs** installed on your machine.
## Installing
First, clone the repo.
The repo contains 2 separate npm projects: one in the root of the project and one in the `web/client` directory.

Run `npm install` in both directories.
## Configuration
Before running the project, some configurations need to be changed:
* In `web/server/configuration.json`, set `DefaultAccountAddr` to the address of your account.

  Set `UniswapRouterAddr` to the contract's address in your Ethereum network of choice.
* Create a `.env` file at the root of the project, containing the following fields:
```
PRIVATE_KEY=
INFURA_PROJECT_ID=
```
And fill your account's private key and Infura's project id in the blank spaces.
## Deployment
The project is based on several Solidity contracts.

To compile them, run: `npx truffle compile`.

To deploy them, run: `npx truffle migrate --network rinkeby` (the network settings can be changed from `truffle-config.js`).

This command deploys 2 token contracts and the AutoCoinTrader contract.

Update the `AutoCoinTraderAddr` field in `configuration.json` to the deployed contract's address, and optionally add the deployed tokens to the `Tokens` field in the following format (WETH has to be the first token):
```json
[
    {
      "name": "Wrapped Ether",
      "unit": "WETH",
      "address": "0xc778417e063141139fce010982780140aa0cd5ab"
    }
]
```
## Running the project
### Server
Run the command `node web/server/server.js` from the root of the project.
### Client
Run the command `npm start` from the `web/client` directory.

The web application will open on `localhost:3000`.
