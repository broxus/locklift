import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Address } from "everscale-inpage-provider";
import { FactoryType } from "../factory";
import { Locklift } from "../index";

declare global {
  const locklift: Locklift;
}

export class Migration<T extends FactoryType> {
  private migrationLog: Record<string, string>;
  private readonly logPath: string;

  constructor(logPath = "locklift.migration.json") {
    this.logPath = join(process.cwd(), logPath);
    this.migrationLog = {};
    this._loadMigrationLog();
  }

  public loadAccount = async (name: string, account: string) => {
    const address = this.migrationLog[name];

    if (address) {
      const accountsFactory = locklift.factory.getAccountsFactory("Wallet");
      const signer = await locklift.keystore.getSigner(account);

      if (signer) {
        return accountsFactory.getAccount(new Address(address), signer.publicKey);
      } else {
        throw new Error("Can't derive keys for account");
      }
    } else {
      throw new Error(`Contract ${name} not found in the migration`);
    }
  };

  public loadContract = <ContractName extends keyof T>(contract: ContractName, name: string) => {
    const address = this.migrationLog[name];

    if (address) {
      return locklift.factory.getDeployedContract(contract as keyof FactoryType, new Address(address));
    } else {
      throw new Error(`Contract ${contract.toString()} not found in the migration`);
    }
  };

  public store = <T extends { address: Address }>(contract: T, name: string) => {
    this.migrationLog = {
      ...this.migrationLog,
      [name]: contract.address.toString(),
    };

    this._saveMigrationLog();
  };

  private _loadMigrationLog = () => {
    if (existsSync(this.logPath)) {
      const data = readFileSync(this.logPath, "utf8");

      if (data) {
        this.migrationLog = JSON.parse(data);
      }
    }
  };

  private _saveMigrationLog = () => {
    writeFileSync(this.logPath, JSON.stringify(this.migrationLog));
  };
}
