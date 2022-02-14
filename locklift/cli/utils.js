const fs = require('fs');
const os = require('os');
const dirTree = require("directory-tree");
const { execSync } = require('child_process');
const _ = require('underscore');
const { resolve, dirname, basename } = require('path');
const ejs = require('ejs');
const tablemark = require('tablemark');

function checkDirEmpty(dir) {
  if (!fs.existsSync(dir)) {
    return dir;
  }

  return fs.readdirSync(dir).length === 0;
}

function initializeDirIfNotExist(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

function flatDirTree(tree) {
  return tree.children.reduce((acc, current) => {
    if (current.children === undefined) {
      return [
        ...acc,
        current,
      ];
    }

    const flatChild = flatDirTree(current);

    return [...acc, ...flatChild];
  }, []);
}

class Builder {
  constructor(config, options) {
    this.config = config;
    this.options = options;

    this.nameRegexUnix = /======= (?<contract>.*) =======/g;
    this.docRegexUnix = /(?<doc>^{(\s|.)*?^})/gm;

    this.nameRegexWin32 = /Code was generated and saved to file (?<contract>.*)/g;
    this.docRegexWin32 = /(?<doc>^{(\s|.)*?^})/gm;
  }

  buildContracts() {
    const contractsTree = this.getContractsTree();

    this.log(`Found ${contractsTree.length} sources`);

    try {
      contractsTree.map(({ path }) => {
        this.log(`Building ${path}`);

        const [,contractFileName] = path.match(new RegExp('contracts/([^\.]*).' + this.options.fileExtension));

        let buildDir = dirname(path).replace(/contracts\//, `${this.options.build}/`);
            buildDir = buildDir.replace(/contracts/, this.options.build);

        const output = execSync(`${this.config.compiler.path} -o ${buildDir} ${typeof this.options.includePath != "undefined" && this.options.includePath != '' ? `--include-path ${this.options.includePath}` : ''} ${path}`);

        this.log(`Compiled ${path}`);

        // No code was compiled, probably interface compilation
        if (output.toString() === '') return;

        const resolvedPathCode = resolve(this.options.build, `${contractFileName}.code`);
        const resolvedPathAbi = resolve(this.options.build, `${contractFileName}.abi.json`);

        const tvmLinkerLog = execSync(`${this.config.linker.path} compile "${resolvedPathCode}" -a "${resolvedPathAbi}" --lib ${this.config.lib.path}`);

        const [,tvcFile] = tvmLinkerLog.toString().match(new RegExp('Saved contract to file (.*)'));

        fs.writeFileSync(resolve(this.options.build, `${contractFileName}.base64`), tvcToBase64(fs.readFileSync(tvcFile)));
        fs.renameSync(tvcFile, resolve(this.options.build, `${contractFileName}.tvc`));

        this.log(`Linked ${path}`);
      });
    } catch (e) {
      console.log(e);
      return false;
    }

    return true;
  }

  buildDocs() {
    const contractsTree = this.getContractsTree();

    console.log(`Found ${contractsTree.length} sources`);

    let docs = [];

    try {
      contractsTree.map(({ path }) => {
        this.log(`Building ${path}`);

        let buildDir = dirname(path).replace(/contracts\//, `${this.options.build}/`);
            buildDir = buildDir.replace(/contracts/, this.options.build);

        const output = execSync(`${this.config.compiler.path} -o ${buildDir} ${typeof this.options.includePath != "undefined" && this.options.includePath != '' ? `--include-path ${this.options.includePath}` : ''} ${path} --${this.options.mode}`);

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
      docs = docs.sort((a,b) => a.name < b.name ? -1 : 1);

      // Save docs in markdown format
      const render = ejs.render(
        fs.readFileSync(resolve(__dirname, './../templates/index.ejs')).toString(),
        {
          docs,
          tablemark
        },
        {
          rmWhitespace: true
        }
      );

      fs.writeFileSync(resolve(process.cwd(), this.options.docs, 'index.md'), render);

      this.log('Docs generated successfully!');
    } catch (e) {
      console.log(e);
      return false;
    }

    return true;
  }

  parseDocs(output) {
    if (os.platform() == 'win32') {
      const contracts = [...output.matchAll(this.nameRegexWin32)]
        .map(m => m.groups.contract)
        // For the target contracts compiler returns relative path
        // and for dependency contracts paths are absolute
        // Make them all absolute
        .map(c => c.substring(c.indexOf(this.options.build)));
      if (contracts.length == 0) {
        return [];
      }
      const docs = [...output.matchAll(this.docRegexWin32)]
        .map(m => JSON.parse(m.groups.doc));
      return _.zip(docs).reduce((acc, [doc]) => {
        let path = dirname(contracts[0]).replace(new RegExp(this.options.build + '/'), 'contracts/');
            path = path.replace(new RegExp(this.options.build), 'contracts');
            path = path.replace('\\', '/');

        const name = basename(contracts[0]).replace('.code', '.' + this.options.fileExtension);

        // Check name matches the "include" pattern and contract is located in the "contracts" dir
        if (
          name.match(new RegExp(this.options.include)) !== null
        ) {
          return [
            ...acc,
            {
              path: path,
              name,
              doc
            }
          ];
        }

        return acc;
      }, []);
    } else {
      const contracts = [...output.matchAll(this.nameRegexUnix)]
        .map(m => m.groups.contract)
        // For the target contracts compiler returns relative path
        // and for dependency contracts paths are absolute
        // Make them all absolute
        .map(c => resolve(process.cwd(), this.options.build, c));

      const docs = [...output.matchAll(this.docRegexUnix)]
        .map(m => JSON.parse(m.groups.doc));

      return _.zip(contracts, docs).reduce((acc, [contract, doc]) => {
        const [path, name] = contract.split(':');

        // Check name matches the "include" pattern and contract is located in the "contracts" dir
        if (
          name.match(new RegExp(this.options.include)) !== null &&
          path.startsWith(`${process.cwd()}/${this.options.contracts}`)
        ) {
          return [
            ...acc,
            {
              path: path.replace(`${process.cwd()}/`, ''),
              name,
              doc
            }
          ];
        }

        return acc;
      }, []);
    }
  }

  getContractsTree() {
    const regexp = new RegExp('\\.' + this.options.fileExtension);
    const contractsNestedTree = dirTree(
      this.options.contracts,
      { extensions: regexp,
        normalizePath: true }
    );

    return flatDirTree(contractsNestedTree);
  }

  tvcToBase64() {
    const regexp = new RegExp('\.tvc');
    const contractsNestedTree = dirTree(
      this.options.build,
      { extensions: regexp,
        normalizePath: true }
    );

    const contractsTree = flatDirTree(contractsNestedTree);
    this.log(`Found ${contractsTree.length} sources`);

    try {
      contractsTree.map(({ path }) => {
        try {
          const [,contractFileName] = path.match(new RegExp(this.options.build + '/(.*).tvc'));

          fs.writeFileSync(path.replace('.tvc', '.base64'), tvcToBase64(fs.readFileSync(path)));
          this.log(`Prepared ${path}`);
        } catch (e) {
          console.log(`Error for the preparation process ${path}`, e);
        }
      });
    } catch (e) {
      return false;
    }

    return true;
  }

  log(text) {
    console.log(text);
  }
}

function tvcToBase64(tvc) {
  const binstr = Array.prototype.map.call(tvc, function (ch) {
    return String.fromCharCode(ch);
  }).join('');

  return btoa(binstr);
}

module.exports = {
  checkDirEmpty,
  flatDirTree,
  Builder,
  initializeDirIfNotExist,
  tvcToBase64,
};
