import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Modal } from 'antd';
import { UserItemInfo, api, apis, InsertWhatsAppApi, AddChannelQuotaReqItem, UpdateChannelQuotaReqItem, UpdateChannelQuotaReq, ModeType } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { UserCheckItemInfo, AllotModalType } from '@/components/Layout/EnterpriseSetting/whatsAppAccountManage/types';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import styles from './style.module.scss';
import SubCheckItem from '../subCheckItem';
import SubAllotItem from '../subAllotItem';
import { useAppSelector } from '@web-common/state/createStore';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface Props {
  allotModalType: AllotModalType;
  quota: number;
  accountId: number;
  subList: UserItemInfo[];
  onModalClose: (refresh: boolean) => void;
}

const STR_SEP = '-@-';

const AllotModal: React.FC<Props> = ({ allotModalType, onModalClose, quota, subList, accountId }) => {
  // 带有选择状态的下属列表
  const [subCheckList, setSubCheckList] = useState<UserCheckItemInfo[]>([]);
  // 下属列表中间缓存状态，避免重渲染
  const subListStrMemo = subList.map(v => v.accId).join(STR_SEP);
  const modeType = useAppSelector(state => state.globalReducer.waModeType);

  // 已分配个数
  const allotNum = subCheckList.reduce((t, v) => {
    t += v.allotNum;
    return t;
  }, 0);
  const visible = allotModalType !== '';
  const modelTitle = useMemo(() => {
    if (allotModalType === 'add') {
      return '添加成员';
    }
    if (allotModalType === 'reassign') {
      return '重新分配';
    }
    return '';
  }, [allotModalType]);
  // 剩余额度个数
  const leftQuota = useMemo(() => Math.max(0, quota - allotNum), [quota, allotNum]);
  // 多选状态禁用
  const checkDisabled = useMemo(() => leftQuota <= 0, [leftQuota]);
  // 已进行分配的下属列表
  const subAllotList = subCheckList.filter(v => v.checked);

  const refresh = useRef(false);

  const initSubCheckList = () => {
    const newList: UserCheckItemInfo[] = subList.map(v => ({
      ...v,
      checked: false,
      allotNum: 0,
    }));
    setSubCheckList(newList);
    refresh.current = false;
  };

  const onClose = () => {
    onModalClose(refresh.current);
    initSubCheckList();
  };

  const onAllotNumChange = (num: number, accId: number) => {
    const newList = subCheckList.map(v => ({
      ...v,
      allotNum: v.accId === accId ? num : v.allotNum,
    }));
    setSubCheckList(newList);
  };

  const onChecked = (checked: boolean, accId: number) => {
    const newList = subCheckList.map(v => {
      if (v.accId === accId) {
        return {
          ...v,
          checked,
          allotNum: checked ? 1 : 0,
        };
      }
      return v;
    });
    setSubCheckList(newList);
  };

  const onConfirm = () => {
    refresh.current = true;
    // 添加
    if (allotModalType === 'add') {
      const quotas: AddChannelQuotaReqItem[] = subAllotList.map(v => ({
        accountId: v.accId,
        quota: v.allotNum,
      }));
      whatsAppApi
        .addChannelQuota({ quotas })
        .then(() => {
          Toast.success('添加成功');
          trackApi.track('personal__WA_account_management__allocation', {
            result: 'success',
            type: 'add',
          });
          onClose();
        })
        .catch(() => {
          trackApi.track('personal__WA_account_management__allocation', {
            result: 'fail',
            type: 'add',
          });
        });
      return;
    }
    // 重新分配
    if (allotModalType === 'reassign') {
      const quotas: UpdateChannelQuotaReqItem[] = subAllotList.map(v => ({
        accountId: v.accId,
        quota: v.allotNum,
      }));
      const params: UpdateChannelQuotaReq = {
        quotas,
        accountId,
      };
      whatsAppApi
        .updateChannelQuota(params)
        .then(() => {
          Toast.success('重新分配成功');
          trackApi.track('personal__WA_account_management__allocation', {
            result: 'success',
            type: 'reassign',
          });
          onClose();
        })
        .catch(() => {
          trackApi.track('personal__WA_account_management__allocation', {
            result: 'fail',
            type: 'reassign',
          });
        });
    }
  };

  // 初始化
  useEffect(() => {
    initSubCheckList();
  }, [subListStrMemo]);

  return (
    <Modal
      visible={visible}
      width={685}
      closeIcon={<CloseIcon className="dark-invert" />}
      onCancel={() => onClose()}
      footer={null}
      bodyStyle={{ padding: '20px' }}
      maskClosable={false}
      maskStyle={{ left: 0 }}
      centered
    >
      <div className={styles.container}>
        <div className={styles.title}>{modelTitle}</div>
        {modeType !== ModeType.limit && (
          <div className={styles.intro}>
            <span>还可以绑定</span>
            <span>{leftQuota}</span>
            <span>个WhatsApp账号</span>
          </div>
        )}
        <div className={styles.contentBox}>
          <div className={styles.content}>
            <p className={styles.contentTitle}>业务员</p>
            <div className={styles.list}>
              {subCheckList.map(user => (
                <SubCheckItem key={user.accId} user={user} onChecked={onChecked} disabled={modeType !== ModeType.limit && checkDisabled} />
              ))}
            </div>
          </div>
          <div className={styles.sep} />
          <div className={styles.allotContent}>
            <p className={styles.contentTitle}>
              <span>绑定数量分配{modeType !== ModeType.limit ? `(总共: ${quota}个)` : ''}</span>
              {modeType !== ModeType.limit && (
                <span className={styles.contentSubtitle}>
                  已分配{allotNum}个, 还剩{leftQuota}个
                </span>
              )}
            </p>
            <div className={styles.list}>
              {subAllotList.map(user => (
                <SubAllotItem
                  allotModalType={allotModalType}
                  key={user.accId}
                  user={user}
                  quota={leftQuota + user.allotNum}
                  allotNum={user.allotNum}
                  onAllotNumChange={onAllotNumChange}
                  onDelete={(id: number) => onChecked(false, id)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className={styles.footer}>
          <Button className={styles.cancelBtn} onClick={() => onClose()}>
            取消
          </Button>
          <Button onClick={() => onConfirm()} btnType="primary" disabled={subAllotList.length === 0}>
            确定
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export default AllotModal;
