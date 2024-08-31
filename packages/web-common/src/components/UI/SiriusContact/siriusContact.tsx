import React, { useState, useCallback, useEffect, useImperativeHandle } from 'react';
import { Input, Tree, Divider } from 'antd';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import { List as VList, ListRowRenderer } from 'react-virtualized/dist/commonjs/List';
import { DataNode, TreeProps, EventDataNode } from 'antd/lib/tree';
import { ContactModel, apiHolder, NIMApi } from 'api';
import classnames from 'classnames';
import SearchIcon from '../Icons/svgs/SearchSvg';
import styles from './siriusContact.module.scss';
import { StaticNodeKey } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';
const nimApi = apiHolder.api.requireLogicalApi('NIM') as NIMApi;
export enum TreeType {
  PERSON,
  ORG,
  Group,
}
export interface SiriusContactRefProps {
  getSearchKeyword?: () => string;
  setSearchKeyword?: (value: string) => void;
  resetContactTree: () => void;
}
export interface SiriusContactProps {
  onSearch: (keyword: string) => void;
  keyword?: string;
  searchList: ContactModel[];
  searchListItemRender: ListRowRenderer;
  searchListItemHeight: number;
  renderPersonTitle: (node: DataNode) => React.ReactNode;
  renderOrgTitle: (node: DataNode) => React.ReactNode;
  renderGroupTitle?: (node: DataNode) => React.ReactNode;
  onLoadData: (node: EventDataNode) => Promise<void>;
  onGroupLoadData?: (node: EventDataNode) => Promise<void>;
  personData: DataNode[];
  orgData: DataNode[];
  groupData: DataNode[];
  ref?: React.Ref<SiriusContactRefProps>;
  selectedPersonKeys?: string[];
  selectedOrgKeys?: string[];
  containerClassName?: string; // tree container className
  personExpand?: (val: string[]) => void;
  personNodeSelect?: () => void;
  nodeSelect?: () => void;
  OrgExpand?: (val: boolean) => void;
  GroupExpand?: (val: boolean) => void;
  shouldShowOrgContact?: boolean;
}
export const SiriusContact: React.FC<SiriusContactProps> = React.forwardRef((props: SiriusContactProps, ref) => {
  const {
    onSearch,
    keyword,
    searchList,
    searchListItemRender,
    searchListItemHeight,
    renderPersonTitle,
    renderOrgTitle,
    renderGroupTitle,
    onLoadData,
    onGroupLoadData,
    personData,
    orgData,
    groupData,
    selectedPersonKeys = [],
    selectedOrgKeys = [],
    containerClassName,
    personExpand,
    personNodeSelect,
    nodeSelect,
    OrgExpand,
    GroupExpand,
    shouldShowOrgContact = true,
  } = props;
  const [loadedKeys, setLoadedKeys] = useState<string[]>([]);
  const [expandedPersonKeys, setExpandedPersonKeys] = useState<Array<string | number>>([StaticNodeKey.PERSON]);
  const [expandedOrgKeys, setExpandedOrgKeys] = useState<Array<string | number>>([StaticNodeKey.CORP]);
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Array<string | number>>([StaticNodeKey.GROUP]);
  const [searchValue, setSearchValue] = useState<string>('');
  const inputChange = useCallback(
    (e: any) => {
      const { value } = e.target;
      setSearchValue(value);
      onSearch && onSearch(value);
    },
    [onSearch]
  );
  // 展开
  const handlePersonExpand: TreeProps['onExpand'] = useCallback(expendKeys => {
    personExpand && personExpand(expendKeys);
    setExpandedPersonKeys(expendKeys);
  }, []);
  const handleOrgExpand: TreeProps['onExpand'] = useCallback(expendKeys => {
    OrgExpand && OrgExpand(expendKeys.length > expandedOrgKeys.length);
    setExpandedOrgKeys(expendKeys);
  }, []);
  const handleGroupExpand: TreeProps['onExpand'] = useCallback(expendKeys => {
    GroupExpand && GroupExpand(expendKeys.length > expandedGroupKeys.length);
    setExpandedGroupKeys(expendKeys);
  }, []);
  const loadData: TreeProps['loadData'] = node => {
    const { key } = node;
    if (loadedKeys.indexOf(String(key)) !== -1) {
      return Promise.resolve();
    }
    // FIXME: load contact may fail, then remove the key from loadedKeys
    setLoadedKeys(prevLoadedKeys => ([] as string[]).concat(prevLoadedKeys, String(key)));
    return (onLoadData && onLoadData(node)) || Promise.resolve();
  };
  /**
   * 群组相关
   */
  const loadGroupData = (node: EventDataNode) => {
    const { key } = node;
    if (loadedKeys.indexOf(String(key)) !== -1) {
      return Promise.resolve();
    }
    // FIXME: load contact may fail, then remove the key from loadedKeys
    setLoadedKeys(prevLoadedKeys => ([] as string[]).concat(prevLoadedKeys, String(key)));
    return (onGroupLoadData && onGroupLoadData(node)) || Promise.resolve();
  };
  const onNodeSelect = (key: string | number, type: TreeType) => {
    let keys;
    let setExpandedKeys;
    if (type === TreeType.PERSON) {
      keys = expandedPersonKeys;
      setExpandedKeys = setExpandedPersonKeys;
    } else if (type === TreeType.ORG) {
      keys = expandedOrgKeys;
      setExpandedKeys = setExpandedOrgKeys;
    } else {
      keys = expandedGroupKeys;
      setExpandedKeys = setExpandedGroupKeys;
    }
    let expanedKeys;
    if (keys.includes(key)) {
      expanedKeys = keys.filter(elem => elem !== key);
    } else {
      expanedKeys = [...keys, key];
    }
    setExpandedKeys(expanedKeys);
  };
  const onPersonNodeSelect: TreeProps['onSelect'] = (_, e) => {
    personNodeSelect && personNodeSelect();
    onNodeSelect(e.node.key, TreeType.PERSON);
  };
  const onOrgNodeSelect: TreeProps['onSelect'] = (_, e) => {
    if (e.node.isLeaf) {
      return;
    }
    onNodeSelect(e.node.key, TreeType.ORG);
    nodeSelect && nodeSelect();
    if (loadedKeys.indexOf(String(e.node.key)) === -1) {
      loadData(e.node);
    }
  };
  const onGroupNodeSelect: TreeProps['onSelect'] = (_, e) => {
    if (e.node.isLeaf) {
      return;
    }
    onNodeSelect(e.node.key, TreeType.Group);
    nodeSelect && nodeSelect();
    if (loadedKeys.indexOf(String(e.node.key)) === -1) {
      loadGroupData(e.node);
    }
  };
  const visibleGroup = nimApi.getIMAuthConfig() && groupData?.some(item => Boolean(item.children?.length));
  useImperativeHandle(ref, () => ({
    resetContactTree: () => {
      setLoadedKeys([]);
      // setExpandedPersonKeys([StaticNodeKey.PERSON]);
      // setExpandedOrgKeys(['-1']);
      // setSearchValue('');
    },
  }));
  useEffect(() => {
    if (typeof keyword !== 'undefined' && keyword !== searchValue) {
      setSearchValue(keyword);
    }
  }, [keyword]);

  return (
    <div className="sirius-contact-tree-container">
      <div className={styles.searchContainer}>
        <Input placeholder={getIn18Text('SOUSUOLIANXIREN')} prefix={<SearchIcon />} value={searchValue} allowClear onChange={inputChange} />
      </div>
      {searchValue ? (
        <div className={styles.contactListWrapper}>
          <AutoSizer>
            {({ width, height }) => (
              <VList
                height={height}
                width={width}
                rowCount={searchList?.length || 0}
                rowHeight={searchListItemHeight}
                className="sirius-scroll-hide"
                rowRenderer={searchListItemRender}
              />
            )}
          </AutoSizer>
        </div>
      ) : (
        <div className={styles.treeWrapper}>
          <div className={classnames(styles.treeContainer, containerClassName)}>
            <Tree
              motion={false}
              blockNode
              treeData={personData}
              titleRender={renderPersonTitle}
              expandedKeys={expandedPersonKeys}
              onExpand={handlePersonExpand}
              onSelect={onPersonNodeSelect}
              multiple
              selectedKeys={selectedPersonKeys}
            />
          </div>
          {shouldShowOrgContact && (
            <>
              <div className={styles.dividerContainer}>
                <Divider />
              </div>
              <div className={classnames(styles.treeContainer, containerClassName)}>
                <Tree
                  motion={false}
                  blockNode
                  treeData={orgData}
                  titleRender={renderOrgTitle}
                  expandedKeys={expandedOrgKeys}
                  onExpand={handleOrgExpand}
                  loadedKeys={loadedKeys}
                  loadData={loadData}
                  onSelect={onOrgNodeSelect}
                  multiple
                  selectedKeys={selectedOrgKeys}
                />
              </div>
            </>
          )}
          {visibleGroup ? (
            <>
              <div className={styles.dividerContainer}>
                <Divider />
              </div>
              <div className={classnames(styles.treeContainer, containerClassName)}>
                <Tree
                  blockNode
                  treeData={groupData}
                  expandedKeys={expandedGroupKeys}
                  titleRender={renderGroupTitle}
                  onSelect={onGroupNodeSelect}
                  onExpand={handleGroupExpand}
                  loadedKeys={loadedKeys}
                  loadData={loadGroupData}
                  multiple
                  selectedKeys={selectedOrgKeys}
                />
              </div>
            </>
          ) : (
            ''
          )}
        </div>
      )}
    </div>
  );
});
export default SiriusContact;
