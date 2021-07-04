// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol";

contract AutoCoinTrader {

    function trade(address uniswapRouterAddr) internal view returns (uint256[] memory amounts) {
        // IUniswapV2Pair pair =
        //     IUniswapV2Pair(
        //         UniswapV2Library.pairFor(
        //             uniswapFactoryAddr,
        //             "0xf3a6679b266899042276804930b3bfbaf807f15b",
        //             "0xf92b8cd34853d91425f79fce8c438366443ffcd7"
        //         )
        //     );
        IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(uniswapRouterAddr);

        address[] memory path = new address[](2);
        path[0] = address(0xf92b8cD34853D91425F79Fce8c438366443FFcD7);
        path[1] = uniswapRouter.WETH();
        return uniswapRouter.getAmountsIn(10, path);
    }
}
