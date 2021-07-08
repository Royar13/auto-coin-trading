var http = require('http')
var fs = require('fs')
const path = require("path")
const Web3 = require('web3')
const rpcURL = "https://kovan.infura.io/v3/80acc13fcbcf4fe6a380a05c3231772e"


var web3 = new Web3(new Web3.providers.WebsocketProvider("wss://kovan.infura.io/ws/v3/80acc13fcbcf4fe6a380a05c3231772e"));

var jsonPath = path.resolve(__dirname, "../../build/contracts/AutoCoinTrader.json")
var parsed = JSON.parse(fs.readFileSync(jsonPath))
var abi = parsed.abi

var jsonPathRouter = path.resolve(__dirname, "../../build/contracts/UniswapV2Router02.json")
var parsed = JSON.parse(fs.readFileSync(jsonPathRouter))
var abiRouter = parsed.abi

var uniswapRouterAddr = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
var autoCoinTraderAddr = "0x8A3119421746d00D50C352e9C8AAd96cf2c7b3Ed"
var autoCoinTrader = new web3.eth.Contract(abi, autoCoinTraderAddr)
var uniswapRouter = new web3.eth.Contract(abiRouter, uniswapRouterAddr)
autoCoinTrader.methods.trade(uniswapRouterAddr).call((err, result) => {
    console.log(result)
})
// uniswapRouter.methods.WETH().call((err, result) => {
//     console.log(result)
// })

// http.createServer(function (req, res) {
//     res.writeHead(200, {'Content-Type': 'text/plain'})
//     res.end('Hello World!')
// }).listen(8080)