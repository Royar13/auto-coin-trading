const fs = require('fs');
const Web3 = require('web3');

const configJson = JSON.parse(fs.readFileSync('web/configuration.json'));

const privateKey = configJson['InfuraPrivateKey'];
const web3 = new Web3(new Web3.providers.WebsocketProvider(configJson['InfuraUrl']));
web3.eth.defaultAccount = configJson['DefaultAccountAddr'];
const ERC20Json = JSON.parse(fs.readFileSync('node_modules/@openzeppelin/contracts/build/contracts/ERC20.json'));
const ERC20Abi = ERC20Json.abi;

const autoCoinTraderJson = JSON.parse(fs.readFileSync('build/contracts/AutoCoinTrader.json'));
const autoCoinTraderAbi = autoCoinTraderJson.abi;

const uniswapRouterAddr = configJson['UniswapRouterAddr'];
const autoCoinTraderAddr = configJson['AutoCoinTraderAddr'];
const autoCoinTrader = new web3.eth.Contract(autoCoinTraderAbi, autoCoinTraderAddr);

const uniswapRouterJson = JSON.parse(fs.readFileSync('build/contracts/UniswapV2Router02.json'));
const uniswapRouterAbi = uniswapRouterJson.abi;
const uniswapRouter = new web3.eth.Contract(uniswapRouterAbi, uniswapRouterAddr);

const tokens = configJson['Tokens'];

module.exports = {
    web3: web3,
    defaultAccount: () => web3.eth.defaultAccount,
    tokens: tokens,
    privateKey: privateKey,
    uniswapRouter: uniswapRouter,
    ERC20Abi: ERC20Abi,
    autoCoinTrader: autoCoinTrader
};
