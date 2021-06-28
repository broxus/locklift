const fs = require('fs');
const dirTree = require("directory-tree");
const { execSync } = require('child_process');


function checkDirEmpty(dir) {
  if (!fs.existsSync(dir)) {
    return dir;
  }

  return fs.readdirSync(dir).length === 0;
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


function buildContracts(config, options) {
  const contractsNestedTree = dirTree(
    options.contracts,
    { extensions: /\.sol/ }
  );
  
  const contractsTree = flatDirTree(contractsNestedTree);
  
  console.log(`Found ${contractsTree.length} sources`);
  
  try {
    contractsTree.map(({ path }) => {
      console.debug(`Building ${path}`);
      
      const [,contractFileName] = path.match(new RegExp('contracts/(.*).sol'));
      
      const output = execSync(`cd ${options.build} && ${config.compiler.path} ./../${path}`);
      
      console.debug(`Compiled ${path}`);
      
      if (output.toString() === '') {
        // No code was compiled, probably interface compilation
        return;
      }
      
      const contractNameNoFolderStructure = contractFileName.split('/')[contractFileName.split('/').length - 1];
      
      const tvmLinkerLog = execSync(`cd ${options.build} && ${config.linker.path} compile "${contractNameNoFolderStructure}.code" -a "${contractNameNoFolderStructure}.abi.json"`);
      
      const [,tvcFile] = tvmLinkerLog.toString().match(new RegExp('Saved contract to file (.*)'));
      execSync(`cd ${options.build} && base64 < ${tvcFile} > ${contractNameNoFolderStructure}.base64`);
      
      execSync(`cd ${options.build} && mv ${tvcFile} ${contractNameNoFolderStructure}.tvc`);
      
      console.debug(`Linked ${path}`);
    });
  } catch (e) {
    return false;
  }
  
  return true;
}


module.exports = {
  checkDirEmpty,
  flatDirTree,
  buildContracts,
};
