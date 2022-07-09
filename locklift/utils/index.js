const fs = require("fs");
const BigNumber = require("bignumber.js");
const ton = require("../ever");
const { execSync } = require("child_process");
const path = require("path");
const { fail } = require("assert");
module.exports = class Utils {
  /**
   * Initialize TON wrapper. All the configuration for TonClient should be placed in config.networks[network].ever_client
   * @param locklift
   */
  static EMPTY_TVM_CELL = "te6ccgEBAQEAAgAAAA==";
  zeroAddress =
    "0:0000000000000000000000000000000000000000000000000000000000000000";

  constructor(locklift) {
    this.locklift = locklift;
  }

  async setup() {}

  static loadJSONFromFile = filePath => {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  };

  static loadBase64FromFile = filePath => {
    return fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .join("");
  };
  static isNumeric = value => /^-?\d+$/.test(value);
  static getRandomNonce = () => (Math.random() * 64000) | 0;
  static isValidTonAddress = address =>
    /^(?:-1|0):[0-9a-fA-F]{64}$/.test(address);

  convertCrystal(amount, dimension) {
    const crystalBN = new BigNumber(amount);

    if (dimension === "nano") {
      return crystalBN.times(10 ** 9).toFixed(0);
    } else if (dimension === "ton") {
      return crystalBN.div(new BigNumber(10).pow(9));
    }
  }
  async logContract(contract) {
    const balance = await this.locklift.ever.getBalance(contract.address);

    logger.log(
      `${contract.name} (${contract.address}) - ${this.convertCrystal(
        balance,
        "ton",
      )}`,
    );
  }
  /**
   * Creates deploy message for Contract instance, by using deploy_set section.
   * @param contract Contract instance
   * @param [constructorParams={}] Constructor data
   * @param [initParams={}] Initial data
   * @param keyPair Key pair to use
   * @returns {Promise<ResultOfEncodeMessage>}
   */
  async createDeployMessage({
    contract,
    constructorParams,
    initParams,
    keyPair,
  }) {
    const encodeParams = {
      abi: {
        type: "Contract",
        value: contract.abi,
      },
      deploy_set: {
        tvc: contract.base64,
        initial_data: initParams,
      },
      call_set: {
        function_name: "constructor",
        input: constructorParams === undefined ? {} : constructorParams,
      },
      signer: {
        type: "None",
      },
    };

    return this.locklift.ever.client.abi.encode_message(
      this.enrichMessageWithKeys(encodeParams, keyPair),
    );
  }

  /**
   * Gets balance for specific address. Raise an error if address not found
   * @param address Contract address
   * @returns {Promise<BigNumber>}
   */
  async getBalance(contract, convertCrystal = false) {
    if (convertCrystal) {
      return this.convertCrystal(
        await this.locklift.ever.getBalance(contract),
        "ton",
      ).toNumber();
    } else {
      const balance = await this.locklift.ever.getBalance(contract);
      return balance.toNumber();
    }
  }

  /**
   * Transfer tokens
   * @param to Token recipient
   * @param amount Transfer amount
   * @param keyPair Key pair
   * @returns {Promise<tx>}
   */
  async transfer({ to, amount, keyPair, constructorParams = {} }) {
    let account = await this.locklift.factory.getAccount("Wallet");

    account.keyPair = keyPair;
    const initParams = {
      dest: to,
      value: amount,
      bounce: true,
    };
    const { address } = await this.locklift.ever.createDeployMessage({
      contract: account,
      constructorParams: constructorParams,
      initParams: initParams,
      keyPair: keyPair,
    });
    account.address = address;

    try {
      const tx = await account.run({
        method: "sendTransaction",
        params: {
          dest: to,
          value: amount,
          bounce: true,
        },
        keyPair: keyPair,
      });
      this.log(tx);
      return tx;
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Deploy new wallet
   * @param keyNumber KeyPair ID
   * @param balance init balance
   * @param buildPath path where builded Wallet.sol
   * @param giver bool : use Giver to replenish the balance
   * @returns {Promise<{acc_type: *, acc_type_name: *}>}
   */

  async deployAccount({ keyNumber, balance, buildPath = "build" }) {
    if (
      !fs.existsSync(`${process.cwd()}/${buildPath}/Wallet.abi.json`) ||
      !fs.existsSync(`${process.cwd()}/${buildPath}/Wallet.base64`) ||
      !fs.existsSync(`${process.cwd()}/${buildPath}/Wallet.code`) ||
      !fs.existsSync(`${process.cwd()}/${buildPath}/Wallet.tvc`)
    ) {
      const nodeModules = require
        .resolve("locklift/package.json")
        .replace("locklift/package.json", "");
      const includePath = `--include-path ${nodeModules}`;

      const output = execSync(`cd ${buildPath} && \
        ${this.locklift.config.compiler.path} ${includePath} ./../../locklift/contract/contracts/Wallet.sol`);
      this.log(`Compiled Wallet`);

      // No code was compiled, probably interface compilation
      if (output.toString() === "") return;

      const lib = this.locklift.config.linker.lib
        ? ` --lib ${this.locklift.config.linker.lib} `
        : "";
      const tvmLinkerLog = execSync(
        `cd ${buildPath} && ${
          this.locklift.config.linker.path
        } compile ${lib} "${process.cwd()}/${buildPath}/Wallet.code" -a "${process.cwd()}/${buildPath}/Wallet.abi.json"`,
      );

      const [, tvcFile] = tvmLinkerLog
        .toString()
        .match(new RegExp("Saved contract to file (.*)"));
      execSync(`cd ${buildPath} && base64 < ${tvcFile} > Wallet.base64`);

      execSync(`cd ${buildPath} && mv ${tvcFile} Wallet.tvc`);

      this.log(`Linked Wallet.tvc`);
    }
    let wallet = await this.locklift.factory.getAccount("Wallet");
    const keyPairs = await this.locklift.keys.getKeyPairs();

    keyNumber = +(keyNumber || "0");

    balance = +(balance || "10");
    const constructorParams = {};
    const initParams = {
      _randomNonce: (Math.random() * 6400) | 0,
    };
    wallet = await this.locklift.giver.deployContract(
      {
        contract: wallet,
        constructorParams: constructorParams,
        initParams: initParams,
        keyPair: keyPairs[keyNumber],
      },
      this.convertCrystal(balance, "nano"),
    );
    return wallet;
  }
  async showCode(contractName) {
    const Contract = await this.locklift.factory.getContract(contractName);

    console.log(`${contractName} code:`);
    console.log(`${Contract.code}`);
    return Contract.code;
  }
  async validateAddress(address) {
    return await this.locklift.ever.client.utils
      .convert_address({
        address,
        output_format: {
          type: "Hex",
        },
      })
      .then(() => {
        return true;
      })
      .catch(err => {
        console.log(err);
        return false;
      });
  }
  log(text) {
    console.log(text);
  }
};
