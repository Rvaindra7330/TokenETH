
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Token", (m) => {
const token  = m.contract("Token",[]);
  return { token };
});
