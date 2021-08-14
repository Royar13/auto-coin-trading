// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol";

contract AutoCoinTrader {
    address owner;

    constructor() public {
        owner = msg.sender;
    }

    function collectToken(address tokenAddr) public {
        (bool success, bytes memory returnData) = tokenAddr.call(abi.encodeWithSignature("balanceOf(address)", address(this)));
        require(success);
        uint256 balance = abi.decode(returnData, (uint256));
        tokenAddr.call(abi.encodeWithSignature("transfer(address,uint256)", owner, balance));
    }

    function trade(address uniswapRouterAddr, address coinIn, address coinOut, uint amountIn, uint amountOutMin) public payable returns (uint[] memory amounts){
        (bool success, bytes memory returnData) = coinIn.call(abi.encodeWithSignature("approve(address,uint256)", uniswapRouterAddr, amountIn));
        require(success);

        address[] memory path = new address[](2);
        path[0] = coinIn;
        path[1] = coinOut;
        IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(uniswapRouterAddr);
        return uniswapRouter.swapExactTokensForTokens(amountIn, amountOutMin, path, address(this), block.timestamp);
    }
}
