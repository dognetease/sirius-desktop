import { Channel, UnitListType, UnitOrgType } from 'api';

const strRandom = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const uuid = function (n = 10) {
  let result = '';
  for (let i = 0; i < n; i++) {
    result += strRandom[Math.floor(Math.random() * strRandom.length)];
  }
  return result;
};

const buildUnitTree = (flatData: UnitListType[], parentId: string | undefined, p: Channel, isLeaf: boolean) => {
  const tree: UnitListType[] = [];
  flatData.forEach(item => {
    if (item.parentUnitId === parentId) {
      const children = buildUnitTree(flatData, item.unitId, p, isLeaf);
      item.title = item?.unitName || '';
      item.value = `${item?.unitId}_${uuid(10)}` || '';
      item.key = uuid(10);
      item.checkable = isLeaf;
      item.selectable = isLeaf;
      item.rawData = p;
      if (children.length) {
        item.children = children;
      } else {
        item.children = [
          {
            title: `${p.accountName}(${p.whatsAppNumber})`,
            value: `${p.accountId}_${p.whatsApp}_${uuid(10)}`,
            parentUnitId: item?.unitId || '',
            key: `${uuid(10)}`,
            checkable: true,
            isLeaf: true,
            rawData: p,
          },
        ];
      }
      tree.push(item);
    }
  });
  return tree;
};

const buildOrgPath = (orgPath: UnitOrgType[], p: Channel) => {
  // unitPathList
  const result = orgPath.map(el => {
    return buildUnitTree(el.unitList, '', p, false);
  });
  return result;
};

const bindStatusSorter = (a: UnitListType, b: UnitListType) => a.rawData.bindStatus.localeCompare(b.rawData.bindStatus);

const sortByBindStatus = (data: UnitListType[]) => {
  data.sort(bindStatusSorter);
  data.forEach(item => {
    if (item.children) {
      item.children.sort(bindStatusSorter);
    }
  });
};

// 1
const buildTreeData = (data: Channel[]) => {
  let result: UnitListType[][] = [];
  data.forEach(d => {
    if (d.unitPathList.length === 0) return;
    result = result.concat(buildOrgPath(d.unitPathList, d));
  });
  return result.flat(1);
};

// 2
const flattenData = (data: UnitListType[]) => {
  const uIdSet = new Set();
  return data.reduce((acc: UnitListType[], curr: UnitListType) => {
    if (!uIdSet.has(curr.unitId)) {
      acc.push(curr);
      uIdSet.add(curr.unitId);
    }
    if (curr.children) {
      acc = acc.concat(flattenData(curr.children));
      delete curr.children;
    }
    return acc;
  }, []);
};

// 3
const buildOrgRes = (data: UnitListType[], parentId: string | undefined) => {
  const tree: UnitListType[] = [];
  data.forEach(node => {
    if (node.parentUnitId === parentId) {
      const children = buildOrgRes(data, node.unitId);
      if (children.length) {
        node.children = children;
      }
      tree.push(node);
    }
  });
  sortByBindStatus(tree);
  return tree;
};

// 4
const processAdmin = (data: Channel[], res: UnitListType[]) => {
  const adminList = data.filter(item => item.unitPathList.length === 0);
  const processed = adminList.map(ad => ({
    title: `${ad.accountName}(${ad.whatsAppNumber})`,
    value: `${ad.accountId}_${ad.whatsApp}`,
    key: `${ad.accountId}_${ad.whatsApp}`,
    accountId: ad.accountId,
    parentUnitId: '',
    unitId: '',
    unitName: '',
    checkable: true,
    isLeaf: true,
    rawData: ad,
  }));
  sortByBindStatus(processed);
  return res.concat(processed);
};

const uniqueArr = (data: UnitListType[]): any => {
  return Object.values(
    data.reduce((unique: any, item) => {
      if (item.unitId) {
        unique[item.unitId] = item;
      } else {
        const key = Object.values(item).join('-');
        if (!unique[key]) {
          unique[key] = item;
        }
      }
      return unique;
    }, {})
  );
};

const buildOrgTree = (data: Channel[]) => {
  const temp = buildTreeData(data);
  const flat = uniqueArr(flattenData(temp));
  const builded = buildOrgRes(flat, '');
  const final = processAdmin(data, builded);
  return final;
};

export { buildOrgTree };
