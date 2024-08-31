import React, { useState, useEffect, useMemo } from 'react';
import classnames from 'classnames';
import { Divider, Drawer, Spin, Space } from 'antd';
import { apis, apiHolder, CustomerDiscoveryApi, CustomerDisDetail, CustomerRow, CustomerEmailListCondition } from 'api';
import ArrowLeftOutlined from '@ant-design/icons/ArrowLeftOutlined';
import { ReactComponent as CustomerMarkIcon } from '@/images/icons/customs/customer-mark.svg';
import { ReactComponent as CustomerSyncIcon } from '@/images/icons/customs/customer-sync.svg';
import { CustomerSyncType, ValidFlag, drawerClassName, CustomerRecommendType } from '../../context';
import { useContainerHeight } from '../../hooks/useContainerHeight';
import { ConcatSelectModal } from '../../components/ConcatSeletModal';
import { CustomerTags } from '../../components/CustomerTags';
import { EmailList } from '../../../components/emailList';
import { DetailPanel } from '../../components/detailPanel';
import { ConcatList } from '../../components/ConcatList';
import { useCustomerSync } from '../../hooks/useCustomerSync';
import UniDrawerWrapper from '../../../../CustomsData/components/uniDrawer/uniDrawer';
import style from './style.module.scss';
import { getIn18Text } from 'api';

