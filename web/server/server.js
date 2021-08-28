const express = require('express');
const app = express();
const cors = require('cors');
const conf = require('./configuration');
const findArbitrage = require('./find_arbitrage');
const tokenExchange = require('./token_exchange');


const port = 8080;

app.use(express.json());
app.use(cors());

app.listen(port);

app.get('/api/getConfig', (req, res) => {
    let exportedConfig = exportConfigToClient();
    res.json(exportedConfig);
});

app.get('/api/calculateExchangeRatesMat', async (req, res) => {
    try {
        let exchangeRatesMat = await findArbitrage.createExchangeRatesMat(conf.tokens());
        res.json({exchangeRatesMat: exchangeRatesMat});
    } catch (err) {
        returnError(res, err.message);
    }
});

app.get('/api/findArbitrageCycle', async (req, res) => {
    try {
        let cycles = await findArbitrage.getExchangePath(conf.tokens());
        let cycle = cycles.length > 0 ? cycles[0] : null;
        res.json({cycle: cycle});
    } catch (err) {
        returnError(res, err.message);
    }
});

app.get('/api/getBalance', async (req, res) => {
    const web3 = conf.web3();
    const tokenContract = new web3.eth.Contract(conf.ERC20Abi(), req.query.address);
    const balance = await tokenContract.methods.balanceOf(conf.defaultAccount()).call();
    res.json({balance: balance});
});

app.get('/api/calculateExpectedProfit', async (req, res, next) => {
    try {
        let amountIn = parseInt(req.query.amount);
        if (amountIn <= 0) {
            returnError(res, 'Amount has to be positive');
        }
        let cycle = req.query.cycle.map(i => parseInt(i));
        let profit = await tokenExchange.calculateExpectedProfit(cycle, amountIn);
        res.json(profit);
    } catch (err) {
        returnError(res, err.message);
    }
});

app.post('/api/performArbitrage', async (req, res) => {
    try {
        let amountIn = req.body.amount;
        let cycle = req.body.cycle;
        let result = await tokenExchange.performArbitrage(amountIn, cycle);
        res.json(result);
    } catch (err) {
        returnError(res, err.message);
    }
});

function exportConfigToClient() {
    return {
        defaultAccountAddr: conf.defaultAccount(),
        tokens: conf.tokens(),
        uniswapRouterAddr: conf.uniswapRouter()._address,
        autoCoinTraderAddr: conf.autoCoinTrader()._address
    };
}

function returnError(res, msg) {
    res.status(500).send(msg);
}