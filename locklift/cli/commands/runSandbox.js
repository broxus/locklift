const { Command } = require("commander");

const { execSync } = require("child_process");
const program = new Command();

const { loadConfig } = require("../../config");

program
  .name("runSandbox")
  .description("Run local ever node")
  .action(async options => {
    let config = await options.config;

    if (config === undefined) {
      config = await loadConfig(`${process.cwd()}/locklift.config.js`);
    }
    const port = config.networks.local.ever_client.network.port;

    execSync(
      `docker run -d -e USER_AGREEMENT=yes --rm --name local-node -p${port}:${port} tonlabs/local-node:0.29.1`,
    );

    console.log("Sandbox launched successfully!");

    process.exit();
  });

module.exports = program;
