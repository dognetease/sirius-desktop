import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Modal, Button, Menu } from 'antd';
import { TreeProps } from 'antd/lib/tree';
import { MailBoxModel } from 'api';
import useState2RM from '../../hooks/useState2ReduxMock';
import './FolderMoveModal.scss';
import {
  getParentNodeById,
  getTreeIdPathById,
  getTreeNodeById,
  folderId2String,
  folderId2Number,
  getChildTreeByRule,
  getTreeStatesByAccount,
  folderIdIsContact,
} from '../../util';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { useAppDispatch } from '@web-common/state/createStore';
import { ModalCloseSmall } from '@web-common/components/UI/Icons/icons';
import { validateFolderOperForNode } from '../../state/customize';
import FolderTree, { ExportFolderRefProps } from '../ColumnMailBox/FolderTree';
import { FLOLDER } from '@web-mail/common/constant';
import { getIn18Text } from 'api';

// 获取可以显示的文件夹 - 屏蔽虚拟文件夹-屏蔽当前正在移动的文件夹
const getMoveFolderTree = (tree: MailBoxModel[]): MailBoxModel[] => {
  if (tree) {
    return getChildTreeByRule<MailBoxModel>(tree, (node: MailBoxModel) => {
      if (node && (folderIdIsContact(node.entry.mailBoxId) || node.entry.mailBoxId < 0)) {
        return false;
      }
      return true;
    }) as MailBoxModel[];
  }
  return [];
};

/**
 * 弹窗配置
 */
const MenuConfig = {
  title: getIn18Text('YIDONGZHI'),
  width: '600px',
  wrapClassName: 'folder-move-modal-warp',
  style: {
    maxHeight: '480px',
  },
};

const defaultEmptyArray: any[] = [];

