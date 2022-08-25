import chalk from "chalk";
enum Labels {
  INFO = "[INFO] ",
  WARNING = "[WARNING] ",
  ERROR = "[ERROR] ",
  BUILDER_LOG = "[BUILDER LOG] ",

  DEPRECATED = "[DEPRECATED] ",
}
type ConsoleLogParams = Parameters<typeof console.log>;
class Logger {
  public printWarn(...params: ConsoleLogParams): void {
    console.log(chalk.yellow(Labels.WARNING), chalk.yellow(...params));
  }

  public printError(...params: ConsoleLogParams): void {
    console.log(chalk.red(Labels.ERROR), chalk.red(...params));
  }

  public printInfo(...params: ConsoleLogParams): void {
    console.log(chalk.blue(Labels.INFO), chalk.blue(...params));
  }

  public printBuilderLog(...params: ConsoleLogParams): void {
    console.log(Labels.BUILDER_LOG, ...params);
  }

  public printTracingLog(...params: ConsoleLogParams): void {
    console.log(...params);
  }

  public deprecated({ instruction, methodName }: { methodName: string; instruction: string }): void {
    console.log(chalk.yellow(Labels.DEPRECATED), chalk.yellow(`${methodName} is deprecated. ${instruction}`));
  }
}

export const logger = new Logger();
