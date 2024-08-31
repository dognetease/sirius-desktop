/**
 *  搜索结果结构
 *  文件夹/发件人/时间范围/有无附件/阅读状态
 *  展开收起/点击筛选逻辑
 */
import React, { useState, useMemo } from 'react';
import { Tooltip } from 'antd';
import lodashGet from 'lodash/get';
import { MailBoxModel, EntityMailBox, FolderTreeEditState, StatResultItem, StatResult } from 'api';
import { throttle, isObject } from 'lodash';
import IconCard from '@web-common/components/UI/IconCard';
import { folderId2String, folderId2Number } from '../../util';
import { FLOLDER } from '../../common/constant';
import useState2RM from '../../hooks/useState2ReduxMock';
import Tree from '../../common/library/Tree';
import useThrottleForEvent from '../../hooks/useThrottleForEvent';

interface dataList {
  key: string;
  name: string;
  item: MailBoxModel[];
}

interface SearchResultTreeProps {
  data: dataList[];
  email: string;
  handleSwitchFolder: (folder: MailBoxModel) => void;
  expandFolder: (keys: number[]) => void;
}

const SearchResultTree: React.FC<SearchResultTreeProps> = props => {
  const { data, email, handleSwitchFolder, expandFolder } = props;
  // 全部展开的树
  const [showDataKeys, setShowDataKeys] = useState<string[]>([]);
  // 搜索列表-最新选中的key
  const [selectedSearchKeys, setSelectedSearchKeys] = useState2RM('selectedSearchKeys', 'doUpdateSelectedSearchKey');
  // 搜索列表-选中的文件夹包含的所有id
  const [mailSearchFolderIds, setMailSearchFolderIds] = useState2RM('mailSearchFolderIds', 'doUpdateMailSearchFolderIds');
  // 搜索-非文件夹-默认选中的key，因为是动态的所以要设置一下
  const [defaultSelectedSearchKeyMap, doUpdateDefaultSelectedSearchKeyMap] = useState2RM('defaultSelectedSearchKeyMap', 'doUpdateDefaultSelectedSearchKeyMap');
  // 搜索-文件夹树-展开的key
  const [expandedSearchKeys, setExpandedSearchKeys] = useState2RM('expandedSearchKeys', 'doUpdateExpandedSearchKeys');
  const renderSearchTreeNodeTitle = (node: EntityMailBox, innerExpandedKeys: string[]) => {
    const showName = node?._state == FolderTreeEditState.DEFAULT || !node?._state;
    return (
      <Tooltip title={showName ? node.mailBoxName : ''} placement="bottom">
        <div className="tree-content-warp">
          {
            // 增加folderModveModalVisiable 作为判断条件，解决弹窗与tree中的input焦点竞争问题
            showName ? <span className="u-foldername">{node.mailBoxName}</span> : ''
          }
          <span className="u-unread">
            {(
              node.mailBoxId == FLOLDER.DRAFT
                ? node.mailBoxTotal
                : node.mailBoxId == FLOLDER.REDFLAG || node.mailBoxId == FLOLDER.DELETED || node.mailBoxId == FLOLDER.SPAM
                ? '0'
                : innerExpandedKeys.indexOf(node.mailBoxId) > -1
            )
              ? node.mailBoxCurrentUnread
                ? node.mailBoxCurrentUnread
                : '0'
              : node.mailBoxUnread
              ? node.mailBoxUnread
              : '0'}
          </span>
        </div>
      </Tooltip>
    );
  };

  const renderSearchStatsNodeTitle = (node: StatResult) => (
    <Tooltip title={node.label} placement="bottom">
      <div className="tree-content-warp">
        <span className="u-foldername">{node.label}</span>
        <span className="u-unread">{node.value}</span>
      </div>
    </Tooltip>
  );

  // 渲染搜索结果文件夹树的节点
  const renderSearchTreeData = (data: MailBoxModel[], keys: string[], searchTree: boolean = false) =>
    data
      .map(item => {
        const hideNode = searchTree && lodashGet(item, 'entry.mailBoxUnread', 0) === 0;
        return hideNode
          ? null
          : {
              title: () => renderSearchTreeNodeTitle(item.entry, keys),
              key: folderId2String(item.entry?.mailBoxId),
              nodeData: item,
              children: item.children && item.children.length ? renderSearchTreeData(item.children, keys, searchTree) : [],
            };
      })
      .filter(item => item);

  // 渲染搜索结果其他对象
  const renderSearchStatsData = (data: Record<string, StatResultItem>, parentKey: string) => {
    const result = [];
    let lastestData: Record<string, StatResultItem> = {};
    // 发件人按照a-z排序
    if (parentKey === 'fromAddress') {
      data.all && (lastestData.all = data.all);
      const values = Object.values(data);
      values.sort((a, b) => {
        const aSort = a.contactLabel || 'Z';
        const bSort = b.contactLabel || 'Z';
        if (aSort < bSort) {
          return -1;
        }
        if (aSort > bSort) {
          return 1;
        }
        return 0;
      });
      values.forEach(item => {
        lastestData[item.filterCond?.operand] = item;
      });
    } else {
      lastestData = data;
    }
    for (const key in lastestData) {
      result.push({
        title: renderSearchStatsNodeTitle(lastestData[key]),
        key,
        nodeData: lastestData[key],
        children: [],
      });
    }
    return result;
  };

  const handleShowDataKeys = (key: string) => {
    const lastestShowDataKeys = [...showDataKeys];
    lastestShowDataKeys.push(key);
    setShowDataKeys(lastestShowDataKeys);
  };
  const handleHideDataKeys = (key: string) => {
    const lastestShowDataKeys = [...showDataKeys];
    const pos = lastestShowDataKeys.indexOf(key);
    if (pos > -1) {
      lastestShowDataKeys.splice(pos, 1);
      setShowDataKeys(lastestShowDataKeys);
    }
  };

  // 计算文件夹下所有子文件夹id的集合
  const countFolderIds = (list: MailBoxModel[]) => {
    // 扁平化一下
    const data = [...list];
    const resFlat: MailBoxModel[] = [];
    while (data.length) {
      const cur = data.shift();
      if (!cur) continue;
      if (cur.children?.length) {
        data.push(...cur.children);
      }
      resFlat.push(cur);
    }
    return resFlat.map(item => item.mailBoxId);
  };

  const switchFolder = useThrottleForEvent(
    (node: MailBoxModel, isFolder: boolean, itemKey: string) => {
      const nodeKey = (isFolder ? folderId2Number(node.key) : node.key) + '';
      // 重复点击相同按钮不发起新请求
      let equal = false;
      const clickItem =
        (selectedSearchKeys[email] && selectedSearchKeys[email][itemKey]) || (defaultSelectedSearchKeyMap[email] && defaultSelectedSearchKeyMap[email][itemKey]);
      if (isObject(clickItem?.operand)) {
        equal = nodeKey === Object.values(clickItem.operand)[0] + '';
      } else if (nodeKey === clickItem || nodeKey === clickItem?.operand) {
        equal = true;
      }
      if (equal) {
        return;
      }
      const nodeData = node?.nodeData;
      // 更新选中条件
      const filterCond = nodeData?.filterCond;
      setSelectedSearchKeys({
        ...selectedSearchKeys,
        [email]: {
          ...selectedSearchKeys[email],
          [itemKey]: filterCond ? { ...filterCond } : nodeKey,
        },
      });
      // 如果选中文件夹，如果有子文件夹，更新mailSearchFolderIds，没有置空\
      if (nodeData?.entry && lodashGet(nodeData, 'children.length', 0) > 0) {
        const ids = countFolderIds(nodeData.children);
        setMailSearchFolderIds(ids);
      } else if (nodeData?.entry) {
        setMailSearchFolderIds([]);
      }
      handleSwitchFolder(nodeData);
    },
    500,
    {
      leading: true,
      trailing: false,
    }
  );

  return (
    <div className="search-result-tree-wrap">
      {data.map(item => {
        let treeData = [];
        const itemKey = item.key;
        const isFolder = itemKey === 'folder';
        if (isFolder) {
          treeData = renderSearchTreeData(item.item, expandedSearchKeys, true);
        } else {
          treeData = renderSearchStatsData(item.item, itemKey);
        }
        const defaultShowData = treeData.slice(0, 6);
        const defaultHideData = treeData.slice(6);
        const existHideData = defaultHideData.length > 0;
        // 选中态取当前选中，没有的话就是默认选中
        let currentSelect = selectedSearchKeys[email] && selectedSearchKeys[email][itemKey];
        if (itemKey !== 'folder' && isObject(currentSelect?.operand)) {
          currentSelect = Object.values(currentSelect.operand)[0] + '';
        } else if (itemKey !== 'folder') {
          currentSelect = currentSelect?.operand;
        }
        currentSelect = currentSelect || (defaultSelectedSearchKeyMap[email] && defaultSelectedSearchKeyMap[email][itemKey]);
        if (currentSelect && itemKey === 'sentDate') {
          try {
            currentSelect = currentSelect.replace(/[:]+/g, '');
          } catch (e) {
            console.error('[Error reg]', e);
          }
        }
        const selectedKeys = currentSelect ? [currentSelect] : [];
        const expandedSearchStrKeys = expandedSearchKeys.map((item: number) => item + '');
        return (
          <div className="search-result-tree-item">
            <p className="search-result-tree-name">{item.name}</p>
            <Tree
              // showIcon
              defaultExpandedKeys={['-2']}
              onSelect={(_, { node }) => switchFolder(node, isFolder, itemKey)}
              onExpand={expandFolder}
              expandedKeys={expandedSearchStrKeys}
              selectedKeys={selectedKeys}
              blockNode
              treeData={defaultShowData}
            />
            {showDataKeys.includes(itemKey) && (
              <Tree
                // showIcon
                onSelect={(_, { node }) => switchFolder(node, isFolder, itemKey)}
                onExpand={expandFolder}
                selectedKeys={selectedKeys}
                expandedKeys={expandedSearchStrKeys}
                blockNode
                treeData={defaultHideData}
              />
            )}
            {existHideData && !showDataKeys.includes(itemKey) ? (
              <p className="search-result-tree-more" onClick={() => handleShowDataKeys(itemKey)}>
                更多
                <IconCard type="arrowDown" />
              </p>
            ) : (
              ''
            )}
            {existHideData && showDataKeys.includes(itemKey) ? (
              <p className="search-result-tree-pack" onClick={() => handleHideDataKeys(itemKey)}>
                收起
                <IconCard type="arrowUp" />
              </p>
            ) : (
              ''
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SearchResultTree;
