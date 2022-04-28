const { Command } = require("commander");

const { execSync } = require("child_process");
const program = new Command();

program
  .name("runSandbox")
  .description("Run local ever node")
  .action(async options => {
    execSync(
      "docker run -d -e USER_AGREEMENT=yes --rm --name local-node -p8085:80 tonlabs/local-node:0.29.1",
    );

    process.exit();
  });

module.exports = program;
