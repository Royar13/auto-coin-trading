const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
const arbitrage = require('./find_arbitrage');
const privateKey = "2fa1e4c5e03e9b4a2aff43a55779221ea77038c205fb3472ad11b1696269d139";
const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://kovan.infura.io/ws/v3/80acc13fcbcf4fe6a380a05c3231772e"));

const ERC20JsonPath = path.resolve(process.cwd(), "node_modules/@openzeppelin/contracts/build/contracts/ERC20.json");
const ERC20Json = JSON.parse(fs.readFileSync(ERC20JsonPath));
const ERC20Abi = ERC20Json.abi
const ourAddr = "0x85fF53E32FcCDA712e4A9AF650E5e3868AF34ae3";

const autoCoinTraderJsonPath = path.resolve(process.cwd(), "build/contracts/AutoCoinTrader.json");
const autoCoinTraderJson = JSON.parse(fs.readFileSync(autoCoinTraderJsonPath));
const autoCoinTraderAbi = autoCoinTraderJson.abi;

const uniswapRouterJsonPath = path.resolve(process.cwd(), "build/contracts/UniswapV2Router02.json");
const uniswapRouterJson = JSON.parse(fs.readFileSync(uniswapRouterJsonPath));
const uniswapRouterAbi = uniswapRouterJson.abi;

const uniswapRouterAddr = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const autoCoinTraderAddr = "0x388eB78e0ccC22A705F8d05917a5767b1f9901A9";
const autoCoinTrader = new web3.eth.Contract(autoCoinTraderAbi, autoCoinTraderAddr);
const uniswapRouter = new web3.eth.Contract(uniswapRouterAbi, uniswapRouterAddr);
// autoCoinTrader.methods.trade(uniswapRouterAddr, 100000000000).call((err, result) => {
//     console.log(result)
// })


arbitrage.getExchangePath().then(async cycles => {
    let cycle = cycles[0];
    let amountIn;
    const gas = 2000000;

    let initialCoin = arbitrage.getCoin(cycle[0]);
    const tokenContract = new web3.eth.Contract(ERC20Abi, initialCoin.address);
    const balance = await tokenContract.methods.balanceOf(ourAddr).call();
    amountIn = Math.round(balance / 20000000);
    // transfer autoCoinTrader the initial amountIn of the token
    let transferMethod = tokenContract.methods.transfer(autoCoinTraderAddr, amountIn);
    let transferEncodedAbi = transferMethod.encodeABI();
    let transferTx = {
        from: ourAddr,
        to: initialCoin.address,
        gas: gas,
        data: transferEncodedAbi
    };

    web3.eth.accounts.signTransaction(transferTx, privateKey).then(signed => {
        let tran = web3.eth.sendSignedTransaction(signed.rawTransaction);

        tran.on('receipt', receipt => {
            console.log('reciept:');
            console.log(receipt);

            for (let i = 0; i < cycle.length - 2; i++) {
                let coinA = arbitrage.getCoin(cycle[i]);
                let coinB = arbitrage.getCoin(cycle[i + 1]);

                let amountOutMin = Math.floor(amountIn * arbitrage.getExchangeRate(cycle[i], cycle[i + 1]) * 0.9);
                let tradeMethod = autoCoinTrader.methods.trade(uniswapRouterAddr, coinA.address, coinB.address, amountIn, amountOutMin);
                let tradeEncodedAbi = tradeMethod.encodeABI();
                let tradeTx = {
                    from: ourAddr,
                    to: autoCoinTraderAddr,
                    gas: gas,
                    data: tradeEncodedAbi
                };

                web3.eth.accounts.signTransaction(tradeTx, privateKey).then(signed => {
                    let tran = web3.eth.sendSignedTransaction(signed.rawTransaction);

                    tran.on('receipt', receipt => {
                        console.log('reciept:');
                        console.log(receipt);
                    });

                    tran.on('error', console.error);
                });
                break;
            }
        });

        tran.on('error', console.error);
    });
})
