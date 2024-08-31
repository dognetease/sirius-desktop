import React, { useEffect, useState, useCallback } from 'react';
import { Tree } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { apis, apiHolder as api, NetStorageApi, RecoverDir, RequestRecoverDirParams, NetStorageType } from 'api';
import classnames from 'classnames/bind';
import lodashGet from 'lodash/get';
import lodashSet from 'lodash/set';
import { RootInfo, tabInterfaceMap } from '../../disk';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { formatAuthTexts, computeAuthWeight } from '../../utils';
import style from './recoverModal.module.scss';
import IconCard, { IconMapKey, iconMap } from '@web-common/components/UI/IconCard';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
const diskApi = api.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const tag = '[recoverModal]';
interface FolderPathApi {
  title: string;
  key: string;
  icon?: React.ReactNode;
  type: string; // 'ent' | 'personal'
  children?: FolderPathApi[];
  disabled?: boolean;
}
interface Props {
  type: string;
  recordId: number;
  // 关闭弹窗
  closeModal(boolean): void;
  // 弹窗展示
  visible: boolean;
}
export const RecoverModal: React.FC<Props> = props => {
  const { closeModal, visible, recordId, type = 'ent' } = props;
  console.log('[recoverModal]props', props);
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
  const compareAuthWeight = (targetDirContent: RecoverDir) => {
    const targetAuthText = lodashGet(targetDirContent, 'authorityDetail.roleInfos', null);
    const targetWeight = computeAuthWeight(formatAuthTexts(targetAuthText));
    return targetWeight >= 1;
  };
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  // 拉取个人空间/企业空间子目录
  useEffect(() => {
    if (!visible) {
      return;
    }
    // const rootDirId = -1;
    // 配置第一层数据
    setDirTree(state => {
      const list: FolderPathApi[] = [];
      list.push({
        type,
        title: getIn18Text('QIYEKONGJIAN'),
        icon({ selected, disabled }) {
          const stroke = selected ? '#FFFFFF' : disabled ? 'rgba(0, 0, 0, 0.25)' : '#3C3F47';
          const type = 'publicDisk';
          return <IconCard type={type} stroke={stroke} />;
        },
        key: '[0]',
        children: [],
        disabled: false,
      });
      return list;
    });
    setModalVisible({
      flag: visible,
    });
    setExpandedKeys(['[0]']);
    requestNSFolder({ type, parentDirId: -1 }, '[0]');
  }, [recordId, visible]);
  // 请求文件夹
  const requestNSFolder = async (params: RequestRecoverDirParams, path: string) => {
    const { list: dirList } = await diskApi.getRecoverDirs(params);
    setDirTree(state => {
      const list = [...state];
      const remainResult = lodashGet(list, path, {});
      // 设置当前目录的hasSubDir(服务端当前返回的hasSubDir是null 没有办法判断)
      lodashSet(list, path, {
        ...remainResult,
        children:
          dirList && dirList?.length
            ? dirList.map((item, index) => {
                const enableMove = compareAuthWeight(item);
                return {
                  ...item,
                  disabled: !enableMove,
                  children: [],
                  title: item.name,
                  isLeaf: !item.hasSub,
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
    return !!dirList?.length ? Promise.resolve() : Promise.reject();
  };
  // 异步加载数据
  const onLoadData = async (args: any) => {
    const { key } = args;
    const targetTreeNode = lodashGet(dirTree, key, null);
    console.log(tag, targetTreeNode);
    if (!targetTreeNode) {
      return Promise.reject();
    }
    const { hasSub, children } = targetTreeNode;
    if (hasSub === false || (children && children.length)) {
      // lodashSet()
      return Promise.resolve();
    }
    return await requestNSFolder(
      {
        type,
        parentDirId: targetTreeNode?.id || -1,
      },
      key
    );
  };
  const [selectedKeyValue, setSelectedKeyValue] = useState<number>();
  const onSelect = selectedKeysValue => {
    setSelectedKeyValue(lodashGet(dirTree, `${selectedKeysValue[0]}.id`));
  };
  const [submitStatus, setSubmitstatus] = useState<'init' | 'ing' | 'success'>('init');
  const onOK = async () => {
    if (!selectedKeyValue) {
      return Promise.reject();
    }
    // 移动到自身直接忽略
    // if (selectedKeyValue === sourceNsContent?.id || 0) {
    //   return Promise.resolve();
    // }
    const params = {
      type: type as NetStorageType,
      recordId,
      targetDirId: selectedKeyValue,
    };
    setSubmitstatus('ing');
    try {
      await diskApi.recoverRecords(params);
      message.success(getIn18Text('HUIFUCHENGGONG'));
      setSubmitstatus('success');
      return true;
    } catch (ex) {
      setSubmitstatus('init');
      const { data, status } = ex as any;
      if ([400, 500].includes(status) && [400, 203201, 202012, 20201].includes(data.code)) {
        const msg = lodashGet(data, 'message', getIn18Text('HUIFUSHIBAI\uFF0C'));
        message.error(msg);
        return Promise.reject();
      }
      message.error(getIn18Text('HUIFUSHIBAI\uFF0C'));
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
      okText={getIn18Text('HUIFU11')}
      onOk={async close => {
        await onOK();
        setModalVisible({
          flag: false,
          type: 'confirm',
        });
      }}
      title={
        <>
          <div className={realStyle('modalTitle')}>{getIn18Text('HUIFUZHI')}</div>
          <p className={realStyle('modalTips')}>{getIn18Text('JINKEHUIFUDAO')}</p>
        </>
      }
      closeIcon={<CloseIcon className="dark-invert" />}
    >
      <div className={realStyle('dirTreeWrapper')}>
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
