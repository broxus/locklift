import { DirectoryTree } from 'directory-tree';

export function flatDirTree(tree: DirectoryTree): DirectoryTree[] | undefined {
  return tree.children?.reduce((acc: DirectoryTree[], current: DirectoryTree) => {
    if (current.children === undefined) {
      return [
        ...acc,
        current,
      ];
    }

    const flatChild = flatDirTree(current);

    if (!flatChild)
      return acc;

    return [...acc, ...flatChild];
  }, []);
}
