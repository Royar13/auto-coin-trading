const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
const arbitrage = require('./find_arbitrage');
const privateKey = "2fa1e4c5e03e9b4a2aff43a55779221ea77038c205fb3472ad11b1696269d139";
const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://kovan.infura.io/ws/v3/80acc13fcbcf4fe6a380a05c3231772e"));

const ERC20JsonPath = path.resolve(process.cwd(), "node_modules/@openzeppelin/contracts/build/contracts/ERC20.json");
const ERC20Json = JSON.parse(fs.readFileSync(ERC20JsonPath));
const ERC20Abi = ERC20Json.abi;
const ourAddr = "0x85fF53E32FcCDA712e4A9AF650E5e3868AF34ae3";

const autoCoinTraderJsonPath = path.resolve(process.cwd(), "build/contracts/AutoCoinTrader.json");
const autoCoinTraderJson = JSON.parse(fs.readFileSync(autoCoinTraderJsonPath));
const autoCoinTraderAbi = autoCoinTraderJson.abi;

const uniswapRouterAddr = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const autoCoinTraderAddr = "0x07A6601051d78734c4ef11a7EeB84247F6aa1B4F";
const autoCoinTrader = new web3.eth.Contract(autoCoinTraderAbi, autoCoinTraderAddr);


arbitrage.getExchangePath().then(async cycles => {
    let cycle = cycles[0];
    let amountIn;
    const gas = 2000000;

    let initialToken = arbitrage.getCoin(cycle[0]);
    const tokenContract = new web3.eth.Contract(ERC20Abi, initialToken.address);
    const initialTokenBalance = await tokenContract.methods.balanceOf(ourAddr).call();
    amountIn = Math.round(initialTokenBalance / 20000000);
    // transfer autoCoinTrader the initial amountIn of the token
    let transferMethod = tokenContract.methods.transfer(autoCoinTraderAddr, amountIn);
    let transferEncodedAbi = transferMethod.encodeABI();
    let transferTx = {
        from: ourAddr,
        to: initialToken.address,
        gas: gas,
        data: transferEncodedAbi
    };

    let signedTokenTransferTrans = await web3.eth.accounts.signTransaction(transferTx, privateKey);

    let tokenTransferReceipt = await web3.eth.sendSignedTransaction(signedTokenTransferTrans.rawTransaction);

    console.log('Token transfer reciept:');
    console.log(tokenTransferReceipt);

    for (let i = 0; i < cycle.length - 1; i++) {
        console.log('Amount in: ' + amountIn);
        let tokenA = arbitrage.getCoin(cycle[i]);
        let tokenB = arbitrage.getCoin(cycle[i + 1]);
        const contractTokenB = new web3.eth.Contract(ERC20Abi, tokenB.address);
        let balanceTokenB = parseInt(await contractTokenB.methods.balanceOf(autoCoinTraderAddr).call());

        let amountOutMin = Math.floor(amountIn * arbitrage.getExchangeRate(cycle[i], cycle[i + 1]) * 0.9);
        let tradeMethod = autoCoinTrader.methods.trade(uniswapRouterAddr, tokenA.address, tokenB.address, amountIn, amountOutMin);
        let tradeEncodedAbi = tradeMethod.encodeABI();
        let tradeTx = {
            from: ourAddr,
            to: autoCoinTraderAddr,
            gas: gas,
            data: tradeEncodedAbi
        };

        let signedTradeTrans = await web3.eth.accounts.signTransaction(tradeTx, privateKey);
        let tradeReceipt = await web3.eth.sendSignedTransaction(signedTradeTrans.rawTransaction);

        console.log('Trade reciept:');
        console.log(tradeReceipt);
        // the difference in balance is the amountOut received from the swap
        let newBalanceTokenB = parseInt(await contractTokenB.methods.balanceOf(autoCoinTraderAddr).call());
        amountIn = newBalanceTokenB - balanceTokenB;
    }
    //collect the last token of the trade chain into our account
    let lastToken = arbitrage.getCoin(cycle[cycle.length - 1])
    let collectTokenMethod = autoCoinTrader.methods.collectToken(lastToken.address);
    let collectTokenEncodedAbi = collectTokenMethod.encodeABI();
    let collectTokenTx = {
        from: ourAddr,
        to: autoCoinTraderAddr,
        gas: gas,
        data: collectTokenEncodedAbi
    };

    let signedCollectTokenTrans = await web3.eth.accounts.signTransaction(collectTokenTx, privateKey);
    let collectTokenReceipt = await web3.eth.sendSignedTransaction(signedCollectTokenTrans.rawTransaction);
    console.log('Collect token reciept:');
    console.log(collectTokenReceipt);

    const finishedTokenBalance = await tokenContract.methods.balanceOf(ourAddr).call();
    const profit = finishedTokenBalance - initialTokenBalance
    console.log('Our profit: ' + profit + ' ' + initialToken.unit)
})
