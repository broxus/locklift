import chalk from "chalk";
type ConsoleLogParams = Parameters<typeof console.log>;
class Logger {
  public printWarn(...params: ConsoleLogParams): void {
    console.log(chalk.yellow(...params));
  }
  public printError(...params: ConsoleLogParams): void {
    console.log(chalk.red(...params));
  }
  public printInfo(...params: ConsoleLogParams): void {
    console.log(chalk.blue(...params));
  }
  public printBuilderLog(...params: ConsoleLogParams): void {
    console.log(...params);
  }
  public printTracingLog(...params: ConsoleLogParams): void {
    console.log(...params);
  }
}

export const logger = new Logger();
