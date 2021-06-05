// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol";

contract AutoCoinTrader {
    address internal constant UNISWAP_ROUTER_ADDRESS =
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    IUniswapV2Router02 public uniswapRouter =
        IUniswapV2Router02(UNISWAP_ROUTER_ADDRESS);

    function trade() internal view returns (uint256[] memory amounts) {
        // IUniswapV2Pair pair =
        //     IUniswapV2Pair(
        //         UniswapV2Library.pairFor(
        //             factory,
        //             "0xf3a6679b266899042276804930b3bfbaf807f15b",
        //             "0xf92b8cd34853d91425f79fce8c438366443ffcd7"
        //         )
        //     );
        address[] memory path = new address[](2);
        path[0] = address(0xf92b8cD34853D91425F79Fce8c438366443FFcD7);
        path[1] = uniswapRouter.WETH();
        return uniswapRouter.getAmountsIn(10, path);
    }
}
