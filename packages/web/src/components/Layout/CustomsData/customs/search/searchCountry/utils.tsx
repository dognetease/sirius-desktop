import { countryItemType, TreeNode } from './type';
import { getIn18Text } from 'api';
const aa = [
  {
    state: getIn18Text('MEIHONG'),
    code: getIn18Text('MEIHONG'),
    countries: [
      {
        label: getIn18Text('MOXIGE'),
        code: 'MX',
      },
    ],
  },
];
export function flattenTree(root: countryItemType[]): TreeNode[] {
  const res: TreeNode[] = [];
  function dfs(nodes: countryItemType[], parent: TreeNode | null = null) {
    if (!nodes) return;
    const newChildren: TreeNode[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      let _state = '';
      let _code = '';
      // @ts-ignore
      _state = node.state ? node.state : node.label;
      // @ts-ignores
      _code = node.code ? node.code : node.state ? node.state : node.label;
      const { code, countries = [] } = node;
      const newNode = {
        label: _state,
        code: _code,
        countries,
        parent,
      };
      res.push(newNode);
      newChildren.push(newNode);
      if (countries.length) {
        // @ts-ignore
        dfs(countries, newNode);
      }
    }
    if (parent) {
      parent.countries = newChildren;
    }
  }
  dfs(root);
  return res;
}
// 删除所有子孙节点的 value, 不包括自己
// 输入可能是 dirty
export function removeAllDescendanceValue(root: TreeNode, value: string[]): string[] {
  const allChildrenValue: string[] = [];
  function dfs(node: TreeNode): void {
    if (node.countries) {
      node.countries.forEach(item => {
        allChildrenValue.push(item.code);
        dfs(item);
      });
    }
  }
  dfs(root);
  return value.filter(val => !allChildrenValue.includes(val));
}
// 状态提升
export function liftTreeState(item: TreeNode, curVal: string[]): string[] {
  const { code } = item;
  // 加入当前节点 value
  const nextValue = curVal.concat(code);
  let last = item;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // 如果父节点的所有子节点都已经 checked, 添加该节点 value，继续尝试提升
    if (last?.parent?.countries!.every((child: TreeNode) => nextValue.includes(child.code))) {
      nextValue.push(last.parent.code);
      last = last.parent;
    } else {
      break;
    }
  }
  // 移除最后一个满足 checked 的父节点的所有子孙节点 value
  return removeAllDescendanceValue(last, nextValue);
}
// 状态下沉
export function sinkTreeState(root: TreeNode, value: string[]): string[] {
  const parentValues: string[] = [];
  const subTreeValues: string[] = [];
  function getCheckedParent(node: TreeNode | null | undefined): TreeNode | null {
    if (!node) {
      return null;
    }
    parentValues.push(node.code);
    if (value.includes(node.code)) {
      return node;
    }
    return getCheckedParent(node.parent);
  }
  const checkedParent = getCheckedParent(root);
  if (!checkedParent) {
    return value;
  }
  function dfs(node: TreeNode) {
    if (!node.countries || node.code === root.code) {
      return;
    }
    node.countries.forEach((item: TreeNode) => {
      if (item.code !== root.code) {
        if (parentValues.includes(item.code)) {
          dfs(item);
        } else {
          subTreeValues.push(item.code);
        }
      }
    });
  }
  dfs(checkedParent);
  // 替换 checkedParent 下子树的值
  const nextValue = removeAllDescendanceValue(checkedParent, value).filter(item => item !== checkedParent.code);
  return Array.from(new Set(nextValue.concat(subTreeValues)));
}
// checked, unchecked 时重新计算
export function reconcile(item: TreeNode, checked: boolean, value: string[]): string[] {
  if (checked) {
    // 如果已经有父节点被 checked, 再进行 checked 没有意义，直接忽略
    // 主要是用在避免初始化时传入的 value 结构不合理
    if (hasParentChecked(item, value)) {
      return value;
    }
    return liftTreeState(item, value);
  }
  return sinkTreeState(item, value);
}
// 是否有父节点（包括自己）被选中
export function hasParentChecked(item: TreeNode, value: string[]): boolean {
  let tmp: TreeNode | null | undefined = item;
  while (tmp) {
    if (value.includes(tmp.code)) {
      return true;
    }
    tmp = tmp.parent;
  }
  return false;
}
// 是否有子节点（包括自己）被选中
export function hasChildChecked(item: TreeNode, curValue: string[]): boolean {
  function dfs(node: TreeNode): boolean {
    if (!node) {
      return false;
    }
    const { code, countries } = node;
    if (curValue.includes(code)) {
      return true;
    }
    if (!countries) {
      return false;
    }
    return countries.some((child: TreeNode) => dfs(child));
  }
  return dfs(item);
}
