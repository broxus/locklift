const { Command, Option } = require("commander");

const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
TonClient.useBinaryLibrary(libNode);
const fs = require("fs-extra");

const utils = require("../utils");
const env = utils.env;
const program = new Command();

program
  .name("genphrase")
  .description("Generate new mnenonic seed phrase")
  .addOption(
    new Option("-w, --words <count>", "Optional Mnemonic word count")
      .choices(["12", "24"])
      .default(12),
  )
  .option(
    "-s, --save [path]",
    "Optional Save the mnemonic seed phrase to a file, if the flag is active,the current path is used by default, or the path passed to the command",
    false,
  )
  .option(
    "-r, --replace <bool>",
    "Optional Replace the current master phrase with a new one",
    false,
  )
  .option(
    "-n, --name <name>",
    "Optional file name if flag --save passed",
    `${Date.now()}_keys`,
  )
  .option(
    "-h, --hidden [true]",
    "Optional Do not print mnemonics in console",
    false,
  )

  .action(async options => {
    const client = new TonClient();
    const phrase = await client.crypto.mnemonic_from_random({
      dictionary: 1,
      word_count: Number(options.words),
    });
    console.log(options);
    if (options.save) {
      let path;
      if (options.save === true) {
        path = process.cwd();
      } else {
        path = options.save;
      }
      console.log(path);
      fs.writeJSONSync(
        `${path}/${options.name}.json`,
        JSON.stringify({ mnemonic: phrase.phrase }),
        err => {
          if (err) {
            throw err;
          }
        },
      );
      console.log(
        `A new mnemonic phrase has been saved in ${env.rootDir}/${options.name}.json`,
      );
    }
    if (options.replace) {
      let keys = require(`${env.rootDir}/keys.json`);
      keys.mnemonic = phrase.phrase;
      fs.writeJSONSync(
        `${env.rootDir}/keys.json`,
        JSON.stringify(keys),
        err => {
          if (err) {
            throw err;
          }
        },
      );
    }
    if (options.hidden) console.log("Done!");
    else console.log(phrase.phrase);

    process.exit();
  });

module.exports = program;
