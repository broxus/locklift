import { LockliftConfig } from "locklift/config";
import { FactorySource } from "./build/factorySource";
import { Giver, GiverWallet } from "./giverSettings";
import { NETWORK_PRESETS } from "everscale-standalone-client";
declare global {
  const locklift: import("locklift").Locklift<FactorySource>;
}
const LOCAL_NETWORK_ENDPOINT = "http://localhost:5000/graphql";
const config: LockliftConfig = {
  compiler: {
    // Specify path to your TON-Solidity-Compiler
    // path: "/mnt/o/projects/broxus/TON-Solidity-Compiler/build/solc/solc",

    // Or specify version of compiler
    version: "0.61.2",

    // Specify config for extarnal contracts as in exapmple
    // externalContracts: {
    //   "node_modules/broxus-ton-tokens-contracts/build": ['TokenRoot', 'TokenWallet']
    // }
  },
  linker: {
    // Specify path to your stdlib
    // lib: "/mnt/o/projects/broxus/TON-Solidity-Compiler/lib/stdlib_sol.tvm",
    // // Specify path to your Linker
    // path: "/mnt/o/projects/broxus/TVM-linker/target/release/tvm_linker",

    // Or specify version of linker
    version: "0.15.43",
  },
  networks: {
    local: {
      // Specify connection settings for https://github.com/broxus/everscale-standalone-client/
      connection: {
        group: "localnet",
        // @ts-ignore
        type: "graphql",
        data: {
          // @ts-ignore
          endpoints: [LOCAL_NETWORK_ENDPOINT],
          latencyDetectionInterval: 1000,
          local: true,
        },
      },
      // This giver is default local-node giverV2
      giver: {
        // Check if you need provide custom giver
        giverFactory: (ever, keyPair, address) => new Giver(ever, keyPair, address),
        address: "0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415",
        key: "172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3",
      },
      tracing: {
        endPoint: LOCAL_NETWORK_ENDPOINT,
      },
      keys: {
        // Use everdev to generate your phrase
        // !!! Never commit it in your repos !!!
        // phrase: "action inject penalty envelope rabbit element slim tornado dinner pizza off blood",
        amount: 20,
      },
    },
    mainnet: {
      // Specify connection settings for https://github.com/broxus/everscale-standalone-client/
      connection: NETWORK_PRESETS.mainnet,
      // This giver is default Wallet
      giver: {
        // Check if you need provide custom giver
        giverFactory: (ever, keyPair, address) => new GiverWallet(ever, keyPair, address),
        address: "0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415",
        key: "172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3",
      },
      keys: {
        // Use everdev to generate your phrase
        // !!! Never commit it in your repos !!!
        // phrase: "action inject penalty envelope rabbit element slim tornado dinner pizza off blood",
        amount: 20,
      },
    },
  },
  mocha: {
    timeout: 2000000,
  },
};

export default config;
