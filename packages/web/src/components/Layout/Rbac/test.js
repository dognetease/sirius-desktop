function removeEmptyNode(treeData) {
  for (let i = 0; i < treeData.length; i++) {
    const node = treeData[i];
    if (node.isLeaf || !node.children) {
      continue;
    }
    if (node.children.length === 0) {
      treeData.splice(i, 1);
      i--;
    } else {
      removeEmptyNode(node.children);
      if (node.children.length === 0) {
        treeData.splice(i, 1);
      }
    }
  }
  return treeData;
}

const arr = [
  {
    key: 'root',
    title: 'root',
    children: [
      {
        key: '1',
        title: '1',
        isLeaf: true,
      },
      {
        key: '2',
        title: '2',
        children: [],
      },
      {
        key: '3',
        title: '3',
        children: [
          {
            key: '3-1',
            title: '3-1',
          },
          {
            key: '3-2',
            title: '3-2',
            children: [
              {
                key: '3-2-1',
                title: '3-2-1',
                children: [],
              },
              {
                key: '3-2-2',
                title: '3-2-2',
                children: [],
              },
            ],
          },
          {
            key: '3-3',
            title: '3-3',
          },
        ],
      },
      {
        key: '4',
        title: '4',
        children: [
          {
            key: '4-1',
            title: '4-1',
            children: [],
          },
          {
            key: '4-2',
            title: '4-2',
            children: [],
          },
          {
            key: '4-3',
            title: '4-3',
            children: [],
          },
        ],
      },
    ],
  },
];
console.log(JSON.stringify(removeEmptyNode(arr), null, 4));
