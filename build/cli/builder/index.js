"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Builder = void 0;
const child_process_1 = require("child_process");
const generators_1 = require("../../generators");
const ejs_1 = __importDefault(require("ejs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const underscore_1 = __importDefault(require("underscore"));
const directory_tree_1 = __importDefault(require("directory-tree"));
const utils_1 = require("./utils");
const tablemark = require("tablemark");
const util_1 = require("util");
const rxjs_1 = require("rxjs");
class Builder {
    config;
    options;
    nameRegex = /======= (?<contract>.*) =======/g;
    docRegex = /(?<doc>^{(\s|.)*?^})/gm;
    constructor(config, options) {
        this.config = config;
        this.options = options;
    }
    async buildContracts() {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const contractsTree = this.getContractsTree();
        try {
            this.log(`Found ${contractsTree.length} sources`);
            await (0, rxjs_1.from)(contractsTree)
                .pipe((0, rxjs_1.map)((el) => ({ ...el, path: (0, path_1.resolve)(el.path) })), (0, rxjs_1.map)((el) => ({
                ...el,
                contractFileName: (0, utils_1.extractContractName)(el.path),
            })), (0, rxjs_1.mergeMap)(({ path, contractFileName }) => {
                const nodeModules = (0, utils_1.tryToGetNodeModules)();
                const additionalIncludesPath = `--include-path ${(0, path_1.resolve)(process.cwd(), "node_modules")}  ${nodeModules ? `--include-path ${nodeModules}` : ""}`;
                const includePath = `${additionalIncludesPath}`;
                return (0, rxjs_1.defer)(async () => (0, util_1.promisify)(child_process_1.exec)(`cd ${this.options.build} && \
          ${this.config.compilerPath} ${!this.options.disableIncludePath ? includePath : ""} ${path}`)).pipe((0, rxjs_1.map)((output) => ({ output, contractFileName: (0, path_1.parse)(contractFileName).name, path })));
            }), 
            //Warnings
            (0, rxjs_1.tap)((output) => console.log(output.output.stderr.toString())), 
            //Errors
            (0, rxjs_1.catchError)((e) => {
                console.log(e?.stderr?.toString() || e);
                return (0, rxjs_1.throwError)(undefined);
            }), (0, rxjs_1.filter)(({ output }) => {
                //Only contracts
                return !!output?.stdout.toString();
            }), (0, rxjs_1.mergeMap)(({ contractFileName }) => {
                const lib = this.config.linkerLibPath ? ` --lib ${this.config.linkerLibPath} ` : "";
                const resolvedPathCode = (0, path_1.resolve)(this.options.build, `${contractFileName}.code`);
                const resolvedPathAbi = (0, path_1.resolve)(this.options.build, `${contractFileName}.abi.json`);
                return (0, rxjs_1.defer)(async () => (0, util_1.promisify)(child_process_1.exec)(`${this.config.linkerPath} compile "${resolvedPathCode}" -a "${resolvedPathAbi}" ${lib}`)).pipe((0, rxjs_1.map)((tvmLinkerLog) => {
                    return tvmLinkerLog.stdout.toString().match(new RegExp("Saved contract to file (.*)"));
                }), (0, rxjs_1.catchError)((e) => {
                    console.log(e?.stderr?.toString());
                    return (0, rxjs_1.throwError)(undefined);
                }), (0, rxjs_1.map)((matchResult) => {
                    if (!matchResult) {
                        throw new Error("Linking error, noting linking");
                    }
                    return matchResult[1];
                }), (0, rxjs_1.mergeMap)((tvcFile) => {
                    return (0, rxjs_1.concat)((0, rxjs_1.defer)(() => (0, util_1.promisify)(fs_1.default.writeFile)((0, path_1.resolve)(this.options.build, `${contractFileName}.base64`), (0, utils_1.tvcToBase64)(fs_1.default.readFileSync(tvcFile)))), (0, rxjs_1.defer)(() => (0, util_1.promisify)(fs_1.default.rename)(tvcFile, (0, path_1.resolve)(this.options.build, `${contractFileName}.tvc`)))).pipe((0, rxjs_1.catchError)((e) => {
                        console.log(e?.stderr?.toString());
                        return (0, rxjs_1.throwError)(undefined);
                    }));
                }));
            }), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)(() => {
                if (this.config.externalContracts) {
                    (0, generators_1.copyExternalFiles)(this.config.externalContracts, this.options.build);
                }
            }), (0, rxjs_1.tap)(() => (0, generators_1.typeGenerator)(this.options.build)), (0, rxjs_1.tap)(() => this.log("factorySource generated")))
                .toPromise();
            console.log("Built");
        }
        catch (err) {
            console.log("BUILD ERROR", err);
            return false;
        }
        return true;
    }
    buildDocs() {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const contractsTree = this.getContractsTree();
        try {
            console.log(`Found ${contractsTree.length} sources`);
            let docs = [];
            contractsTree.map(({ path }) => {
                this.log(`Building ${path}`);
                const output = (0, utils_1.execSyncWrapper)(`cd ${this.options.build} && ${this.config.compilerPath} ./../${path} --${this.options.mode}`);
                this.log(`Compiled ${path}`);
                docs = [...docs, ...this.parseDocs(output.toString())];
            });
            // Filter duplicates by (path, name)
            docs = docs.reduce((acc, doc) => {
                if (acc.find(({ path, name }) => path === doc.path && name === doc.name)) {
                    return acc;
                }
                return [...acc, doc];
            }, []);
            // Sort docs by name (A-Z)
            docs = docs.sort((a, b) => (a.name < b.name ? -1 : 1));
            // Save docs in markdown format
            const render = ejs_1.default.render(fs_1.default.readFileSync((0, path_1.resolve)(__dirname, "./../templates/index.ejs")).toString(), {
                docs,
                tablemark,
            }, {
                rmWhitespace: true,
            });
            fs_1.default.writeFileSync((0, path_1.resolve)(process.cwd(), this.options.docs, "index.md"), render);
            this.log("Docs generated successfully!");
        }
        catch (e) {
            console.log(e);
            return false;
        }
        return true;
    }
    parseDocs(output) {
        const contracts = [...output.matchAll(this.nameRegex)]
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .map((m) => m.groups.contract)
            // For the target contracts compiler returns relative path
            // and for dependency contracts paths are absolute
            // Make them all absolute
            .map((c) => (0, path_1.resolve)(process.cwd(), this.options.build, c));
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const docs = [...output.matchAll(this.docRegex)].map((m) => JSON.parse(m.groups.doc));
        return underscore_1.default.zip(contracts, docs).reduce((acc, [contract, doc]) => {
            const [path, name] = contract.split(":");
            // Check name matches the "include" pattern and contract is located in the "contracts" dir
            if (name.match(new RegExp(this.options.include)) !== null &&
                path.startsWith(`${process.cwd()}/${this.options.contracts}`)) {
                return [
                    ...acc,
                    {
                        path: path.replace(`${process.cwd()}/`, ""),
                        name,
                        doc,
                    },
                ];
            }
            return acc;
        }, []);
    }
    getContractsTree() {
        const contractsNestedTree = (0, directory_tree_1.default)(this.options.contracts, {
            extensions: /\.sol/,
        });
        return (0, utils_1.flatDirTree)(contractsNestedTree);
    }
    log(text) {
        console.log(text);
    }
}
exports.Builder = Builder;
