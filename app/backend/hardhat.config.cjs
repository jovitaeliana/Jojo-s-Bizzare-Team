require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Hedera Testnet configuration
    hedera_testnet: {
      url: process.env.JSON_RPC_URL || "https://testnet.hashio.io/api",
      accounts: process.env.PLATFORM_PRIVATE_KEY
        ? [process.env.PLATFORM_PRIVATE_KEY]
        : [],
      chainId: 296, // Hedera testnet chain ID
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // Hedera Mainnet configuration (for future use)
    hedera_mainnet: {
      url: "https://mainnet.hashio.io/api",
      accounts: process.env.PLATFORM_PRIVATE_KEY
        ? [process.env.PLATFORM_PRIVATE_KEY]
        : [],
      chainId: 295, // Hedera mainnet chain ID
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // Local development network (optional)
    hardhat: {
      chainId: 1337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

