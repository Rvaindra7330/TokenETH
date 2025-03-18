const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("TokenSaleModule", (m) => {
  const tokenSale = m.contract("TokenSale", ["0xd944Ea2D846b8d1219f7be9cF64b78220edc8a2c"]);
  return { tokenSale };
});