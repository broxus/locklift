# Building Locklift Plugins

In this guide, we will walk you through the process of creating plugins for Locklift, a Node JS framework designed for the building, testing, running, and maintaining of smart contracts for TVM (TON Virtual Machine) blockchains like Everscale, Venom, Gosh, and TON.

To simplify the process, we'll use the [`locklift-plugin-boilerplate`](https://github.com/broxus/locklift-plugin-boilerplate/tree/master) as a template. This boilerplate provides a basic structure for creating new plugins, making it easier to get started.

## What are Plugins in Locklift?

Plugins in Locklift are modules that extend the framework's functionality. They can add new commands, modify existing ones, or provide additional runtime features. This customization allows you to enhance the Locklift environment to suit your specific needs.

## How to Create a Locklift Plugin

Creating a Locklift plugin involves several steps, each of which we will discuss in detail below:

### Step 1: Define Your Plugin

Start by creating a new TypeScript file. This is where you'll define your plugin and its functionality.

```typescript
// index.ts
import { addPlugin } from 'locklift/plugins';

addPlugin({
  pluginName: 'myPlugin',
  initializer: async ({ locklift, config, network }) => {
    // Initialize your plugin here
  },
  commandBuilders: [
    {
      commandCreator: command =>
        command.name('myCommand').action(options => {
          // Define what your command does here
        }),
    },
  ],
});
```

In this example, we're adding a new command named `myCommand` to the CLI. When this command is run, it executes the code defined in the `action` function.

### Step 2: Extend the Locklift Environment

You can extend the Locklift environment to add new features. This is achieved using the `extendEnvironment()` function, which allows you to add custom properties or methods to the Locklift environment.

```typescript
// type-extensions.ts
import { Locklift } from 'locklift';

declare module 'locklift' {
  interface Locklift {
    myPlugin: any;
  }
}

Locklift.prototype.myPlugin = 'My Custom Plugin';
```

In this example, we're adding a new property `myPlugin` to the Locklift prototype.

### Step 3: Add Custom Commands

Locklift allows you to add your own commands to the CLI. This is done using the `commandCreator` function. You can define new commands, specify their arguments, and define their actions.

```typescript
commandBuilders: [
  {
    commandCreator: command =>
      command.name('myCommand')
             .description('My custom command')
             .action(options => {
               // Define what your command does here
             }),
  },
],
```

In this example, we're defining a new command `myCommand` with a description and an action.

### Step 4: Register Your Plugin

Once you've defined your plugin and its functionality, you need to register it with Locklift. This is done using the `addPlugin()` function. This function takes an object that defines the plugin name, initializer function, and command builders.

```typescript
addPlugin({
  pluginName: 'myPlugin',
  initializer: async ({ locklift, config, network }) => {
    // Initialize your plugin here
  },
  commandBuilders: [
    {
      commandCreator: command =>
        command.name('myCommand').action(options => {
          // Define what your command does here
        }),
    },
  ],
});
```

In this example, we're registering our `myPlugin` with Locklift, defining an initializer function and a command builder.

### Step 5: Local Development Setup

For local development of the plugin, follow these steps:

1. Initialize a new Locklift project in any folder, for example, `./my_project/plugin_development_project`.
2. Define this boilerplate inside another folder, for example, `./my_project/my_plugin`, and change the project name inside `package.json` to, for example, `my-plugin`.
3. Inside the plugin folder, build and link the plugin using the command `npm run build && npm link`.
4. Go to the Locklift project and link your plugin using the command `npm link my-plugin`.

## Using the Plugin in a Locklift Project

Once the plugin is installed and imported in `locklift.config.ts` as `import "sample-plugin";`, you can define custom fields in `locklift.config.ts` if needed.

### CLI usage

Then, you can use it via the CLI. For example, to see the new commands provided by your plugin, you can use the command `npx locklift -h`.

Let's use the `getcode` method as an example:

```shell
npx locklift getcode -n local --contract MyContractName
```

The output would be something like this (cut):

```shell
te6ccgEC...AAAEA==
```

### TypeScript usage

In `type-extensions.ts`, we have already overridden types for `Locklift`, so a user will see our plugin inside the `locklift` object and interact with it like this:

```typescript
console.log(locklift.samplePlugin.getGreeting());
```

## Plugin Development Best Practices

When developing Locklift plugins, consider the following best practices:

- **Keep your plugins focused**: Each plugin should have a specific purpose and perform it well. Avoid trying to make one plugin do everything.
- **Handle errors gracefully**: Ensure your plugin throws clear and understandable errors when things go wrong. This will help users of your plugin debug any issues they encounter.
- **Document your plugin**: Provide clear documentation on what your plugin does, how to install it, and how to use it. This will make it easier for others to use your plugin.
- **Test your plugin**: Before publishing your plugin, thoroughly test it to ensure it works as expected. This will help prevent issues for users of your plugin.
