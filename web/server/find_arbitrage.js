const axios = require('axios')
const Web3 = require('web3');
const path = require('path');
const fs = require('fs');
const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://kovan.infura.io/ws/v3/80acc13fcbcf4fe6a380a05c3231772e'));

const uniswapRouterAddr = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const uniswapRouterJsonPath = path.resolve(process.cwd(), 'build/contracts/UniswapV2Router02.json');
const uniswapRouterJson = JSON.parse(fs.readFileSync(uniswapRouterJsonPath));
const uniswapRouterAbi = uniswapRouterJson.abi;

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

let cryptoExchangeMat = [
    [1, 4.81939, 1 / 5],
    [1 / 4.81939, 1, 5],
    [5, 1 / 5, 1]
]

createExchangeRatesMat();


module.exports = {
    getExchangePath: function () {
        return axios.get('https://api.coingecko.com/api/v3/exchange_rates').then(res => {
            // let rates = res.data.rates
            // let cryptoCoins = Object.values(rates).filter(c => c.type === 'crypto')
            let exchangeMat = applyLogMat(cryptoExchangeMat)
            return arbitrage(exchangeMat, 0, coins)
        }).catch(err => {
            console.error('Error: ' + err.message)
            throw err
        })
    },
    getExchangeRate: function (coinA, coinB) {
        return cryptoExchangeMat[coinA][coinB]
    },
    getCoin: getCoin
}

function getCoin(index) {
    return coins[index];
}

async function fetchUniswapExchangeRate(tokenA, tokenB) {
    const uniswapRouter = new web3.eth.Contract(uniswapRouterAbi, uniswapRouterAddr);
    let one = web3.utils.toWei('1', 'ether');
    let amountsOut = await uniswapRouter.methods.getAmountsOut(one, [tokenA, tokenB]).call();
    return parseFloat(web3.utils.fromWei(amountsOut[1], 'ether'));
}

async function createExchangeRatesMat() {
    let ratesMat = []
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
            //todo: fix
            exchangeMatLog[i][j] = -Math.log(1 / exchangeMat[i][j]);
        }
    }
    return exchangeMatLog
}

function arbitrage(exchangeMat, source, coins) {
    let n = exchangeMat.length
    let minDist = []
    let pre = []
    for (let i = 0; i < n; i++) {
        // null signifies "Infinity"
        minDist.push(null)
        pre.push(null)
    }
    minDist[source] = 0

    for (let iter = 0; iter < n - 1; iter++) {
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (minDist[i] !== null && (minDist[j] == null || minDist[i] + exchangeMat[i][j] < minDist[j])) {
                    minDist[j] = minDist[i] + exchangeMat[i][j]
                    pre[j] = i
                }
            }
        }
    }

    //epsilon = 0.000000000000001
    let epsilon = 0
    let cycles = []
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (minDist[i] + exchangeMat[i][j] < minDist[j] - epsilon) {
                // negative cycle exists, and use the predecessor chain to print the cycle
                var cycle = getCycle(pre, i, j, coins)
                if (cycle) {
                    cycles.push(cycle)
                }
            }
        }
    }
    console.log('Done')
    return cycles
}

function getCycle(pre, source, dest, coins) {
    let cycle = [dest, source]
    let con = true
    let currCoin = source
    while (con) {
        cycle.push(pre[currCoin])
        currCoin = pre[currCoin]
        con = !cycle.some(c => c === pre[currCoin])
    }
    cycle.push(pre[currCoin])

    if (cycle[0] === cycle[cycle.length - 1]) {
        console.log(cycle.map(c => coins[c].name).join('-->'))
        return cycle
    } else {
        return null
    }
}
