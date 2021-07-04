var http = require('http')
const rpcURL = "https://mainnet.infura.io/YOUR_INFURA_API_KEY"

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'})
    res.end('Hello World!')
}).listen(8080)