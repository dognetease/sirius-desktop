import React, { useState, useEffect, useImperativeHandle, useRef } from 'react';
import { Skeleton, message } from 'antd';
import { TablePaginationConfig } from 'antd/lib/table/interface';
import { api, apis, InsertWhatsAppApi, ChannelListRes, UserItemInfo, ChannelListItem, ModeType, util } from 'api';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import style from './style.module.scss';
import AllotModal from './components/allotModal';
import UnbindModal from './components/unbindModal';
import ChannelEmpty from './components/channelEmpty';
import ChannelListTable from './components/channelListTable';
import { AllotModalType } from '@/components/Layout/EnterpriseSetting/whatsAppAccountManage/types';
import { TongyongGuanbiXian, TongyongShuomingMian } from '@sirius/icons';
import classNames from 'classnames';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { GlobalActions, useAppDispatch } from '@web-common/state/createStore';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

interface Props {
  onDataChange: (info: { leftChannelQuota?: number; totalChannelQuota?: number }) => void;
}

interface PersonalChannelRef {
  onAllot: () => void;
  onModeAssignment: () => void;
}

const modeList = [
  {
    key: ModeType.free,
    title: '自由模式',
    subTitle: '无需分配，所有员工都可使用',
  },
  {
    key: ModeType.limit,
    title: '限制模式',
    subTitle: '限制员工扫码数量',
  },
  {
    key: ModeType.allocation,
    title: '分配模式',
    subTitle: '分配给员工使用',
  },
];

const modeMessages = {
  [ModeType.free]: {
    [ModeType.free]: '你已经保持在自由模式',
    [ModeType.limit]: '自由模式转化为限制模式后，需要设置限制员工可登录WhatsApp最大数量才可使用哦',
    [ModeType.allocation]: '自由模式转化为分配模式后，需要分配给员工才能登录哦',
  },
  [ModeType.limit]: {
    [ModeType.free]: '限制转为自由模式后，限制模式设置无效，谁都可以登录WhatsApp哦',
    [ModeType.limit]: '你已经保持在限额模式',
    [ModeType.allocation]: '限制模式更换为分配模式后，限制模式设置无效。可分配员工登录WhatsApp',
  },
  [ModeType.allocation]: {
    [ModeType.free]: '分配模式转为自由模式后，分配模式设置无效，谁都可以登录WhatsApp哦',
    [ModeType.limit]: '分配模式更换为限制模式后，分配模式设置无效。可设置限制员工可登录WhatsApp最大数量',
    [ModeType.allocation]: '你已经保持在分配模式',
  },
};

