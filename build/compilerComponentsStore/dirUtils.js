"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isComponentVersionExists = exports.getPathToVersion = void 0;
const env_paths_1 = __importDefault(require("env-paths"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const constances_1 = require("./constances");
const utils_1 = require("./utils");
const getDataDir = () => {
    const dataDir = (0, env_paths_1.default)(constances_1.PACKAGE_NAME).data;
    fs_extra_1.default.ensureDirSync(dataDir);
    return dataDir;
};
const getComponentsDir = ({ component }) => {
    const dir = path_1.default.resolve(getDataDir(), component);
    fs_extra_1.default.ensureDirSync(dir);
    return dir;
};
const getPathToVersion = ({ component, version }) => {
    return path_1.default.join(getComponentsDir({ component }), (0, utils_1.replaceDots)(version));
};
exports.getPathToVersion = getPathToVersion;
const isComponentVersionExists = ({ version, component, }) => {
    return fs_extra_1.default.existsSync((0, exports.getPathToVersion)({ component, version: (0, utils_1.replaceDots)(version) }));
};
exports.isComponentVersionExists = isComponentVersionExists;
