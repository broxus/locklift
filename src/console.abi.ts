export const consoleAbi = {
  "ABI version": 2,
  version: "2.2",
  header: [],
  functions: [],
  events: [{ name: "Log", inputs: [{ name: "_log", type: "string" }], outputs: [] }],
} as const;

export type ConsoleAbi = typeof consoleAbi;
