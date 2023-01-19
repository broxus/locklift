import { Locklift, LockliftConfig } from "../../index";
import { ConfigState, loadConfig } from "../../internal/config";
import { Extender } from "../types";
import { from, lastValueFrom, mergeMap, tap } from "rxjs";
import commander, { Command, Option } from "commander";
import { buildStep } from "../../internal/cli/steps/build";
import { initLockliftStep } from "../../internal/cli/steps/initLocklift";

export const initializeExtenders = (params: {
  locklift: Locklift<any>;
  config: LockliftConfig<ConfigState.INTERNAL>;
  network?: keyof LockliftConfig["networks"];
}): Promise<void> => {
  const extenders = global.extenders.filter((extender): extender is Required<Extender> => !!extender.initializer);
  if (extenders.length === 0) {
    return Promise.resolve();
  }
  return lastValueFrom(
    from(extenders).pipe(
      mergeMap(extender =>
        from(extender.initializer(params)).pipe(
          tap(extenderObject => {
            //@ts-ignore
            params.locklift[extender.pluginName] = extenderObject;
          }),
        ),
      ),
    ),
  );
};

export const commandInjector = (rootProgram: commander.Command) => {
  if (global.extenders.length === 0) {
    return;
  }
  global.extenders
    .filter((extender): extender is Required<Extender> => !!extender.commandBuilders)
    .forEach(({ commandBuilders }) =>
      commandBuilders.forEach(({ commandCreator, skipSteps }) => {
        const command = new Command();
        command
          .option("-c, --contracts <contracts>", "Path to the contracts folder", "contracts")
          .option("-b, --build <build>", "Path to the build folder", "build")
          .option(
            "--disable-include-path",
            "Disables including node_modules. Use this with old compiler versions",
            false,
          )

          .option("-n, --network <network>", "Network to use, choose from configuration")
          .addOption(
            new Option("--config <config>", "Path to the config file")
              .default(() => loadConfig("locklift.config.ts"))
              .argParser(config => () => loadConfig(config)),
          )
          .option("-s, --script <script>", "Script to run")
          .hook("preAction", async thisCommand => {
            const options = thisCommand.opts();
            const config = await options.config();

            if (!skipSteps?.build) {
              await buildStep(config, options as any);
            }

            // Initialize Locklift
            const locklift = await initLockliftStep(config, options as any);
            thisCommand.setOptionValue("locklift", locklift);
          });

        rootProgram.addCommand(commandCreator(command));
      }),
    );
};
