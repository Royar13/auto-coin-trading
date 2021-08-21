require('dotenv').config();
const fs = require('fs');
const Web3 = require('web3');

let configJson = JSON.parse(fs.readFileSync('web/server/configuration.json'));

let web3;
const ERC20Json = JSON.parse(fs.readFileSync('node_modules/@openzeppelin/contracts/build/contracts/ERC20.json'));
const ERC20Abi = ERC20Json.abi;
let autoCoinTrader;
let uniswapRouter;
let tokens;
reload();

async function reload() {
    configJson = JSON.parse(fs.readFileSync('web/server/configuration.json'));
    const options = {
        timeout: 30000, // ms

        clientConfig: {
            // Useful if requests are large
            maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
            maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

            // Useful to keep a connection alive
            keepalive: true,
            keepaliveInterval: -1 // ms
        },

        // Enable auto reconnection
        reconnect: {
            auto: true,
            delay: 1000, // ms
            maxAttempts: 10,
            onTimeout: false
        }
    };
    const infuraUrl = configJson['InfuraUrl'] + process.env.INFURA_PROJECT_ID;
    web3 = new Web3(new Web3.providers.WebsocketProvider(infuraUrl, options));
    web3.eth.defaultAccount = configJson['DefaultAccountAddr'];

    const autoCoinTraderJson = JSON.parse(fs.readFileSync('build/contracts/AutoCoinTrader.json'));
    const autoCoinTraderAbi = autoCoinTraderJson.abi;
    const autoCoinTraderAddr = configJson['AutoCoinTraderAddr'];
    autoCoinTrader = new web3.eth.Contract(autoCoinTraderAbi, autoCoinTraderAddr);

    const uniswapRouterAddr = configJson['UniswapRouterAddr'];
    const uniswapRouterJson = JSON.parse(fs.readFileSync('build/contracts/UniswapV2Router02.json'));
    const uniswapRouterAbi = uniswapRouterJson.abi;
    uniswapRouter = new web3.eth.Contract(uniswapRouterAbi, uniswapRouterAddr);

    tokens = configJson['Tokens'];
}


module.exports = {
    reload: reload,
    web3: () => web3,
    defaultAccount: () => web3.eth.defaultAccount,
    tokens: () => tokens,
    privateKey: () => process.env.PRIVATE_KEY,
    uniswapRouter: () => uniswapRouter,
    ERC20Abi: () => ERC20Abi,
    autoCoinTrader: () => autoCoinTrader
};
