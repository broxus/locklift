"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.download = exports.getComponent = void 0;
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const node_gzip_1 = require("node-gzip");
const dirUtils_1 = require("./dirUtils");
const utils_1 = require("./utils");
const getComponent = async ({ version, component, }) => {
    const tempFileBaseDir = (0, dirUtils_1.getPathToVersion)({ component, version });
    const binaryFilePath = path_1.default.join(tempFileBaseDir, utils_1.executableFileName[component]({ version }));
    if ((0, dirUtils_1.isComponentVersionExists)({ version, component })) {
        return binaryFilePath;
    }
    console.log(`Start downloading ${component} version ${version}`);
    const downloadLink = utils_1.downloadLinks[component]({ version });
    await fs_extra_1.default.ensureDir(tempFileBaseDir);
    const gzFilePath = path_1.default.join(tempFileBaseDir, (0, utils_1.getGzFileName)(utils_1.fileNames[component]({ version })));
    await download(downloadLink, gzFilePath).catch(async (e) => {
        const supportedVersions = await (0, utils_1.getSupportedVersions)({ component });
        console.error(`Can't download ${component} version ${version}, supported versions: ${supportedVersions.join(" ")}`);
        await fs_extra_1.default.rmdir(tempFileBaseDir);
        process.exit(1);
    });
    try {
        const unzippedBuffer = await (0, node_gzip_1.ungzip)(fs_extra_1.default.readFileSync(gzFilePath));
        fs_extra_1.default.rmSync(gzFilePath);
        fs_extra_1.default.writeFileSync(binaryFilePath, unzippedBuffer);
        fs_extra_1.default.chmodSync(binaryFilePath, "755");
        console.log(`${component} version ${version} successfully downloaded`);
        return binaryFilePath;
    }
    catch (e) {
        await fs_extra_1.default.rmdir(tempFileBaseDir);
        throw e;
    }
};
exports.getComponent = getComponent;
async function download(fileUrl, outputLocationPath) {
    const writer = fs_extra_1.default.createWriteStream(outputLocationPath);
    return (0, axios_1.default)({
        method: "get",
        url: fileUrl,
        responseType: "stream",
    })
        .then(response => {
        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            let error;
            writer.on("error", err => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on("close", () => {
                if (!error) {
                    resolve(true);
                }
            });
        });
    })
        .catch(async (e) => {
        await fs_extra_1.default.unlink(outputLocationPath);
        throw e;
    });
}
exports.download = download;
