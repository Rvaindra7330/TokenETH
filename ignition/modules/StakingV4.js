const { buildModule} = require("@nomicfoundation/hardhat-ignition/modules")

module.exports = buildModule("StakingModuleV4",(m)=>{
    const staking =m.contract("Staking",["0xd944Ea2D846b8d1219f7be9cF64b78220edc8a2c"]);
    return {staking}
})