import { ContactModel, EntityOrg, EntityOrgTeamContact, OrgModel } from 'api';
import React, { useEffect, useState } from 'react';
import { Tree, Tooltip, Checkbox } from 'antd';
import { DataNode } from 'antd/lib/tree';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import Avatar from '@web-common/components/UI/Avatar';
import '@web-common/components/UI/SiriusContact/tree/index.scss';
import { getTeamMembers, transContactModel2ContactItem, UIContactModel } from '@web-common/components/util/contact';
import { ContactItem, getContact } from '@web-common/utils/contact_util';
import { useAppSelector } from '@web-common/state/createStore';
import styles from './index.module.scss';
import { getIn18Text } from 'api';

const { TreeNode } = Tree;

export interface ContactTreeDataNode extends DataNode {
  key: string;
  nodeType: 'recent' | 'personal' | 'enterprise' | 'team';
  contact?: ContactModel;
  orgInfo?: EntityOrg;
  orgList?: EntityOrg[];
  checked?: boolean;
  values?: UIContactModel;
  children?: ContactTreeDataNode[];
}

export const updateOrgTreeData = (list: DataNode[] | ContactTreeDataNode[], key: React.Key, children: DataNode[] | ContactTreeDataNode[]): ContactTreeDataNode[] =>
  list.map(node => {
    if (node.key === key) {
      return {
        ...node,
        children: (node.children || []).concat(children),
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateOrgTreeData(node.children, key, children),
      };
    }
    return node;
  });

export interface ContactTreeProp {
  showAddOrgBtn?: boolean;
  multiple?: boolean;
  showAvatar?: boolean;
  // 根组织名称
  enterpriseRootName?: string;
  personalRootName?: string;
  teamRootName?: string;
  // 是否需要checkbox
  showCheckbox?: boolean;
  // 每个组织的高度
  itemHeight?: number;
  // 是否只加载im 需要的组织
  isIM?: boolean;
  disableCheckList?: ContactItem[];
  defaultSelectList?: ContactItem[];
  disableCheckOrgIds?: string[];
  defaultSelectOrgList?: EntityOrg[];

  // 选中联系人的回调函数
  onContactSelect?(selectList: ContactItem[], cur: ContactModel[], isOrgSelected?: boolean): void;

  // TODO：选中组织的回调函数
  onOrgSelect?(org: EntityOrg[]): void;
}

const data2tree = (data: OrgModel) => {
  const treeNode: ContactTreeDataNode = {
    key: data.org.id,
    title: data.org.orgName,
    nodeType: 'enterprise',
    isLeaf: false,
    orgInfo: data.org,
    orgList: data.orgList,
  };
  if (!treeNode.isLeaf && data.children && data.children.length > 0) {
    treeNode.children = data.children.map(data2tree);
  }
  return treeNode;
};

const rootKey = ['-1', 'personalRoot', 'teamRoot'];

