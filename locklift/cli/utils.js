const fs = require('fs');
const dirTree = require("directory-tree");
const { execSync } = require('child_process');
const _ = require('underscore');
const { resolve } = require('path');
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
  
    this.nameRegex = /======= (?<contract>.*) =======/g;
    this.docRegex = /(?<doc>^{(\s|.)*?^})/gm;
  }
  
  buildContracts() {
    const contractsTree = this.getContractsTree();
  
    this.log(`Found ${contractsTree.length} sources`);

    try {
      contractsTree.map(({ path }) => {
        this.log(`Building ${path}`);
      
        const [,contractFileName] = path.match(new RegExp('contracts/(.*).sol'));

        const nodeModules = require
            .resolve('locklift/package.json')
            .replace('locklift/package.json', '');

        const includePath = `--include-path ${nodeModules}`;

        const output = execSync(`cd ${this.options.build} && \
        ${this.config.compiler.path} ${!this.options.disableIncludePath ? includePath : ''} ./../${path}`);

        this.log(`Compiled ${path}`);
  
        // No code was compiled, probably interface compilation
        if (output.toString() === '') return;
      
        const contractNameNoFolderStructure = contractFileName.split('/')[contractFileName.split('/').length - 1];
      
        const lib = this.config.linker.lib ? ` --lib ${this.config.linker.lib} `: '';
        const tvmLinkerLog = execSync(`cd ${this.options.build} && ${this.config.linker.path} compile ${lib} "${contractNameNoFolderStructure}.code" -a "${contractNameNoFolderStructure}.abi.json"`);
      
        const [,tvcFile] = tvmLinkerLog.toString().match(new RegExp('Saved contract to file (.*)'));
        execSync(`cd ${this.options.build} && base64 < ${tvcFile} > ${contractNameNoFolderStructure}.base64`);
      
        execSync(`cd ${this.options.build} && mv ${tvcFile} ${contractNameNoFolderStructure}.tvc`);
      
        this.log(`Linked ${path}`);
      });
    } catch (e) {
      return false;
    }
  
    return true;
  }
  
  buildDocs() {
    const contractsTree = this.getContractsTree(this.options.contracts);
  
    console.log(`Found ${contractsTree.length} sources`);
    
    let docs = [];
    
    try {
      contractsTree.map(({ path }) => {
        this.log(`Building ${path}`);
      
        const output = execSync(`cd ${this.options.build} && ${this.config.compiler.path} ./../${path} --${this.options.mode}`);
      
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
      return false;
    }
  
    return true;
  }
  
  parseDocs(output) {
    const contracts = [...output.matchAll(this.nameRegex)]
      .map(m => m.groups.contract)
      // For the target contracts compiler returns relative path
      // and for dependency contracts paths are absolute
      // Make them all absolute
      .map(c => resolve(process.cwd(), this.options.build, c));

    const docs = [...output.matchAll(this.docRegex)]
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

  getContractsTree() {
    const contractsNestedTree = dirTree(
      this.options.contracts,
      { extensions: /\.sol/ }
    );
  
    return flatDirTree(contractsNestedTree);
  }
  
  log(text) {
    console.log(text);
  }
}


module.exports = {
  checkDirEmpty,
  flatDirTree,
  Builder,
  initializeDirIfNotExist,
};
