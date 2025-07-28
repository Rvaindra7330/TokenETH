require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("hardhat-gas-reporter");
require("dotenv").config();
const { INFURA_API_KEY, PRIVATE_KEY,INFURA_MAINNET_URL } = process.env;
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat:{
      forking:{
        url:`${INFURA_MAINNET_URL}`,
        blockNumber: 14390000
      }
    },
    sepolia: {
      url: `${INFURA_API_KEY}` ,
      accounts: [PRIVATE_KEY]
    },
    
  },
};