const FolderMoveModal: React.FC<any> = () => {
  const dispatch = useAppDispatch();
  /**
   * State
   */
  // 邮件文件夹相关状态map
  const [mailTreeStateMap, setTreeState] = useState2RM('mailTreeStateMap', 'doUpdateMailTreeState');
  // 邮件列表-文件夹-树形结构-list
  const [folderMoveId] = useState2RM('folderMoveId', 'doUpdateFolderMoveId');
  // 弹窗是否显示
  const [folderModveModalVisiable, setFolderModveModalVisiable] = useState2RM('folderModveModalVisiable', 'doUpdateFolderModveModalVisiable');
  // tree展开的key列表
  const [expandedMenuKeys, setExpandedMenuKeys] = useState<any[]>([]);
  // tree选中的key列表
  const [selectedMenuKeys, setSelectedMenuKeys] = useState<TreeProps['selectedKeys']>([]);
  // 弹窗确认按钮loading
  const [okBtnLoading, setOkBtnLoading] = useState<boolean>(false);
  // 文件移动弹窗-tree-ref
  const folderMoveModalTree = useRef<ExportFolderRefProps>();
  // 弹窗初始化-选中的文件夹
  const [defaultFolder, setDefaultFolder] = useState<number | null>(null);

  // 主账号的文件夹tree
  const treeList = useMemo(() => {
    const treeState = getTreeStatesByAccount(mailTreeStateMap, folderMoveId?.accountId);
    return treeState?.mailFolderTreeList || [];
  }, [mailTreeStateMap, folderMoveId]);

  // 缓存内部使用的treeList
  const modalTreeList: MailBoxModel[] = useMemo(() => {
    return getMoveFolderTree(treeList || []);
  }, [treeList]);

  /**
   * Mothed
   */

  // 文件夹选中
  const handleNodeSelect = useCallback((node: MailBoxModel) => {
    const key = node.entry.mailBoxId;
    setSelectedMenuKeys([key]);
  }, []);

  // 确认
  const handleOkBtnClick = useCallback(() => {
    if (selectedMenuKeys && selectedMenuKeys.length) {
      const aimNode = getTreeNodeById(treeList, parseInt(selectedMenuKeys[0]));
      const moveNode = getTreeNodeById(treeList, folderMoveId?.folderId);
      if (validateFolderOperForNode(treeList, aimNode, moveNode, false, 1)) {
        setOkBtnLoading(true);
        dispatch(
          Thunks.moveUserFolder([
            {
              id: folderMoveId?.folderId,
              parent: selectedMenuKeys[0],
              accountId: folderMoveId.accountId,
            },
          ])
        )
          .unwrap()
          .then(() => {
            Message.success({
              content: getIn18Text('YIDONGCHENGGONG'),
            });
            setFolderModveModalVisiable(false);
          })
          .finally(() => {
            setOkBtnLoading(false);
          });
      }
    }
  }, [selectedMenuKeys, treeList, folderMoveId]);

  // 取消
  const handleClacleBtnClick = useCallback(() => {
    setFolderModveModalVisiable(false);
    setExpandedMenuKeys([]);
    setSelectedMenuKeys([]);
  }, []);

  // 新建文件夹
  const handleAddFolder = useCallback(() => {
    const folderId = selectedMenuKeys && selectedMenuKeys[0];
    folderMoveModalTree?.current?.addFolder(folderId);
  }, [selectedMenuKeys]);

  // 处理文件夹树的展开
  const handleExpand = useCallback(
    keys => {
      setExpandedMenuKeys(folderId2Number(keys));
    },
    [setExpandedMenuKeys]
  );

  // 处理弹出的右键菜单
  const handleMenu = useCallback(data => {
    if (data) {
      return folderMenu(data);
    }
    return <></>;
  }, []);

  // 处理文件夹的添加事件
  const handleOnAddFolder = useCallback(data => {
    return dispatch(
      Thunks.createUserFolder([
        {
          parent: data.entry.pid,
          name: data.entry.mailBoxName,
          accountId: data?._account,
        },
      ])
    )
      .unwrap()
      .then(() => true);
  }, []);

  // 处理文件夹的更新
  const handleUpdateFolder = useCallback(
    data => {
      return dispatch(
        Thunks.updateUserFolder([
          {
            id: data.entry.mailBoxId,
            parent: data.entry.pid,
            name: data.entry.mailBoxName,
          },
        ])
      ).unwrap();
    },
    [dispatch]
  );

  /**
   * 弹窗页脚-Element
   */
  const ModalFooter = useMemo(
    () => (
      <div className="folder-move-modal-footer">
        <div className="fmmf-left">
          <Button type="text" className="no-border" onClick={handleAddFolder} style={{ color: 'rgba(56, 110, 231, 1)' }} disabled={okBtnLoading}>
            {getIn18Text('XINJIANWENJIANJIA')}
          </Button>
        </div>
        <div className="fmmf-right">
          <Button onClick={handleClacleBtnClick}>{getIn18Text('QUXIAO')}</Button>
          <Button type="primary" loading={okBtnLoading} disabled={selectedMenuKeys?.length && defaultFolder === selectedMenuKeys[0]} onClick={handleOkBtnClick}>
            {getIn18Text('QUEDING')}
          </Button>
        </div>
      </div>
    ),
    [handleAddFolder, okBtnLoading, handleClacleBtnClick, okBtnLoading, selectedMenuKeys, defaultFolder, handleOkBtnClick]
  );

  /**
   * 渲染当前文件夹的操作按钮
   */
  const folderMenu = useCallback((node: MailBoxModel) => {
    return (
      <Menu>
        <Menu.Item
          key="2"
          onClick={() => {
            folderMoveModalTree?.current?.updateFolder();
          }}
        >
          {getIn18Text('ZHONGMINGMING')}
        </Menu.Item>
      </Menu>
    );
  }, []);

  /**
   * useEffect
   */
  // 根据当前移动的文件夹设置tree的展示和选中状态
  useEffect(() => {
    // 当前文件夹的父级文件夹处于选中状态
    // 如果pid为0，指向更多文件夹
    if (treeList) {
      const parentNdoe = getParentNodeById(treeList, folderMoveId?.folderId);
      const curNode = getTreeNodeById(treeList, folderMoveId?.folderId) as MailBoxModel;
      if (parentNdoe && curNode && curNode.entry && curNode.entry._deep && curNode.entry._deep > 1) {
        setSelectedMenuKeys([parentNdoe.entry.mailBoxId]);
        /**
         *  弹窗出现的时候保存默认文件夹,与操作后的文件夹进行判断,以决定确定按钮是否可点击
         * 如果是外部文件夹-则不做拦截
         */
        setDefaultFolder(parentNdoe.entry.mailBoxId);
      } else {
        // 如果是外部文件夹，将选中设置为根节点
        setSelectedMenuKeys([0]);
        setDefaultFolder(null);
      }
      // 当前选中目录到根节点全部展开
      const nodePath = getTreeIdPathById(treeList, folderMoveId?.folderId);
      if (nodePath) {
        setExpandedMenuKeys(nodePath.map(item => item));
      }
    }
  }, [folderMoveId, treeList]);

  // 弹窗关闭的时候清理数据
  useEffect(() => {
    if (!folderModveModalVisiable) {
      setDefaultFolder(null);
    }
  }, [folderModveModalVisiable]);

  return (
    <Modal
      {...MenuConfig}
      visible={folderModveModalVisiable}
      okText={getIn18Text('QUEDING')}
      cancelText={getIn18Text('QUXIAO')}
      maskClosable={false}
      closeIcon={<ModalCloseSmall />}
      onCancel={() => setFolderModveModalVisiable(false)}
      footer={ModalFooter}
    >
      <div className=" m-tree-container m-move-tree foldermove-content-modal-warp">
        <FolderTree
          ref={folderMoveModalTree}
          editAble={true}
          selectedKey={selectedMenuKeys ? selectedMenuKeys[0] : defaultEmptyArray}
          onExpand={handleExpand}
          expandedKeys={folderId2String(expandedMenuKeys)}
          data={modalTreeList}
          onSelect={handleNodeSelect}
          height={370}
          unReadRender={() => <></>}
          menu={handleMenu}
          onAddFolder={handleOnAddFolder}
          onUpdateFolder={handleUpdateFolder}
        ></FolderTree>
      </div>
    </Modal>
  );
};
export default FolderMoveModal;
