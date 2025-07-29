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
        blockNumber: 19400000,
        enabled: true,
      },
      chainId: 1,
      accounts: {
        accountsBalance: "10000000000000000000000" // 10,000 ETH test balance
      }
    },
    sepolia: {
      url: `${INFURA_API_KEY}` ,
      accounts: [PRIVATE_KEY]
    },
    
  },
};
