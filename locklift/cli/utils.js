const fs = require('fs');


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


module.exports = {
  checkDirEmpty,
  flatDirTree,
};
