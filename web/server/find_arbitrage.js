var http = require('http')
var axios = require('axios')

let coins = [
    {
        name: 'Bitcoin',
        unit: 'BTC',
        address: '',
        value: 1
    },
    {
        name: 'DAI',
        unit: 'DAI',
        address: '',
        value: 1.2
    },
    {
        name: 'Satoshi',
        unit: 'STH',
        address: '',
        value: 1.2
    }
]

module.exports = {
    getExchangePath: function () {
        return axios.get('https://api.coingecko.com/api/v3/exchange_rates').then(res => {
            let rates = res.data.rates
            let cryptoCoins = Object.values(rates).filter(c => c.type === 'crypto')
            let exchangeMat = buildExchangeMat(cryptoCoins)
            return arbitrage(exchangeMat, 0, cryptoCoins)
        }).catch(err => {
            console.error('Error: ' + err.message)
            throw err
        })
    }
}

function buildExchangeMat(cryptoCoins) {
    let exchangeMat = []
    let exchangeMatOrig = []

    for (let i = 0; i < cryptoCoins.length; i++) {
        let coin = cryptoCoins[i]
        coins.push(coin)
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
