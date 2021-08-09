var http = require('http')
var fs = require('fs')
const path = require("path")
const Web3 = require('web3')
var arbitrage = require('./find_arbitrage')
let privateKey = "2fa1e4c5e03e9b4a2aff43a55779221ea77038c205fb3472ad11b1696269d139"
var web3 = new Web3(new Web3.providers.WebsocketProvider("wss://kovan.infura.io/ws/v3/80acc13fcbcf4fe6a380a05c3231772e"));
const minABI = [
    // balanceOf
    {
        constant: true,
        inputs: [{name: "_owner", type: "address"}],
        name: "balanceOf",
        outputs: [{name: "balance", type: "uint256"}],
        type: "function",
    },
];
let ourAddr = "0x85fF53E32FcCDA712e4A9AF650E5e3868AF34ae3"

var jsonPath = path.resolve(__dirname, "../../build/contracts/AutoCoinTrader.json")
var parsed = JSON.parse(fs.readFileSync(jsonPath))
var abi = parsed.abi

var jsonPathRouter = path.resolve(__dirname, "../../build/contracts/UniswapV2Router02.json")
var parsed = JSON.parse(fs.readFileSync(jsonPathRouter))
var abiRouter = parsed.abi

var uniswapRouterAddr = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
var autoCoinTraderAddr = "0x5CC29cA7465c2925A74055bf7a2f65a000DFFD43"
var autoCoinTrader = new web3.eth.Contract(abi, autoCoinTraderAddr)
var uniswapRouter = new web3.eth.Contract(abiRouter, uniswapRouterAddr)
// autoCoinTrader.methods.trade(uniswapRouterAddr, 100000000000).call((err, result) => {
//     console.log(result)
// })


arbitrage.getExchangePath().then(async cycles => {
    //  console.log(cycles)

    let cycle = cycles[0]
    let amountIn
    for (let i = 0; i < cycle.length - 2; i++) {
        let coinA = arbitrage.getCoin(cycle[i])
        let coinB = arbitrage.getCoin(cycle[i + 1])
        if (i === 0) {
            const contract = new web3.eth.Contract(minABI, coinA.address);
            const balance = await contract.methods.balanceOf(ourAddr).call();
            amountIn = Math.round(balance / 20000000)
            // amountIn = Math.round(1000)
        }

        let amountOutMin = Math.floor(amountIn * arbitrage.getExchangeRate(cycle[i], cycle[i + 1]) * 0.9)
        // autoCoinTrader.methods.trade(uniswapRouterAddr, coinA.address, coinB.address, amountIn, amountOutMin).send({from: ourAddr}, function (error, transactionHash) {
        //     console.error(error)
        // })
        var trade = autoCoinTrader.methods.trade(uniswapRouterAddr, coinA.address, coinB.address, amountIn, amountOutMin);
        var encodedABI = trade.encodeABI();

        var tx = {
            from: ourAddr,
            to: autoCoinTrader.address,
            gas: 10000000,
            data: encodedABI
        };

        web3.eth.accounts.signTransaction(tx, privateKey).then(signed => {
            var tran = web3.eth.sendSignedTransaction(signed.rawTransaction);

            tran.on('confirmation', (confirmationNumber, receipt) => {
                console.log('confirmation: ' + confirmationNumber);
            });

            tran.on('transactionHash', hash => {
                console.log('hash');
                console.log(hash);
            });

            tran.on('receipt', receipt => {
                console.log('reciept');
                console.log(receipt);
            });

            tran.on('error', console.error);
        });
        break;
    }
})

// uniswapRouter.methods.WETH().call((err, result) => {
//     console.log(result)
// })

// http.createServer(function (req, res) {
//     res.writeHead(200, {'Content-Type': 'text/plain'})
//     res.end('Hello World!')
// }).listen(8080)