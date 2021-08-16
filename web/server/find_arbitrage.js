const Web3 = require('web3');
const path = require('path');
const fs = require('fs');
const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://kovan.infura.io/ws/v3/80acc13fcbcf4fe6a380a05c3231772e'));

const uniswapRouterAddr = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const uniswapRouterJsonPath = path.resolve(process.cwd(), 'build/contracts/UniswapV2Router02.json');
const uniswapRouterJson = JSON.parse(fs.readFileSync(uniswapRouterJsonPath));
const uniswapRouterAbi = uniswapRouterJson.abi;
const uniswapRouter = new web3.eth.Contract(uniswapRouterAbi, uniswapRouterAddr);

let coins = [
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
]


let exchangeRatesMat = null;
let logExchangeRatesMat = null;


module.exports = {
    getExchangePath: getExchangePath,
    getExchangeRate: function (coinA, coinB) {
        return exchangeRatesMat[coinA][coinB]
    },
    getCoin: getCoin
}

function getCoin(index) {
    return coins[index];
}

async function getExchangePath() {
    if (!exchangeRatesMat) {
        exchangeRatesMat = await createExchangeRatesMat();
        logExchangeRatesMat = applyLogMat(exchangeRatesMat);
    }
    return arbitrage(logExchangeRatesMat, 0, coins);
}

async function fetchUniswapExchangeRate(tokenA, tokenB) {
    // a value lower than 1 is used to avoid too big of an impact on the liquidity pool
    let one = web3.utils.toWei('0.0001');
    let amountsOut = await uniswapRouter.methods.getAmountsOut(one, [tokenA, tokenB]).call();
    return parseInt(amountsOut[1]) / one;
}

async function createExchangeRatesMat() {
    let ratesMat = [];
    //initialize 2-dimensional array
    for (let i = 0; i < coins.length; i++) {
        ratesMat[i] = [];
        ratesMat[i][i] = 1;
    }

    for (let i = 0; i < coins.length - 1; i++) {
        for (let j = i + 1; j < coins.length; j++) {
            let rate = await fetchUniswapExchangeRate(coins[i].address, coins[j].address);
            ratesMat[i][j] = rate;
            ratesMat[j][i] = 1 / rate;
        }
    }

    console.log(ratesMat);
    return ratesMat;
}

function applyLogMat(exchangeMat) {
    let exchangeMatLog = []
    for (let i = 0; i < exchangeMat.length; i++) {
        exchangeMatLog[i] = []
        for (let j = 0; j < exchangeMat.length; j++) {
            exchangeMatLog[i][j] = -Math.log(exchangeMat[i][j]);
        }
    }
    return exchangeMatLog
}

function arbitrage(exchangeMat, source, coins) {
    let n = exchangeMat.length;
    let minDist = [];
    let pre = [];
    for (let i = 0; i < n; i++) {
        // null signifies "Infinity"
        minDist.push(null);
        pre.push(null);
    }
    minDist[source] = 0;

    for (let iter = 0; iter < n - 1; iter++) {
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (minDist[i] !== null && (minDist[j] == null || minDist[i] + exchangeMat[i][j] < minDist[j])) {
                    minDist[j] = minDist[i] + exchangeMat[i][j];
                    pre[j] = i;
                }
            }
        }
    }

    //epsilon = 0.000000000000001
    let epsilon = 0;
    let cycles = [];
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (minDist[i] + exchangeMat[i][j] < minDist[j] - epsilon) {
                // negative cycle exists, and use the predecessor chain to print the cycle
                let cycle = getCycle(pre, i);
                console.log(cycle.map(c => coins[c].name).join('-->'));
                cycles.push(cycle);
            }
        }
    }
    return cycles;
}

function getCycle(pre, source) {
    let cycle = [source];
    let currCoin = source;
    let index = -1;
    while (index < 0) {
        currCoin = pre[currCoin];
        index = cycle.findIndex(c => c === currCoin);
        cycle.unshift(currCoin);
    }
    cycle = cycle.slice(0, index + 2);
    return cycle;
}
