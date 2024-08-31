import React from 'react';
import styles from './index.module.scss';
import classnames from 'classnames';

type NodeType = 'normal' | 'expand';
export type DataNode = {
  title?: React.ReactNode;
  key: string;
  children?: DataNode[];
  icon?: React.ReactNode;
  defaultExpandAll?: boolean;
  // normal: default, 正常节点, 选中后会修改 key
  // expand: 专门用于展开的节点, 无选中态, 点击后仅触发展开关闭.
  nodeType?: NodeType;
};
type TreeProps = {
  onSelect: (selectedKey: DataNode['key']) => void;
  treeData: DataNode[];
  defaultSelectedKey?: DataNode['key'];
};

export const TreeContext = React.createContext<{
  selectedKey: DataNode['key'];
  setSelectedKey: (key: DataNode['key']) => void;
}>({
  selectedKey: '',
  setSelectedKey: () => {},
});

const Node: React.FC<{
  data: DataNode;
  level?: number;
}> = ({ data, level = 0 }) => {
  const { selectedKey, setSelectedKey } = React.useContext(TreeContext);
  const { title, children, key, icon, defaultExpandAll, nodeType = 'normal' } = data;
  const nodeTypeClassNameMap: Record<NodeType, string> = {
    normal: styles.nodeTypeNormal,
    expand: styles.nodeTypeExpand,
  };
  const [expand, setExpand] = React.useState<boolean>(defaultExpandAll || false);
  const isSelected = selectedKey === key;
  const hasChildren = children && children.length > 0;
  const indents = React.useMemo(() => {
    const indents = [];
    for (let i = 0; i < level; i++) {
      indents.push(<span key={i} className={styles.indent}></span>);
    }
    return indents;
  }, [level]);
  return (
    <div
      className={classnames({
        [styles.node]: true,
        [styles.hasChildren]: hasChildren,
        [styles.selected]: isSelected,
        [styles.isExpanded]: expand,
        [nodeTypeClassNameMap[nodeType]]: true,
      })}
    >
      <span
        className={styles.titleWrapper}
        onClick={() => {
          if (nodeType === 'expand') {
            setExpand(value => !value);
            return;
          }
          setSelectedKey(key);
        }}
      >
        {level > 0 && indents}
        {hasChildren && (
          <div
            className={styles.caretWrapper}
            onClick={e => {
              e.stopPropagation();
              setExpand(value => !value);
            }}
          >
            <span className={expand ? styles.caretDown : styles.caretRight} />
          </div>
        )}
        <span className={styles.title}>
          <span className={styles.titleIcon}>{icon}</span>
          {title}
        </span>
      </span>
      <div
        className={styles.nodeList}
        style={{
          display: expand ? 'block' : 'none',
        }}
      >
        {children?.map(child => (
          <Node key={child.key} data={child} level={level + 1} />
        ))}
      </div>
    </div>
  );
};

export const Tree: React.FC<TreeProps> = ({ onSelect, treeData, defaultSelectedKey }) => {
  const [selectedKey, setSelectedKey] = React.useState<DataNode['key']>(defaultSelectedKey || '');
  React.useEffect(() => {
    if (selectedKey !== '') {
      onSelect(selectedKey);
    }
  }, [selectedKey]);
  return (
    <div className={styles.tree}>
      <TreeContext.Provider value={{ selectedKey, setSelectedKey }}>
        <div className={styles.nodeList}>
          {treeData.map(data => (
            <Node key={data.key} data={data} />
          ))}
        </div>
      </TreeContext.Provider>
    </div>
  );
};
