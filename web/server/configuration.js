const fs = require('fs');
const Web3 = require('web3');

let configJson = JSON.parse(fs.readFileSync('web/server/configuration.json'));

const privateKey = process.argv[1];
let web3;
const ERC20Json = JSON.parse(fs.readFileSync('node_modules/@openzeppelin/contracts/build/contracts/ERC20.json'));
const ERC20Abi = ERC20Json.abi;
let autoCoinTrader;
let uniswapRouter;
let tokens;
reload();

function reload() {
    configJson = JSON.parse(fs.readFileSync('web/server/configuration.json'));
    web3 = new Web3(new Web3.providers.WebsocketProvider(configJson['InfuraUrl']));
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
    privateKey: () => privateKey,
    uniswapRouter: () => uniswapRouter,
    ERC20Abi: () => ERC20Abi,
    autoCoinTrader: () => autoCoinTrader
};
