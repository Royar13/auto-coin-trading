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

    function trade(address uniswapRouterAddr, address[] memory tokensCycle, uint amountIn) public payable returns (uint[] memory amounts){
        address[] memory path = new address[](2);
        uint[] memory amountsOut;
        IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(uniswapRouterAddr);
        for (uint i = 0; i < tokensCycle.length - 1; i++) {
            path[0] = tokensCycle[i];
            path[1] = tokensCycle[i + 1];
            (bool success, ) = tokensCycle[i].call(abi.encodeWithSignature("approve(address,uint256)", uniswapRouterAddr, amountIn));
            require(success);
            amountsOut = uniswapRouter.getAmountsOut(amountIn, path);
            uint amountsOutMin = amountsOut[1] * 9 / 10;
            amounts = uniswapRouter.swapExactTokensForTokens(amountIn, amountsOutMin, path, address(this), block.timestamp);
            amountIn = amounts[1];
        }
        return amounts;
    }
}
