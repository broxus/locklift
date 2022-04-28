const { Command } = require("commander");

const { execSync } = require("child_process");
const program = new Command();

program
  .name("killSandbox")
  .description("Kill local ever node")
  .action(async options => {
    execSync("docker kill local-node");

    process.exit();
  });

module.exports = program;
