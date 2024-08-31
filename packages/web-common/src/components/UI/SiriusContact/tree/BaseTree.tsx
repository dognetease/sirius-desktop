import React from 'react';
import { ContactTreeDataNode, ContactTreeLeaf, ContactTreeNode, ContactTreeOrgNodeType } from '@web-common/components/util/contact';
import styles from '@web-common/components/UI/SiriusContact/tree/index.module.scss';
// @ts-ignore
import Tree from '@web-mail/common/components/VListTree/VListTree';
import { ContactTreeBase, transTreeName } from './data';

export const rootBaseKey = 'TreeBaseRootKey';
export const selectBtnNameMap: Partial<Record<ContactTreeOrgNodeType, string>> = {
  enterprise: transTreeName('orgBtn'),
  team: transTreeName('teamBtn'),
  personal: transTreeName('personalOrgBtn'),
  clue: transTreeName('select'),
  customer: transTreeName('select'),
};
/**
 * 基础树
 * @param props
 * @constructor
 */
const BaseTree: React.FC<ContactTreeBase> = props => {
  const { treeWidth, treeHeight, treeInitData, expandedKeys, renderTitle, renderNode, loadData, onLoadMoreNode, cardGroupDecorate, onSelect } = props;

  return (
    <div className={styles.ContactTree}>
      <Tree
        selectedKeys={[]}
        hasMore={false}
        width={treeWidth}
        height={treeHeight}
        // loadedKeys={[...loadedKeysSet]}
        onLoadMoreNode={async (page, parentNode) => {
          if (onLoadMoreNode) {
            await onLoadMoreNode(parentNode as unknown as ContactTreeNode);
          }
          return true;
        }}
        loadData={async data => {
          if (loadData) {
            await loadData(data as unknown as ContactTreeNode);
          }
          return true;
        }}
        defaultExpandedKeys={[...(expandedKeys || [])]}
        expandedKeys={[...(expandedKeys || [])]}
        onSelect={(_, { node }) => {
          onSelect && onSelect(node as ContactTreeDataNode);
        }}
        // onExpand={handleSelect}
        treeData={treeInitData}
        titleRender={data => {
          const nodeData = data as ContactTreeLeaf | ContactTreeNode;
          if (nodeData.isLeaf) {
            return renderTitle ? (renderTitle(nodeData as ContactTreeLeaf) as React.ReactElement) : undefined;
          } else {
            return renderNode ? (renderNode(nodeData as ContactTreeNode) as React.ReactElement) : undefined;
          }
        }}
        icon={null}
        cardGroupDecorate={cardGroupDecorate}
      />
    </div>
  );
};
export default BaseTree;