interface Props {
  id: string;
  visible: boolean;
  onClose: () => void;
  showOperation?: boolean;
  showReturnIcon?: boolean;
  onChange?: () => void;
  getContainer?: () => HTMLElement; // 指定抽屉挂载元素 解决发邮件弹窗被覆盖问题
}
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
export const CustomerDetail: React.FC<Props> = props => {
  const { id, showOperation = true, showReturnIcon = false, onClose, visible, children, getContainer, onChange } = props;
  const [customerDisDetail, setCustomerDisDetail] = useState<CustomerDisDetail>({} as CustomerDisDetail);
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const { containerHeight, containerRef, calculateHeight } = useContainerHeight(250);
  const { markRecord, syncRecord, customerModal, contactModal } = useCustomerSync();
  async function fetchDate() {
    setLoading(true);
    const res = await customerDiscoveryApi.getRegularCustomerDetail(id);
    setCustomerDisDetail(res.data);
    setTimeout(() => calculateHeight(), 0);
    setLoading(false);
  }
  const details = useMemo(
    () => [
      { label: getIn18Text('QIYEYUMING'), value: customerDisDetail.regularCustomerDomain || '--' },
      { label: getIn18Text('QIYEMINGCHENG'), value: customerDisDetail.companyName || '--' },
    ],
    [customerDisDetail]
  );
  /**
   * 标记
   * @returns
   */
  const markDetail = async (cancel: boolean = false) => {
    const { regularCustomerId } = customerDisDetail;
    if (!regularCustomerId) {
      return;
    }
    try {
      setOpLoading(true);
      const res = await markRecord({ regularCustomerId } as CustomerRow, cancel);
      setCustomerDisDetail({ ...customerDisDetail, validFlag: res?.validFlag || '' });
      if (onChange) {
        onChange();
      }
    } finally {
      setOpLoading(false);
    }
  };
  /**
   * 同步
   * @returns
   */
  const syncDetail = async (key: CustomerSyncType) => {
    const { regularCustomerId } = customerDisDetail;
    if (!regularCustomerId) {
      return;
    }
    try {
      setOpLoading(true);
      await syncRecord(key, { regularCustomerId, regularCustomerDomain: customerDisDetail.regularCustomerDomain } as CustomerRow, (isCancel: boolean) => {
        if (!isCancel) {
          setCustomerDisDetail({ ...customerDisDetail, syncInfo: { type: key, referId: '' } });
        }
        setOpLoading(false);
      });
      if (onChange) {
        onChange();
      }
    } catch {
      setOpLoading(false);
    }
  };

  /**
   * 分配
   * @returns
   */
  // const assignDetail = async (key: CustomerSyncType) => {
  //   const { regularCustomerId } = customerDisDetail;
  //   if (!regularCustomerId) {
  //     return;
  //   }
  //   try {
  //     setOpLoading(true);
  //     await assignRecord({ regularCustomerId } as CustomerRow, key, () => {
  //       setCustomerDisDetail({ ...customerDisDetail, syncInfo: { type: key, referId: '' } });
  //     });
  //     if (onChange) {
  //       onChange();
  //     }
  //   } finally {
  //     setOpLoading(false);
  //   }
  // };

  function renderDrawerTitle() {
    const { syncInfo, validFlag } = customerDisDetail;
    if (loading) {
      return <Spin />;
    }
    if (validFlag === ValidFlag.Invalid) {
      // 无效操作可以撤销
      return (
        <div className={style.drawerTitleWrapper}>
          {showReturnIcon && <ArrowLeftOutlined className={style.retIcon} onClick={onClose} />}
          <span className={style.title}>{getIn18Text('SHAIXUANXIANGQING')}</span>
          <CustomerTags data={customerDisDetail} />
          <Space className={classnames([style.flex1, style.operation])} size={40}>
            <span className={style.linkBtn} onClick={() => markDetail(true)}>
              <CustomerMarkIcon />
              <span>{getIn18Text('QUXIAOWUXIAO')}</span>
            </span>
          </Space>
        </div>
      );
    }
    if (!showOperation || syncInfo?.type !== CustomerSyncType.NotSync || validFlag === ValidFlag.Pending) {
      return (
        <div className={style.drawerTitleWrapper}>
          {showReturnIcon && <ArrowLeftOutlined className={style.retIcon} onClick={onClose} />}
          <span className={style.title}>{getIn18Text('SHAIXUANXIANGQING')}</span>
          <CustomerTags data={customerDisDetail} />
        </div>
      );
    }
    if (opLoading) {
      return (
        <div className={style.drawerTitleWrapper}>
          {showReturnIcon && <ArrowLeftOutlined className={style.retIcon} onClick={onClose} />}
          <span className={style.title}>{getIn18Text('SHAIXUANXIANGQING')}</span>
          <CustomerTags data={customerDisDetail} />
          <Space className={classnames([style.flex1, style.operation])} size={40}>
            <Spin />
          </Space>
        </div>
      );
    }
    return (
      <div className={style.drawerTitleWrapper}>
        {showReturnIcon && <ArrowLeftOutlined className={style.retIcon} onClick={onClose} />}
        <span className={style.title}>{getIn18Text('SHAIXUANXIANGQING')}</span>
        <CustomerTags data={customerDisDetail} />
        <Space className={classnames([style.flex1, style.operation])} size={40}>
          <span className={style.linkBtn} onClick={() => markDetail()}>
            <CustomerMarkIcon />
            <span>{getIn18Text('WUXIAO')}</span>
          </span>
          <span className={style.linkBtn} onClick={() => syncDetail(CustomerSyncType.Company)}>
            <CustomerSyncIcon />
            <span>{getIn18Text('LURUKEHU')}</span>
          </span>
          {/* <Dropdown overlay={(
            <Menu onClick={({ key }) => syncDetail(key as CustomerSyncType)}>
              <Menu.Item key={CustomerSyncType.Clue}>
                <span className={style.menuItem}>{getIn18Text('XIANSUO')}</span>
              </Menu.Item>
              <Menu.Item key={CustomerSyncType.Company}>
                <span className={style.menuItem}>{getIn18Text('KEHU')}</span>
              </Menu.Item>
            </Menu>
          )}
          >
            <Space>
              <span className={style.linkBtn}>
                <CustomerSyncIcon />
                <span>{getIn18Text('TONGBU')}</span>
                <CaretDownOutlined style={{ color: '#A8AAAD' }} />
              </span>
            </Space>
          </Dropdown> */}
          {/* {customerDisDetail.taskType === CustomerRecommendType.Manual
            ? (
              <Dropdown overlay={(
                <Menu onClick={({ key }) => assignDetail(key as CustomerSyncType)}>
                  <Menu.Item key={CustomerSyncType.OpenSea}>
                    <span className={style.menuItem}>{getIn18Text('XIANSUOGONGHAI')}</span>
                  </Menu.Item>
                  <Menu.Item key={CustomerSyncType.OtherClue}>
                    <span className={style.menuItem}>{getIn18Text('ZHIDINGREN')}</span>
                  </Menu.Item>
                </Menu>
              )}
              >
                <Space>
                  <span className={style.linkBtn}>
                    <CustomerAllotIcon />
                    <span>{getIn18Text('FENPEI')}</span>
                    <CaretDownOutlined style={{ color: '#A8AAAD' }} />
                  </span>
                </Space>
              </Dropdown>
            )
            : ''} */}
        </Space>
      </div>
    );
  }
  useEffect(() => {
    id && fetchDate();
  }, [id]);
  return (
    <Drawer
      width={872}
      title={renderDrawerTitle()}
      onClose={onClose}
      visible={visible}
      getContainer={getContainer || false}
      destroyOnClose={Boolean(true)}
      className={drawerClassName}
    >
      {loading ? (
        <Spin />
      ) : (
        <>
          {children}
          <DetailPanel title={getIn18Text('QIYEXINXI')} data={details} />
          <Divider />
          <ConcatList data={customerDisDetail.receiverList || []} />
          <Divider />
          <div className={classnames([style.flex1, style.emailList])} ref={containerRef}>
            <EmailList
              title={getIn18Text('WANGLAIYOUJIAN')}
              condition={CustomerEmailListCondition.RegularCustomer}
              height={containerHeight}
              mainResourceId={id}
              relationName={customerDisDetail.companyName}
              relationDomain={customerDisDetail.regularCustomerDomain}
            />
          </div>

          {/** 新建客户弹窗 */}
          {/* <CreateNewClientModal
              visible={customerModal.visible}
              onCancel={customerModal.onCancel}
              onSubmit={customerModal.onSubmit}
              extrData={customerModal.extrData}
              callBack={customerModal.callBack}
            /> */}

          <UniDrawerWrapper
            visible={customerModal.visible}
            source={customerDisDetail.taskType === CustomerRecommendType.Manual ? 'mailFilterManual' : 'mailFilterAuto'}
            customerData={{
              company_name: '',
              contact_list:
                customerDisDetail?.receiverList?.map(reciver => ({
                  email: reciver.email,
                  contact_name: reciver.name,
                })) || [],
              company_domain: customerModal.domain,
            }}
            customStatus="跟进中"
            onClose={customerModal.onClose}
            onSuccess={customerModal.onSuccess}
          />

          {/* 选择联系人弹窗 */}
          <ConcatSelectModal
            visible={contactModal.visible}
            onCancel={contactModal.onCancel}
            onConfirm={contactModal.onConfirm}
            extrData={contactModal.extrData}
            callBack={contactModal.callBack}
            multiple={false}
          />
        </>
      )}
    </Drawer>
  );
};
