const RoyToken = artifacts.require('@openzeppelin/contracts/ERC20PresetMinterPauser');
const MichalToken = artifacts.require('@openzeppelin/contracts/ERC20PresetMinterPauser');

module.exports = function (deployer) {
    deployer.deploy(RoyToken, 'Roy Token', 'RTOK');
    deployer.deploy(MichalToken, 'Michal Token', 'MTOK');
};