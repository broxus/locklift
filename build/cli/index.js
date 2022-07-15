#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
process.env.TS_NODE_PROJECT = path.join(__dirname, "../../tsconfig.json");
process.env.TS_CONFIG_PATHS = "true";
const commander_1 = require("commander");
const init_1 = __importDefault(require("./commands/init"));
const build_1 = __importDefault(require("./commands/build"));
const test_1 = __importDefault(require("./commands/test"));
const run_1 = __importDefault(require("./commands/run"));
// import gendoc from "./commands/gendoc";
commander_1.program.addCommand(init_1.default);
commander_1.program.addCommand(test_1.default);
commander_1.program.addCommand(build_1.default);
commander_1.program.addCommand(run_1.default);
// program.addCommand(gendoc);
commander_1.program.version(require("../../package.json").version);
commander_1.program.parse(process.argv);
