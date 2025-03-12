
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("MyToken", (m) => {
const token  = m.contract("Token",[]);
  return { token };
});
