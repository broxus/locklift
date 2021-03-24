const fs = require('fs');
const commander = require('commander');


function checkDirEmpty(dir) {
  if (!fs.existsSync(dir)) {
    return dir;
  }

  const isEmpty = fs.readdirSync(dir).length === 0;
  
  if (!isEmpty) {
    throw new commander.InvalidOptionArgumentError(`Directory at ${dir} should be empty!`);
  }
  
  return dir;
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


module.exports = {
  checkDirEmpty,
  flatDirTree,
};
