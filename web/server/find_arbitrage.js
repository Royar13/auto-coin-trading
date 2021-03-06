const conf = require('./configuration');

let exchangeRatesMat = null;
let logExchangeRatesMat = null;

module.exports = {
    createExchangeRatesMat: createExchangeRatesMat,
    getExchangePath: getExchangePath,
    getExchangeRate: function (tokenA, tokenB) {
        return exchangeRatesMat[tokenA][tokenB];
    }
};

async function getExchangePath(tokens) {
    if (!exchangeRatesMat) {
        await createExchangeRatesMat(tokens);
        console.log(exchangeRatesMat);
    }
    if (!logExchangeRatesMat) {
        logExchangeRatesMat = applyLogMat(exchangeRatesMat);
    }
    let cycles = findArbitrageCycles(logExchangeRatesMat, 0);
    if (cycles.length > 0) {
        console.log('Found ' + cycles.length + ' arbitrage cycles:');
        cycles.forEach(cycle => {
            console.log(cycle.map(c => tokens[c].name).join('-->'));
        });
    } else {
        console.log('Did not find arbitrage cycles');
    }
    return cycles;
}

async function fetchUniswapExchangeRate(tokenA, tokenB) {
    // a value lower than 1 is used to avoid too big of an impact on the liquidity pool
    let one = conf.web3().utils.toWei('0.0001');
    let amountsOut = await conf.uniswapRouter().methods.getAmountsOut(one, [tokenA, tokenB]).call();
    return parseInt(amountsOut[1]) / one;
}

async function createExchangeRatesMat(tokens) {
    exchangeRatesMat = [];
    //initialize 2-dimensional array
    for (let i = 0; i < tokens.length; i++) {
        exchangeRatesMat[i] = [];
        exchangeRatesMat[i][i] = 1;
    }

    for (let i = 0; i < tokens.length - 1; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
            try {
                let rate = await fetchUniswapExchangeRate(tokens[i].address, tokens[j].address);
                exchangeRatesMat[i][j] = rate;
                exchangeRatesMat[j][i] = 1 / rate;
            } catch (err) {
                exchangeRatesMat = [];
                throw new Error('Cannot find exchange rate between tokens ' + tokens[i].unit + ' and ' + tokens[j].unit);
            }
        }
    }

    return exchangeRatesMat;
}

function applyLogMat(exchangeMat) {
    let exchangeMatLog = [];
    for (let i = 0; i < exchangeMat.length; i++) {
        exchangeMatLog[i] = [];
        for (let j = 0; j < exchangeMat.length; j++) {
            exchangeMatLog[i][j] = -Math.log(exchangeMat[i][j]);
        }
    }
    return exchangeMatLog;
}

function findArbitrageCycles(exchangeMat, source) {
    let n = exchangeMat.length;
    let minDist = [];
    let pre = [];
    for (let i = 0; i < n; i++) {
        // null signifies "Infinity"
        minDist.push(null);
        pre.push(null);
    }
    minDist[source] = 0;

    let epsilon = 0.00001;
    for (let iter = 0; iter < n - 1; iter++) {
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (minDist[i] !== null && (minDist[j] == null || minDist[i] + exchangeMat[i][j] < minDist[j] - epsilon)) {
                    minDist[j] = minDist[i] + exchangeMat[i][j];
                    pre[j] = i;
                }
            }
        }
    }

    let cycles = [];
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (minDist[i] + exchangeMat[i][j] < minDist[j] - epsilon) {
                // negative cycle exists, and use the predecessor chain to print the cycle
                let cycle = getCycle(pre, i);
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