const ContactTree: React.FC<ContactTreeProp> = props => {
  const {
    onContactSelect,
    onOrgSelect,
    defaultSelectList,
    disableCheckList,
    defaultSelectOrgList,
    disableCheckOrgIds,
    multiple,
    isIM = true,
    showCheckbox = true,
    itemHeight = 32,
    enterpriseRootName = getIn18Text('QIYETONGXUNLU'),
    showAddOrgBtn = true,
    showAvatar = true,
    personalRootName = getIn18Text('GERENTONGXUNLU'),
    teamRootName = getIn18Text('WODEQUNZU'),
  } = props;
  const [treeData, setTreeData] = useState<ContactTreeDataNode[]>([]);
  const [disableCheckKeys, setDisableCheckKeys] = useState<Array<string | number>>([]);
  const [selectedList, setSelectedList] = useState<ContactItem[]>([]);
  const [selectedOrgList, setSelectedOrgList] = useState<EntityOrg[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Array<string | number>>(isIM ? ['-1'] : []);
  const [loadedKeys, setLoadedKeys] = useState<Array<string | number>>(rootKey);

  const edmOrgData = useAppSelector(state => state.edmUserReducer.orgData);
  const edmOrgIdMap = useAppSelector(state => state.edmUserReducer.orgIds);
  const edmContactIdMap = useAppSelector(state => state.edmUserReducer.contactIds);

  useEffect(() => {
    if (edmOrgData) {
      const tree = [data2tree(edmOrgData)];
      setTreeData(tree);
      console.log('edm org tree', tree);
    } else {
      setTreeData([]);
    }
  }, [edmOrgData]);

  useEffect(() => {
    console.log('tree', treeData);
  }, [treeData]);

  useEffect(() => {
    defaultSelectList && setSelectedList(defaultSelectList);
  }, [defaultSelectList]);

  useEffect(() => {
    disableCheckList && setDisableCheckKeys(disableCheckList.map(item => item.email));
  }, [disableCheckList]);

  useEffect(() => {
    defaultSelectOrgList && setSelectedOrgList(defaultSelectOrgList);
  }, [defaultSelectOrgList]);

  const handleLoadData = async (node: ContactTreeDataNode) => {
    console.log('[tree]', node);
    const { key, orgInfo } = node;
    const isTeam = orgInfo?.type === 2000 || key.includes('team_');
    let data: ContactModel[] = [];
    if (isTeam) {
      const memberList = (await getTeamMembers([key], false)) as EntityOrgTeamContact[];
      memberList.forEach(item => {
        item.model && data.push(item.model);
      });
    } else {
      data = await getContact(`${key}`);
      if (orgInfo && !edmOrgIdMap[orgInfo.originId]) {
        data = data.filter(item => item.contact.accountOriginId !== undefined && edmContactIdMap[item.contact.accountOriginId]);
      }
    }
    const leafList = data.map(item => ({
      key: item.contact.accountName,
      isLeaf: !0,
      title: item.contact.contactName,
      checked: false,
      contact: item,
    }));
    console.log('[tree]', node, leafList, edmContactIdMap);
    const tree = updateOrgTreeData(treeData, `${key}`, leafList);
    setTreeData(tree);
  };

  const handleSelect = async (_: any, info: any) => {
    const node = info.node as ContactTreeDataNode;
    console.log('handleSelect', node);
    if (node.disableCheckbox) {
      return;
    }
    if (node.isLeaf) {
      if (multiple) {
        if (node.contact) {
          const email = node.contact.contact.accountName;
          const list = [...selectedList];
          const index = list.findIndex(item => item.email === email);
          console.warn('selectIndex', index);
          if (index !== -1) {
            list.splice(index, 1);
          } else {
            list.push(transContactModel2ContactItem(node.contact));
          }
          setSelectedList(list);
          onContactSelect && onContactSelect(list, [node.contact]);
        }
      } else {
        node.contact && onContactSelect && onContactSelect([transContactModel2ContactItem(node.contact)], [node.contact]);
      }
    } else {
      const data = [...expandedKeys];
      const index = data.indexOf(node.key);
      if (index !== -1) {
        data.splice(index, 1);
      } else {
        data.push(node.key);
      }
      setExpandedKeys(data);
      const loadData = [...loadedKeys];
      const isLoad = loadData.indexOf(node.key) !== -1;
      if (!isLoad) {
        loadData.push(node.key);
        await handleLoadData(node);
        setLoadedKeys(loadData);
      }
    }
  };

  const handleSelectOrg = async (orgInfo: EntityOrg, isChecked: boolean) => {
    if (isChecked && selectedOrgList.every(i => i.id !== orgInfo.id)) {
      selectedOrgList.push(orgInfo);
      setSelectedOrgList([...selectedOrgList]);
    } else {
      const idx = selectedOrgList.findIndex(i => i.id === orgInfo.id);
      if (idx > -1) {
        selectedOrgList.splice(idx, 1);
        setSelectedOrgList([...selectedOrgList]);
      }
    }
    if (onOrgSelect) {
      onOrgSelect([...selectedOrgList]);
    }
  };

  const renderTitle = (nodeData: ContactTreeDataNode) => {
    const { key, isLeaf, contact, title, orgInfo } = nodeData;
    if (isLeaf) {
      const email = contact?.contact.accountName;
      const checked = selectedList.findIndex(item => item.email === email) !== -1;
      const disabled = disableCheckKeys.includes(email!);
      return (
        <Tooltip title={email} mouseEnterDelay={1}>
          <div className={`contact-tree-leaf-wrap ${showAvatar ? '' : ' no-avatar'}`}>
            {showCheckbox && (
              <div className="tree-leaf-checkbox">
                <Checkbox checked={checked} disabled={disabled} className={styles.checkbox} />
              </div>
            )}
            {showAvatar ? (
              <div className="contact-tree-avatar">
                <Avatar item={contact!} />
              </div>
            ) : (
              <></>
            )}
            <span className="tree-leaf-contact-name sirius-flex-ellipsis-text">{title}</span>
          </div>
        </Tooltip>
      );
    }
    let titleName = title;
    if (enterpriseRootName && key === '-1') {
      titleName = enterpriseRootName;
    } else if (teamRootName && key === 'team') {
      titleName = teamRootName;
    }
    const checked = selectedOrgList.some(item => item.id === orgInfo?.id);
    const showSelect = orgInfo && disableCheckOrgIds ? disableCheckOrgIds.indexOf(orgInfo.id) !== -1 : false;
    return (
      <Tooltip title={titleName} mouseEnterDelay={1}>
        <div className="contact-tree-org-wrap">
          {showSelect && (
            <div className="tree-leaf-checkbox" onClick={e => e.stopPropagation()}>
              <Checkbox checked={checked} onChange={e => handleSelectOrg(orgInfo as EntityOrg, e.target.checked)} />
            </div>
          )}
          <div className="contact-tree-org-title">{titleName}</div>
        </div>
      </Tooltip>
    );
  };
  const renderNode = (data: ContactTreeDataNode, index: number, parent?: ContactTreeDataNode) => {
    console.log('render tree Node', data.title);
    const disableCheckbox = disableCheckKeys.includes(data.key);
    const key = data.isLeaf && parent ? `${parent.key}_${data.key}_${index}` : data.key;
    return (
      <TreeNode
        key={key}
        disableCheckbox={disableCheckbox}
        // @ts-ignore
        contact={data.contact}
        orgInfo={data.orgInfo}
        checkable={data.isLeaf}
        isLeaf={data.isLeaf}
        title={() => renderTitle(data)}
      >
        {data.children?.length && data.children.map((item, i) => renderNode(item, i, data))}
      </TreeNode>
    );
  };
  return (
    <div className="sirius-contact-tree">
      {treeData.length > 0 && (
        <AutoSizer style={{ width: '100%', height: '100%' }}>
          {({ height }) => (
            <div className="contact-tree-enterprise">
              <Tree
                blockNode
                height={height}
                loadedKeys={loadedKeys}
                defaultExpandedKeys={expandedKeys}
                expandedKeys={expandedKeys}
                itemHeight={itemHeight}
                onSelect={handleSelect}
                // onCheck={handleSelect}
                onExpand={handleSelect}
              >
                {treeData.map((item, i) => renderNode(item, i))}
              </Tree>
            </div>
          )}
        </AutoSizer>
      )}
    </div>
  );
};
export default ContactTree;
