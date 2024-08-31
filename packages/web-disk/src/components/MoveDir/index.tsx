import React, { useEffect, useState } from 'react';
import { Tree } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apis, apiHolder as api, NetStorageApi, NSDirContent, NSFileContent, RequestNSFolderContent } from 'api';
import classnames from 'classnames/bind';
import lodashGet from 'lodash/get';
import lodashSet from 'lodash/set';
import { RootInfo, tabInterfaceMap } from '../../disk';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { formatAuthTexts, computeAuthWeight } from '../../utils';
import style from './index.module.scss';
import IconCard, { IconMapKey, iconMap } from '@web-common/components/UI/IconCard';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
interface FolderPathApi extends NSDirContent {
  title: string;
  key: string;
  icon?: React.ReactNode;
  type?: 'private' | 'public';
  children?: FolderPathApi[];
  disabled?: boolean;
}
interface Props {
  rootInfo: RootInfo;
  // 关闭弹窗
  closeModal(boolean): void;
  moveSucc?: (from, to, fromParent) => void;
  // 弹窗展示
  visible: boolean;
  sourceNsContent: NSDirContent | NSFileContent | undefined;
}
export const MoveDirModal: React.FC<Props> = props => {
  const { rootInfo, closeModal, visible, sourceNsContent, moveSucc } = props;
  console.log('[moveDir]props', props);
  const [modalVisible, setModalVisible] = useState<{
    flag: boolean;
    type?: 'confirm' | 'cancel';
  }>({
    flag: visible,
  });
  const [dirTree, setDirTree] = useState<FolderPathApi[]>([]);
  // 比较源dir/file权限和目标dir/file权限
  // 源文件权重要大于目标文件夹权重返回true(可操作) ex:个人空间>企业上传/管理>企业查看/下载
  // 小于目标文件夹权重返回false(不可以操作)
  const compareAuthWeight = (targetDirContent: NSDirContent) => {
    const sourceAuthTexts = lodashGet(sourceNsContent, 'authorityDetail.roleInfos', null);
    const targetAuthText = lodashGet(targetDirContent, 'authorityDetail.roleInfos', null);
    // 与我分享 我分享的  个人网盘分享的内容 （有authorityDetail.roleInfos）一律设为最高权重
    const sourceWeights = sourceNsContent?.bizCode == 'PERSONAL' ? 7 : computeAuthWeight(formatAuthTexts(sourceAuthTexts));
    const targetWeight = computeAuthWeight(formatAuthTexts(targetAuthText));
    const finalyWeight = sourceWeights & targetWeight;
    // 目标权限小于源权限 & 与值!==0
    return finalyWeight === targetWeight && finalyWeight !== 0;
  };
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  // 拉取个人空间/企业空间子目录
  useEffect(() => {
    if (!visible) {
      return;
    }
    const rootDirId = lodashGet(sourceNsContent, 'path', '').split('/')[0] as string;
    const keys = ['public'];
    if (String(rootInfo.private?.id) === rootDirId) {
      keys.unshift('private');
    } else if (sourceNsContent.bizCode === 'PERSONAL') {
      keys.unshift('private');
    }
    // 配置第一层数据
    setDirTree(state => {
      const list: FolderPathApi[] = [];
      keys.forEach((key, index) => {
        if (Reflect.has(rootInfo, key)) {
          const enableMove = compareAuthWeight(rootInfo[key]);
          list.push({
            type: key,
            title: rootInfo[key].dirName || rootInfo[key].name,
            icon({ selected, disabled }) {
              const stroke = selected ? '#FFFFFF' : disabled ? 'rgba(0, 0, 0, 0.25)' : '#3C3F47';
              const type = key === 'public' ? 'publicDisk' : 'privateDisk';
              return <IconCard type={type} stroke={stroke} />;
            },
            key: `[${index}]`,
            hasSubDir: true,
            children: [],
            disabled: !enableMove,
            ...rootInfo[key],
          });
        }
      });
      return list;
    });
    // 异步获取个人空间和企业空间子目录
    // 成功之后展开根空间目录
    // 设置展开目录
    setExpandedKeys(keys.map((item, index) => `[${index}]`));
    Promise.all(
      keys.map(
        (key, index) =>
          rootInfo[key] &&
          requestNSFolder(
            {
              type: tabInterfaceMap[key],
              dirId: rootInfo[key].id,
              needAuthorityInfo: true,
            },
            `[${index}]`
          )
      )
    );
  }, [rootInfo, visible]);
  // 请求文件夹
  const requestNSFolder = async (params: RequestNSFolderContent, path: string) => {
    // dirList 有可能是 null
    const { itemList: dirList } = await diskApi.getDirList(params);
    setDirTree(state => {
      const list = [...state];
      const remainResult = lodashGet(list, path, {});
      // 设置当前目录的hasSubDir(服务端当前返回的hasSubDir是null 没有办法判断)
      lodashSet(list, path, {
        ...remainResult,
        children: dirList?.length
          ? dirList.map((item, index) => {
              const enableMove = compareAuthWeight(item);
              return {
                ...item,
                disabled: !enableMove,
                children: [],
                title: item.name,
                isLeaf: !item.hasSubDir,
                key: `${remainResult.key}.children[${index}]`,
                icon({ selected, disabled }) {
                  const stroke = selected ? '#FFFFFF' : disabled ? 'rgba(0, 0, 0, 0.25)' : '#3C3F47';
                  return <IconCard type="diskMoveFolder" stroke={stroke} />;
                },
              };
            })
          : undefined,
      });
      return list;
    });
    return !!dirList?.length;
  };
  // 异步加载数据
  const onLoadData = async (args: any) => {
    const { key } = args;
    const targetTreeNode = lodashGet(dirTree, key, null);
    if (!targetTreeNode) {
      return Promise.reject();
    }
    const { hasSubDir, children } = targetTreeNode;
    if (hasSubDir === false || (children && children.length)) {
      return Promise.resolve(true);
    }
    const topKey = (key.match(/^\[\d+\]/) as string[])[0];
    const type = lodashGet(dirTree, `${topKey}.type`);
    return requestNSFolder(
      {
        type: tabInterfaceMap[type],
        dirId: targetTreeNode?.id || 0,
        needAuthorityInfo: true,
      },
      key
    );
  };
  const [selectedKeyValue, setSelectedKeyValue] = useState<number>();
  const onSelect = (selectedKeysValue: number[]) => {
    setSelectedKeyValue(lodashGet(dirTree, `${selectedKeysValue[0]}.id`));
  };
  const [submitStatus, setSubmitstatus] = useState<'init' | 'ing' | 'success'>('init');
  const onOK = async () => {
    if (!selectedKeyValue) {
      return Promise.reject();
    }
    // 移动到自身直接忽略
    if (selectedKeyValue === sourceNsContent?.id || 0) {
      return Promise.resolve();
    }
    const params = {
      resourceId: sourceNsContent?.id || 0,
      resourceType: sourceNsContent?.extensionType === 'dir' ? 'DIRECTORY' : 'FILE',
      tarDirId: selectedKeyValue,
    };
    setSubmitstatus('ing');
    try {
      await diskApi.doNSMoveDir(params);
      message.success(getIn18Text('YIDONGWANCHENG'));
      setSubmitstatus('success');
      moveSucc && moveSucc(sourceNsContent?.id || 0, selectedKeyValue, sourceNsContent?.parentId);
      return true;
    } catch (ex) {
      setSubmitstatus('init');
      const { data, status } = ex;
      if ([400, 500].includes(status) && [400, 203201, 202012, 20201].includes(data.code)) {
        const msg = lodashGet(data, 'message', getIn18Text('YIDONGSHIBAI\uFF0C'));
        message.error(msg);
        return Promise.reject();
      }
      message.error(getIn18Text('YIDONGSHIBAI\uFF0C'));
      return Promise.reject();
    }
  };
  if (!dirTree.length) {
    return null;
  }
  return (
    <Modal
      maskClosable={false}
      className={realStyle('moveDirModal')}
      visible={modalVisible.flag}
      afterClose={(...args) => {
        closeModal(modalVisible.type === 'confirm');
      }}
      onCancel={() => {
        setModalVisible({
          flag: false,
          type: 'cancel',
        });
      }}
      okButtonProps={{
        disabled: typeof selectedKeyValue !== 'number',
        loading: submitStatus === 'ing',
      }}
      onOk={async close => {
        await onOK();
        setModalVisible({
          flag: false,
          type: 'confirm',
        });
      }}
      title={
        <>
          <div className={realStyle('modalTitle')}>{getIn18Text('YIDONGZHI')}</div>
          {lodashGet(sourceNsContent, 'authorityDetail.roleInfos', true) !== true && <p className={realStyle('modalTips')}>{getIn18Text('JINKEYIDONGDAO')}</p>}
        </>
      }
      closeIcon={<CloseIcon className="dark-invert" />}
    >
      <div className={`ant-allow-dark ${realStyle('dirTreeWrapper')}`}>
        <Tree
          // expandedKeys={expandedKeys}
          defaultExpandedKeys={expandedKeys}
          className={realStyle('moveDirTree')}
          autoExpandParent
          treeData={dirTree}
          showIcon
          loadData={onLoadData}
          onSelect={onSelect}
          blockNode
          virtual={false}
        />
      </div>
    </Modal>
  );
};
