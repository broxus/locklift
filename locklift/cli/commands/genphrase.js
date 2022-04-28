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
    "-o, --output-file <filename>",
    "Optional Save the mnemonic seed phrase to a file, if the flag is active,the current path is used by default, or the path passed to the command",
    false,
  )
  .option(
    "-r, --replace",
    "Optional Replace the current master phrase with a new one",
    false,
  )
  .option("-h, --hidden", "Optional Do not print mnemonics in console", false)

  .action(async options => {
    const client = new TonClient();
    const phrase = await client.crypto.mnemonic_from_random({
      dictionary: 1,
      word_count: Number(options.words),
    });

    if (options.outputFile) {
      if (options.outputFile.slice(0, 4) === "keys") {
        options.outputFile = `${Date.now()}_` + options.outputFile;
      }
      fs.writeJSONSync(
        `${options.outputFile}.json`,
        JSON.stringify({ mnemonic: phrase.phrase }),
        err => {
          if (err) {
            throw err;
          }
        },
      );
      console.log(
        `A new mnemonic phrase has been saved in ${process.cwd()}/${
          options.outputFile
        }.json`,
      );
    }
    if (options.replace) {
      let keys = require(`${process.cwd()}/keys.json`);
      keys.mnemonic = phrase.phrase;
      fs.writeJSONSync(
        `${process.cwd()}/keys.json`,
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
