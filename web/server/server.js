const express = require('express');
const app = express();
const cors = require('cors');
const conf = require('./configuration');


const port = 8080;

app.use(express.json());
app.use(cors());

app.listen(port);

app.get('/api/getConfig', (req, res) => {
    let exportedConfig = exportConfigToClient();
    res.json(exportedConfig);
});

function exportConfigToClient() {
    return {
        defaultAccountAddr: conf.defaultAccount(),
        tokens: conf.tokens(),
        uniswapRouterAddr: conf.uniswapRouter()._address,
        autoCoinTraderAddr: conf.autoCoinTrader()._address
    };
}