const PersonalChannel = React.forwardRef<PersonalChannelRef, Props>(({ onDataChange }, ref) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ChannelListRes | undefined>(undefined);

  const [unbindModalVisible, setUnbindModalVisible] = useState(false);
  const [channelInfo, setChannelInfo] = useState<ChannelListItem | undefined>(undefined);
  const [accountId, setAccountId] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(false);

  const [allotModalType, setAllotModalType] = useState<AllotModalType>('');
  const [pagination, setPagination] = useState<{ current: number; pageSize: number }>({ current: 1, pageSize: 20 });
  const [subList, setSubList] = useState<UserItemInfo[]>([]);
  const [quota, setQuota] = useState(0);
  const [activeMode, setActiveMode] = useState<ModeType>(ModeType.free);
  const dispatch = useAppDispatch();

  const init = useRef(false);

  const distributionList: ChannelListItem[] = data?.pages ? data?.pages?.content : [];

  const fetchData = async (page?: number, pageSize?: number) => {
    setLoading(true);
    whatsAppApi
      .getChannelList({ page: page || pagination.current, pageSize: pageSize || pagination.pageSize })
      .then(res => {
        setData(res);
        setQuota(res.leftChannelQuota);
        onDataChange({ leftChannelQuota: res.leftChannelQuota, totalChannelQuota: res.totalChannelQuota });
      })
      .finally(() => setLoading(false));
  };

  const fetchSubList = async () => {
    whatsAppApi.getSubList('WHATSAPP_PERSONAL_MANAGE').then(setSubList);
  };

  const onPaginationChange = ({ current = 1, pageSize = 20 }: TablePaginationConfig) => {
    setPagination({ current, pageSize });
    fetchData(current, pageSize);
  };

  const onAllot = (type: AllotModalType, accId?: number) => {
    setAllotModalType(type);
    console.log('onAllot');
    if (type === 'add') {
      setQuota(data?.leftChannelQuota || 0);
    }
    if (type === 'reassign') {
      const target = distributionList.find(v => v.accountId === accId);
      setAllotModalType('reassign');
      setQuota(target?.leftQuota || 0);
      setAccountId(target?.accountId || 0);
      if (!target) {
        console.error('[personal channel] onAllot error: no reassign data');
      }
    }
  };

  const onUnbind = (accId: number) => {
    const target = distributionList.find(v => v.accountId === accId);
    setChannelInfo(target);
    setUnbindModalVisible(true);
    if (!target) {
      console.error('[personal channel] onAllot error: no unbind data');
    }
  };

  const onAllotModalClose = (refresh: boolean) => {
    setAllotModalType('');
    if (refresh) {
      fetchData();
    }
  };

  const onUnbindModalClose = (refresh: boolean) => {
    setUnbindModalVisible(false);
    if (refresh) {
      fetchData();
    }
  };

  useImperativeHandle(ref, () => ({
    onAllot: () => {
      onAllot('add');
    },
    onModeAssignment: () => {
      setVisible(true);
    },
  }));

  useEffect(() => {
    fetchData().finally(() => {
      init.current = true;
    });
    fetchSubList().then();
    whatsAppApi
      .getAllocationMode()
      .then(res => {
        setActiveMode(res || '');
        dispatch(GlobalActions.updateWaModeType(res));
      })
      .catch(err => console.log(err));
  }, []);

  const transformMessages = (oldMode: ModeType, targetMode: ModeType) => {
    return modeMessages[oldMode][targetMode];
  };

  const handleClick = (modeType: ModeType) => {
    if (activeMode === modeType) return;
    setVisible(false);
    // 切换前提示
    Modal.confirm({
      title: '提示',
      content: transformMessages(activeMode, modeType),
      okText: '确定',
      cancelText: '取消',
      onOk() {
        whatsAppApi
          .updateAllocationMode({ mode: modeType })
          .then(() => {
            setActiveMode(modeType);
            dispatch(GlobalActions.updateWaModeType(modeType));
            setVisible(false);
            // 刷新列表
            fetchData();
          })
          .catch(err =>
            message.warning({
              icon: <TongyongShuomingMian style={{ verticalAlign: -4, fontSize: 18 }} color="#f74f4f" />,
              content: err,
            })
          );
      },
      onCancel() {
        setVisible(true);
      },
    });
  };

  return (
    <PermissionCheckPage resourceLabel="WHATSAPP_PERSONAL_MANAGE" accessLabel="ALLOT" menu="ORG_SETTINGS_PEER_SETTING">
      <div className={style.pageContainer}>
        <div className={style.pageContent}>
          <Skeleton loading={!init.current} active>
            {distributionList.length > 0 ? (
              <ChannelListTable
                distributionList={distributionList}
                pagination={pagination}
                loading={loading}
                onPaginationChange={onPaginationChange}
                total={data?.pages?.totalSize || 0}
                onReassign={accId => onAllot('reassign', accId)}
                onUnbind={accId => onUnbind(accId)}
              />
            ) : (
              <ChannelEmpty onAllot={() => setAllotModalType('add')} />
            )}
          </Skeleton>
        </div>
        <AllotModal allotModalType={allotModalType} onModalClose={onAllotModalClose} quota={quota} subList={subList} accountId={accountId} />
        <UnbindModal visible={unbindModalVisible} onModalClose={onUnbindModalClose} channelInfo={channelInfo} />
        <Modal
          className={style.modelModal}
          width={343}
          closeIcon={<TongyongGuanbiXian style={{ fontSize: 20, strokeWidth: 1.5, color: '#6F7485' }} />}
          visible={visible}
          title="分配模式"
          okText="确认"
          onCancel={() => setVisible(false)}
          centered
        >
          <div className={style.modelList}>
            {modeList.map(item => (
              <div
                key={item.key}
                onClick={() => handleClick(item.key)}
                className={classNames(style.modelItem, {
                  [style.activeMode]: activeMode === item.key,
                })}
              >
                <div className={style.title}>{item.title}</div>
                <div className={style.subTitle}>{item.subTitle}</div>
              </div>
            ))}
          </div>
        </Modal>
      </div>
    </PermissionCheckPage>
  );
});

export default PersonalChannel;
