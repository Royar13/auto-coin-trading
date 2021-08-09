var http = require('http')
var axios = require('axios')

let coins = [
    {
        name: 'Etherium',
        unit: 'WETH',
        address: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
        value: 1
    },
    {
        name: 'NewSampleToken',
        unit: 'NTOK',
        address: '0xEa14a7826078Bed4Fe9F41EC322A802f169B98b9',
        value: 4.81939
    },
    {
        name: 'MichalToken',
        unit: 'MST',
        address: '0x0E9999fbe2fe4f93A9f3B2E094d5b49222754114',
        value: 1.2
    }
]

let cryptoExchangeMat = [
    [1, 4.81939, 1 / 5],
    [1 / 4.81939, 1, 5],
    [5, 1 / 5, 1]
]

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
    getCoin: function (index) {
        return coins[index]
    }
}

function buildExchangeMat(cryptoCoins) {
    let exchangeMat = []
    let exchangeMatOrig = []

    for (let i = 0; i < cryptoCoins.length; i++) {
        let coin = cryptoCoins[i]
        exchangeMatOrig[i] = []
        exchangeMat[i] = []
        for (let j = 0; j < cryptoCoins.length; j++) {
            let otherCoin = cryptoCoins[j]
            exchangeMatOrig[i][j] = otherCoin['value'] / coin['value']
            exchangeMat[i][j] = -Math.log(otherCoin['value'] / coin['value'])
        }
    }
    //console.log(coins.map(c => c.name).join(','))
    for (let i = 0; i < cryptoCoins.length; i++) {
        //console.log(exchangeMat[i].join(','))
    }
    return exchangeMat
}

function applyLogMat(exchangeMat) {
    exchangeMatLog = []
    for (let i = 0; i < exchangeMat.length; i++) {
        exchangeMatLog[i] = []
        for (let j = 0; j < exchangeMat.length; j++) {
            //todo: fix
            exchangeMatLog[i][j] = -Math.log(1 / exchangeMat[i][j])
        }
    }
    return exchangeMatLog
}

function arbitrage(exchangeMat, source, coins) {
    let n = exchangeMat.length
    let minDist = []
    let pre = []
    for (let i = 0; i < n; i++) {
        // null means "Infinity"
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
    var cycle = [dest, source]
    var con = true
    var currCoin = source
    while (con) {
        cycle.push(pre[currCoin])
        currCoin = pre[currCoin]
        con = !cycle.some(c => c === pre[currCoin])
    }
    cycle.push(pre[currCoin])

    if (cycle[0] == cycle[cycle.length - 1]) {
        console.log(cycle.map(c => coins[c].name).join('-->'))
        return cycle
    } else {
        return null
    }
}
