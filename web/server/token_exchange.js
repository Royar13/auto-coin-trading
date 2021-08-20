const conf = require('./configuration');
const arbitrage = require('./find_arbitrage');

module.exports = {
    calculateExpectedProfit: simulateCycleExchange
};
performArbitrage();

async function performArbitrage() {
    arbitrage.getExchangePath(conf.tokens()).then(async cycles => {
        let cycle = cycles[0];
        let amountIn;
        const gas = 2000000;

        let initialToken = conf.tokens()[cycle[0]];
        const web3 = conf.web3();
        const tokenContract = new web3.eth.Contract(conf.ERC20Abi(), initialToken.address);
        const initialTokenBalance = await tokenContract.methods.balanceOf(conf.defaultAccount()).call();
        amountIn = Math.round(initialTokenBalance / 20000000);

        let expectedProfit = await simulateCycleExchange(cycle, amountIn);
        console.log('Expected profit: ' + expectedProfit);

        // transfer autoCoinTrader the initial amountIn of the token
        let transferMethod = tokenContract.methods.transfer(conf.autoCoinTrader()._address, amountIn);
        let transferEncodedAbi = transferMethod.encodeABI();
        let transferTx = {
            from: conf.defaultAccount(),
            to: initialToken.address,
            gas: gas,
            data: transferEncodedAbi
        };

        let signedTokenTransferTrans = await conf.web3().eth.accounts.signTransaction(transferTx, conf.privateKey());

        let tokenTransferReceipt = await conf.web3().eth.sendSignedTransaction(signedTokenTransferTrans.rawTransaction);

        console.log('Token transfer reciept:');
        console.log(tokenTransferReceipt);

        for (let i = 0; i < cycle.length - 1; i++) {
            console.log('Amount in: ' + amountIn);
            let tokenA = conf.tokens()[cycle[i]];
            let tokenB = conf.tokens()[cycle[i + 1]];
            const web3 = conf.web3();
            const contractTokenB = new web3.eth.Contract(conf.ERC20Abi(), tokenB.address);
            let balanceTokenB = parseInt(await contractTokenB.methods.balanceOf(conf.autoCoinTrader()._address).call());

            let amountOutMin = Math.floor(amountIn * arbitrage.getExchangeRate(cycle[i], cycle[i + 1]) * 0.9);
            let tradeMethod = conf.autoCoinTrader().methods.trade(conf.uniswapRouter()._address, tokenA.address, tokenB.address, amountIn, amountOutMin);
            let tradeEncodedAbi = tradeMethod.encodeABI();
            let tradeTx = {
                from: conf.defaultAccount(),
                to: conf.autoCoinTrader()._address,
                gas: gas,
                data: tradeEncodedAbi
            };

            let signedTradeTrans = await conf.web3().eth.accounts.signTransaction(tradeTx, conf.privateKey());
            let tradeReceipt = await conf.web3().eth.sendSignedTransaction(signedTradeTrans.rawTransaction);

            console.log('Trade reciept:');
            console.log(tradeReceipt);
            // the difference in balance is the amountOut received from the swap
            let newBalanceTokenB = parseInt(await contractTokenB.methods.balanceOf(conf.autoCoinTrader()._address).call());
            amountIn = newBalanceTokenB - balanceTokenB;
        }
        //collect the last token of the trade chain into our account
        let lastToken = conf.tokens()[cycle[cycle.length - 1]];
        let collectTokenMethod = conf.autoCoinTrader().methods.collectToken(lastToken.address);
        let collectTokenEncodedAbi = collectTokenMethod.encodeABI();
        let collectTokenTx = {
            from: conf.defaultAccount(),
            to: conf.autoCoinTrader()._address,
            gas: gas,
            data: collectTokenEncodedAbi
        };

        let signedCollectTokenTrans = await conf.web3().eth.accounts.signTransaction(collectTokenTx, conf.privateKey());
        let collectTokenReceipt = await conf.web3().eth.sendSignedTransaction(signedCollectTokenTrans.rawTransaction);
        console.log('Collect token reciept:');
        console.log(collectTokenReceipt);

        const finishedTokenBalance = await tokenContract.methods.balanceOf(conf.defaultAccount()).call();
        const profit = finishedTokenBalance - initialTokenBalance;
        console.log('Our profit: ' + profit + ' ' + initialToken.unit);
    });
}

/**
 * Calculate how much profit would be earned by executing an arbitrage exchange cycle
 * (not including gas price)
 */
async function simulateCycleExchange(cycle, initialAmount) {
    let amountIn = initialAmount;
    for (let i = 0; i < cycle.length - 1; i++) {
        let tokenA = conf.tokens()[cycle[i]];
        let tokenB = conf.tokens()[cycle[i + 1]];
        let path = [tokenA.address, tokenB.address];
        let amounts = await conf.uniswapRouter().methods.getAmountsOut(amountIn, path).call();
        amountIn = parseInt(amounts[1]);
    }
    let profit = amountIn - initialAmount;
    return profit;
}
