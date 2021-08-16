const path = require('path');
const fs = require('fs');
const Web3 = require('web3');
const privateKey = '2fa1e4c5e03e9b4a2aff43a55779221ea77038c205fb3472ad11b1696269d139';
const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://kovan.infura.io/ws/v3/80acc13fcbcf4fe6a380a05c3231772e'));
web3.eth.defaultAccount = '0x85fF53E32FcCDA712e4A9AF650E5e3868AF34ae3';
const ERC20JsonPath = path.resolve(process.cwd(), 'node_modules/@openzeppelin/contracts/build/contracts/ERC20.json');
const ERC20Json = JSON.parse(fs.readFileSync(ERC20JsonPath));
const ERC20Abi = ERC20Json.abi;

const autoCoinTraderJsonPath = path.resolve(process.cwd(), 'build/contracts/AutoCoinTrader.json');
const autoCoinTraderJson = JSON.parse(fs.readFileSync(autoCoinTraderJsonPath));
const autoCoinTraderAbi = autoCoinTraderJson.abi;

const uniswapRouterAddr = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const autoCoinTraderAddr = '0x07A6601051d78734c4ef11a7EeB84247F6aa1B4F';
const autoCoinTrader = new web3.eth.Contract(autoCoinTraderAbi, autoCoinTraderAddr);

const uniswapRouterJsonPath = path.resolve(process.cwd(), 'build/contracts/UniswapV2Router02.json');
const uniswapRouterJson = JSON.parse(fs.readFileSync(uniswapRouterJsonPath));
const uniswapRouterAbi = uniswapRouterJson.abi;
const uniswapRouter = new web3.eth.Contract(uniswapRouterAbi, uniswapRouterAddr);

const tokens = [
    {
        name: 'Etherium',
        unit: 'WETH',
        address: '0xd0a1e359811322d97991e03f863a0c30c2cf029c'
    },
    {
        name: 'NewSampleToken',
        unit: 'NTOK',
        address: '0xEa14a7826078Bed4Fe9F41EC322A802f169B98b9'
    },
    {
        name: 'MichalToken',
        unit: 'MST',
        address: '0x0E9999fbe2fe4f93A9f3B2E094d5b49222754114'
    }
];

module.exports = {
    web3: web3,
    defaultAccount: () => web3.eth.defaultAccount,
    tokens: tokens,
    privateKey: privateKey,
    uniswapRouter: uniswapRouter,
    ERC20Abi: ERC20Abi,
    autoCoinTrader: autoCoinTrader
};
