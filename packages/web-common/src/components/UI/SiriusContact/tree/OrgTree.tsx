import React, { useEffect, useState, useCallback } from 'react';
import { SelectedOrgMap, transEntityOrg2OrgItem } from '@web-common/components/util/contact';
import { api, apis, ContactAndOrgApi, OrgModel } from 'api';
import { OrgItem } from '@web-common/utils/contact_util';
import { useOrgItemEffect } from '../useContactItemEffect';
import styles from './index.module.scss';
import classnames from 'classnames';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { Tooltip, Tree } from 'antd';
import { DataNode } from 'antd/lib/tree';
import Checkbox from '../Checkbox';
import { transTreeName } from './data';

/**
 * 客户树
 * @param props
 * @constructor
 */
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const sysApi = api.getSystemApi();

interface OrgTreeProp {
  // 是否需要checkbox
  showCheckbox?: boolean;
  // 是否展示头像
  //  showAvatar?: boolean;

  // 选中联系人的回调函数
  onContactSelect?(selectList: OrgItem[], cur: OrgItem[]): void;

  // 不可以选择的列表
  disableCheckList?: OrgItem[];
  // 默认选中的列表
  defaultSelectList?: OrgItem[];
  // 是否可以多选
  // multiple?: boolean;
}

interface OrgTreeNode extends DataNode {
  key: string;
  title: string | React.ReactNode;
  isLeaf: boolean;
  data: OrgItem;
  orgList?: OrgItem[];
  children?: OrgTreeNode[];
}

/**
 * 转化企业组织树结构
 * @param data
 */
const transOrgTree = (treeData: OrgModel): OrgTreeNode => {
  const { org, orgList: _orgList, children: _children } = treeData;
  const key = org?.id;
  const isRoot = org?.id === '-1';
  const title = isRoot ? transTreeName('enterprise') : org.orgName;
  const data = transEntityOrg2OrgItem(org);
  const orgList = _orgList?.length ? _orgList.map(transEntityOrg2OrgItem) : [];
  let children: OrgTreeNode[] = [];
  if (!isRoot) {
    children = [
      {
        key,
        title: title + '（本级）',
        data,
        isLeaf: true,
      },
    ];
  }
  children = children.concat((_children || []).map(transOrgTree));
  return {
    key: isRoot ? key : org?.id + '_parent',
    title,
    isLeaf: false,
    data,
    orgList,
    children,
  };
};

/**
 * 账号树
 * @param props
 * @constructor
 */
const OrgTree: React.FC<OrgTreeProp> = props => {
  const {
    onContactSelect,
    defaultSelectList = [],
    disableCheckList: defaultDisableCheckList,
    // multiple,
    // showAvatar,
    showCheckbox = true,
  } = props;

  // 企业组织的数据集合
  const [treeData, setTreeData] = useState<OrgTreeNode[]>([]);
  // 多选情况下已经选中的联系人集合
  const [selectedMap, setSelectedMap] = useState<SelectedOrgMap>(new Map());
  // 多选情况下不可选中的联系人集合
  const [disabledMap, setDisabledMap] = useState<SelectedOrgMap>(new Map());

  /**
   * 获取企业通讯录数据
   */
  const initEnterprise = useCallback(async () => {
    try {
      const orgData = await contactApi.doGetContactOrg({ _account: sysApi.getCurrentUser()?.id });
      if (orgData.org.id) {
        setTreeData([transOrgTree(orgData)]);
      } else {
        setTreeData([]);
      }
      console.warn('[contact_tree] load initEnterprise finish', orgData);
    } catch (e) {
      console.error('[contact_tree] load initEnterprise error');
    }
  }, []);

  /**
   * 初始化数据
   */
  useEffect(() => {
    initEnterprise();
  }, []);

  /**
   * 处理默认选中的联系人
   */
  useOrgItemEffect(defaultSelectList, () => {
    const itemMap = new Map();
    defaultSelectList.forEach(item => {
      const key = item.id;
      itemMap.set(key, item);
    });
    setSelectedMap(itemMap);
  });

  /**
   * 处理默认不能选中的联系人
   */
  useEffect(() => {
    if (defaultDisableCheckList?.length) {
      const itemMap = new Map();
      defaultDisableCheckList.forEach(item => {
        const key = item.id;
        itemMap.set(key, item);
      });
      setDisabledMap(itemMap);
    }
  }, [defaultDisableCheckList]);

  /**
   * 选中组织
   * @param dataNode
   */
  const handleSelectOrg = useCallback(
    async (dataNode: OrgTreeNode, checked?: boolean) => {
      const { key, data, isLeaf, orgList } = dataNode;
      if (isLeaf) {
        if (checked) {
          selectedMap.delete(key);
        } else {
          selectedMap.set(key, data);
        }
      } else if (orgList) {
        orgList.forEach(item => {
          if (checked) {
            selectedMap.delete(item.id);
          } else {
            selectedMap.set(item.id, item);
          }
        });
      }
      setSelectedMap(selectedMap);
      onContactSelect && onContactSelect([...selectedMap.values()], [data]);
    },
    [selectedMap]
  );

  /**
   * 渲染子节点
   */
  const renderNode = useCallback(
    (item: OrgTreeNode) => {
      const { title, key, isLeaf, orgList } = item;
      let checked = false;
      if (isLeaf) {
        checked = selectedMap.has(key);
      } else if (orgList) {
        checked = orgList.every(org => selectedMap.has(org.id));
      }
      const disabled = disabledMap.has(key);
      const isRoot = key === '-1';
      return (
        <>
          <span className={styles.leafWrapContainer}>
            <Tooltip title={title} mouseEnterDelay={1}>
              <div className={classnames(styles.contactTreeLeafWrap, styles.contactTreeNode)}>
                {showCheckbox && !isRoot && (
                  <div
                    className={classnames(styles.treeLeafCheckbox, styles.orgTreeLeafCheckbox)}
                    onClick={() => {
                      handleSelectOrg(item, checked);
                    }}
                  >
                    <Checkbox checked={checked} disabled={disabled} />
                  </div>
                )}
                {/* {showAvatar ? (<div className={styles.contactTreeAvatar}></div>) : <></>} */}
                <span className="sirius-flex-ellipsis-text">{title}</span>
              </div>
            </Tooltip>
          </span>
        </>
      );
    },
    [selectedMap, disabledMap]
  );

  return (
    <div className={styles.treeWrap}>
      <AutoSizer style={{ width: '100%', height: '100%' }}>
        {({ height }) => {
          return (
            <div className={styles.ContactOrgTree}>
              <Tree
                blockNode
                defaultExpandedKeys={['-1']}
                height={height}
                treeData={treeData}
                // onSelect={(_, data) => {handleSelectOrg(data.node as unknown as OrgTreeNode)}}
                titleRender={data => renderNode(data as unknown as OrgTreeNode)}
              />
            </div>
          );
        }}
      </AutoSizer>
    </div>
  );
};
export default OrgTree;
