/*
 * 普通营销任务详情a及营销托管管理联系人列表b两处使用，两者区别是
 * 1.批量录入线索 a无需选中项即可录入当前所有，点击展示的是我们自己的弹窗，完成后调春贺的一个接口提交；b需要选中录入，展示的是crm选择分组的弹窗@郭静田，完成后调春贺另一个接口提交。
 * 2.单条录入 a需要查询是否有同域名邮箱弹窗提示是否一起录入；b无此弹窗只录入单个
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Divider, Checkbox, Tooltip, message } from 'antd';
import classnames from 'classnames';
import { apiHolder, apis, EdmSendBoxApi, AddCrmClueContact, ResponseCustomerNewLabelByEmail, AddHostingClueContactsReq } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Switch from '@lingxi-common-component/sirius-ui/Switch';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { ReactComponent as TongyongCuowutishiXian } from '@web-common/images/newIcon/tongyong_cuowutishi_xian.svg';
import { ReactComponent as AlertInfoIcon } from '@/images/icons/edm/yingxiao/alert-info.svg';
import UniDrawerWrapper from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import { UniDrawerLeadsDetail, UniDrawerLeadsView } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawerLeads';
import { L2cCustomerSelectGridModal, L2cLeadsSelectGridModal } from '@lxunit/app-l2c-crm';
import { DOMAIN_MATCH_REGEX, PublicMailDomainList } from '../../utils/utils';
import { DetailTabOption } from '../detailEnums';
import styles from './customerClue.module.scss';
import { findTopPriorityLabel, showUniDrawer, UniDrawerModuleId, openBatchCreateLeadsModal } from '@lxunit/app-l2c-crm';
import { edmDataTracker } from '../../tracker/tracker';

export const HOSTING_CUSTOMER_CLUE_KEY = 'aiHosting';

export enum opType {
  batchClue = 'batchClue',
  addCustomer = 'addCustomer',
  customer = 'customer',
  existCustomer = 'existCustomer',
  addClue = 'addClue',
  clue = 'clue',
  existClue = 'existClue',
}

export interface customerClueContact {
  email: string;
  contact_name: string;
  source_name: string;
  planId?: string;
}

interface Props {
  // 展示类型
  // batchClue批量新建线索
  // addCustomer添加客户 customer查看客户 existCustomer添加到已有客户
  // addClue添加线索 clue查看线索 existClue添加到已有线索
  type: opType | '';
  contacts: Record<string, customerClueContact[]>;
  initStatus: string;
  onClose: (refresh?: boolean) => void;
  edmEmailId: number | string;
  edmSubject: string;
  contactsMap: Record<string, ResponseCustomerNewLabelByEmail[]>;
  // 1营销任务 2营销托管任务
  edmType?: number;
}

interface BatchClueData {
  exclude: boolean;
  filter: boolean;
  existNum: number;
  recordNum: number;
  conformNum: number;
  filterContacts: AddCrmClueContact[];
}

interface SingleData {
  domain: string;
  domainNum: number;
  currentEmail: string;
  check: boolean;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

const initBatchClueData = {
  exclude: false,
  filter: false,
  existNum: 0,
  recordNum: 0,
  conformNum: 0,
  filterContacts: [],
};

const initSingleData = {
  domain: '',
  domainNum: 0,
  currentEmail: '',
  check: true,
};

// 线索录入限制条数
const RESTRICT = 500;

const options = [
  { label: '已送达', value: `${DetailTabOption.Sended}_1` },
  { label: '未送达', value: `${DetailTabOption.Sended}_0` },
  { label: '订阅', value: `${DetailTabOption.Open}_3` },
  { label: '已打开', value: `${DetailTabOption.Open}_1` },
  { label: '未打开', value: `${DetailTabOption.Open}_0` },
  { label: '已回复', value: `${DetailTabOption.Reply}_1` },
  { label: '未回复', value: `${DetailTabOption.Reply}_0` },
  { label: '点击过链接', value: `${DetailTabOption.Link}_1` },
];

const CustomerClue: React.FC<Props> = props => {
  const { type, contacts, initStatus, onClose, edmEmailId, edmSubject, contactsMap, edmType = 1 } = props;
  // 营销管理联系人页面来源
  const isFromAiHosting = initStatus === HOSTING_CUSTOMER_CLUE_KEY;
  const sourceStr = isFromAiHosting ? 'autoEDMTaskDetail' : 'edmButton';
  // 弹窗展示使用一个值控制，避免极限下重复打开弹窗
  const [drawerVisibleType, setDrawerVisibleType] = useState<opType>();
  // 两种弹窗的展示
  const [batchClueModal, setBatchClueModal] = useState<boolean>(false);
  const [singleModal, setSingleModal] = useState<boolean>(false);
  // 批量弹窗内部数据变化
  const [batchClueData, setBatchClueData] = useState<BatchClueData>(initBatchClueData);
  // 批量弹窗外部参数变化 - 状态选中
  const [statusCheck, setStatusCheck] = useState<string[]>([]);
  // 单个弹窗内部数据变化
  const [singleData, setSingleData] = useState<SingleData>(initSingleData);
  // 同域名邮箱数据列表（包括选中）
  const [sameDomainList, setSameDomainList] = useState<customerClueContact[]>([]);
  // 按钮loading状态
  const [loading, setLoading] = useState<boolean>(false);
  // 查看客户/线索的id
  // const [viewId, setViewId] = useState<number>(0);

  // 获取批量弹窗展示数据
  const getBatchClueData = useCallback(async () => {
    // 整理出去重后的选中状态的邮箱总数据
    const filterMap: Record<string, boolean> = {};
    const filterList: { email: string; name: string; sourceName: string }[] = [];
    statusCheck.forEach((item: string) => {
      if (contacts[item]) {
        contacts[item].forEach(itm => {
          if (!filterMap[itm.email]) {
            filterList.push({ email: itm.email, name: itm.contact_name, sourceName: itm.source_name });
            filterMap[itm.email] = true;
          }
        });
      }
    });
    const emailsLength = filterList.length;
    // 大于一千不计算已存在和预计录入
    if (emailsLength > 1000) {
      updateBatchClueData({ conformNum: emailsLength, recordNum: emailsLength });
    } else if (emailsLength <= 0) {
      updateBatchClueData({
        existNum: 0,
        conformNum: 0,
        recordNum: 0,
        filterContacts: [],
      });
    } else {
      setLoading(true);
      const result = await edmApi.filterCrmClueContacts({
        filterUnsubscribed: batchClueData.exclude,
        filterExistedDomain: batchClueData.filter,
        emails: filterList.map(item => item.email),
      });
      const existCount = result?.existedCount || 0;
      const recordCount = result?.availableCount || 0;
      const conformCount = recordCount + existCount;
      setLoading(false);
      updateBatchClueData({
        existNum: existCount,
        conformNum: conformCount,
        recordNum: recordCount,
        filterContacts: filterList,
      });
    }
  }, [statusCheck, contacts, batchClueData]);

  const handleBatchCreateLeadsConfirm = async (data: Record<string, any>) => {
    const params: AddHostingClueContactsReq = {
      taskId: edmEmailId as string,
      crmGroupIds: data?.groupIds?.map((item: number) => item + ''),
      addExistedIntoGroup: data?.isAddToGroup,
      contacts: contacts[HOSTING_CUSTOMER_CLUE_KEY]?.map(item => ({
        email: item.email,
        name: item.contact_name,
        sourceName: item.source_name,
        planId: item.planId || '',
      })),
    };
    const resultErr = await edmApi.addHostingClueContacts(params);
    if (!resultErr) {
      message.success('提交录入线索成功');
      resetState();
    } else {
      message.error('提交录入线索失败');
    }
    onClose(!resultErr);
  };

  const handleBatchCreateLeadsCancel = () => {
    resetState();
    onClose();
  };

  useEffect(() => {
    if (!type) {
      return;
    }
    getBatchClueData();
  }, [JSON.stringify(statusCheck), batchClueData.exclude, batchClueData.filter]);

  useEffect(() => {
    if (!type) {
      return;
    }
    if (type === opType.batchClue) {
      if (isFromAiHosting) {
        openBatchCreateLeadsModal({
          submit: handleBatchCreateLeadsConfirm,
          onCancel: handleBatchCreateLeadsCancel,
        });
      } else {
        getBatchClueData();
        setBatchClueModal(true);
      }
      return;
    }
    const selfSameDomain = getSelfIsPublicDomain();
    // 录入客户/线索和添加至已有客户/线索，需要先判断
    if ([opType.addCustomer, opType.addClue, opType.existCustomer, opType.existClue].includes(type)) {
      const hide = message.loading('操作加载中...', 0);
      getFilterContacts()
        .then(operationContacts => {
          if (!contacts[initStatus]?.length) {
            message.error('暂无可提交数据');
          } else {
            const existSameDomain = getSameDomainList();
            // 选中邮箱本身域名是否是公共域名，是的话直接执行录入/添加 这里一定要先判断
            if (selfSameDomain) {
              handleDisplayDrawer();
              // 此场景为特殊场景，所以更新sameDomainList为仅包含选中项本身
              const curStatusContacts = contacts[initStatus];
              const checkItemObj = curStatusContacts[0];
              setSameDomainList(checkItemObj ? [checkItemObj] : []);
            }
            // 不是再判断过滤公共域名后是否有同域名邮箱
            else if (existSameDomain) {
              // 如果有且不是不展示弹窗场景则在录入客户/线索场景下展示同域名询问弹窗后打开抽屉组件，在添加至已有客户/线索下展示直接打开弹窗组件
              if (!isFromAiHosting && [opType.addCustomer, opType.addClue].includes(type)) {
                setSingleModal(true);
              }
              // 如果没有直接执行录入/添加
              else {
                handleDisplayDrawer();
              }
            }
            // 这里只剩下了选中邮箱本身既不是公共域名，也没有过滤公共域名后的同域名邮箱，直接执行录入/添加
            else {
              handleDisplayDrawer();
            }
          }
        })
        .finally(() => {
          hide();
        });
    } else {
      handleDisplayDrawer();
    }
  }, [type]);

  useEffect(() => {
    if (initStatus && type) {
      setStatusCheck([initStatus]);
    }
  }, [initStatus, type]);

  // const getViewId = useCallback(() => {
  //   const viewItem = contacts[initStatus][0];
  //   const viewId = contactsMap[viewItem.email] ? findTopPriorityLabel(contactsMap[viewItem.email])?.detail_id : 0;
  //   setViewId(viewId);
  // }, [initStatus, contacts, contactsMap]);

  // 决定展示哪个抽屉组件
  const handleDisplayDrawer = () => {
    if (!type) {
      return;
    }
    let viewId = 0;
    if ([opType.customer, opType.clue].includes(type)) {
      const viewItem = contacts[initStatus][0];
      viewId = contactsMap[viewItem.email] ? findTopPriorityLabel(contactsMap[viewItem.email])?.detail_id : 0;
    } else if (type === opType.addClue) {
      // 录入线索大于限制，直接调批量接口录入
      const recordList = getContactList();
      if (recordList.length > RESTRICT) {
        handleBatchClueConfirm(recordList);
        return;
      }
    }
    if (type === opType.addCustomer) {
      const contact_list = getContactList().map(item => ({ ...item, sourceName: item.source_name }));
      showUniDrawer({
        moduleId: UniDrawerModuleId.CustomerDetail,
        moduleProps: {
          visible: true,
          customerData: { contact_list, company_name: '' },
          onSuccess: () => handleUniClose(true),
          onClose: () => handleUniClose(),
          source: sourceStr,
          relationParams: { create_source: { edm_key: edmEmailId, edm_name: edmSubject, edm_type: edmType } },
        },
      });
    } else if (type === opType.customer) {
      showUniDrawer({
        moduleId: UniDrawerModuleId.CustomerView,
        moduleProps: {
          visible: true,
          customerId: viewId,
          source: sourceStr,
          onClose: () => handleUniClose(),
        },
      });
    } else if (type === opType.addClue) {
      const contactList = getContactList().map(item => ({ ...item, sourceName: item.source_name }));
      showUniDrawer({
        moduleId: UniDrawerModuleId.LeadsDetail,
        moduleProps: {
          visible: true,
          contactList,
          onSuccess: () => handleUniClose(true),
          onClose: () => handleUniClose(),
          source: sourceStr,
          relationParams: { create_source: { edm_key: edmEmailId, edm_name: edmSubject, edm_type: edmType } },
        },
      });
    } else if (type === opType.clue) {
      showUniDrawer({
        moduleId: UniDrawerModuleId.LeadsView,
        moduleProps: {
          visible: true,
          leadsId: viewId,
          onClose: () => handleUniClose(),
          source: sourceStr,
        },
      });
    } else {
      setDrawerVisibleType(type);
    }
  };
  // 是否存在同域名邮箱，有则返回，至少会有一个，选中的放在第一位
  const getSameDomainList = () => {
    const curStatusContacts = contacts[initStatus];
    const checkItemObj = curStatusContacts[0];
    if (!checkItemObj) {
      return false;
    }
    const regexRes = checkItemObj.email.match(DOMAIN_MATCH_REGEX);
    const curDomain = regexRes ? regexRes[regexRes.length - 1] : '';
    // 过滤出同域名且非公共域名邮箱
    let sameList = curStatusContacts.filter(item => {
      const itemRegexRes = item.email.match(DOMAIN_MATCH_REGEX);
      const itemDomain = itemRegexRes ? itemRegexRes[itemRegexRes.length - 1] : '';
      return itemDomain && itemDomain === curDomain && !PublicMailDomainList.includes(itemDomain);
    });
    setSameDomainList(sameList);
    updateSingleData({
      domain: curDomain,
      domainNum: sameList.length,
      currentEmail: checkItemObj.email,
    });
    return sameList.length > 1;
  };
  // 获取当前选中邮箱是否为公共域名邮箱
  const getSelfIsPublicDomain = () => {
    const checkItemObj = contacts[initStatus][0];
    const regexRes = checkItemObj.email?.match(DOMAIN_MATCH_REGEX);
    const checkDomain = regexRes ? regexRes[regexRes.length - 1] : '';
    return PublicMailDomainList.includes(checkDomain);
  };
  // 过滤联系人中的已存在于客户/线索的邮箱（不仅是已存在，还有同域的一些复杂逻辑，都要过滤掉）
  const getFilterContacts = async () => {
    const curStatusContacts = contacts[initStatus];
    const result = await edmApi.getCustomerExistEmail({ email_list: curStatusContacts.map(item => item.email) });
    if (result?.length) {
      contacts[initStatus] = curStatusContacts.filter(item => !result.includes(item.email));
    }
    return contacts[initStatus];
  };
  // 批量弹窗的确认和取消
  const handleBatchClueConfirm = async (list?: customerClueContact[]) => {
    if (loading) {
      return;
    }
    setLoading(true);
    const result = await edmApi.addCrmClueContacts({
      filterUnsubscribed: list ? false : batchClueData.exclude,
      filterExistedDomain: list ? false : batchClueData.filter,
      edmEmailId: edmEmailId as number,
      edmSubject,
      contacts: list
        ? list.map(item => ({
            email: item.email,
            name: item.contact_name,
            sourceName: item.source_name,
          }))
        : batchClueData.filterContacts,
    });
    if (result) {
      message.success('提交录入线索成功');
      resetState();
      onClose(true);
    } else {
      message.error('提交录入线索失败');
    }
    setLoading(false);
    edmDataTracker.track('pc_markting_edm_taskDetail_leadsBatch', { type: 'add' });
  };
  const handleBatchClueCancel = () => {
    resetState();
    onClose();
    edmDataTracker.track('pc_markting_edm_taskDetail_leadsBatch', { type: 'cancel' });
  };
  // 批量弹窗内数据更新
  const updateBatchClueData = data => {
    setBatchClueData({ ...batchClueData, ...data });
  };
  // 单个弹窗的确认和取消
  const handleSingleConfirm = () => {
    handleDisplayDrawer();
    // 录入线索超过限制走批量录入，成功后再关闭弹窗
    if (type === opType.addClue && getContactList()?.length > RESTRICT) {
      return;
    }
    setSingleModal(false);
  };
  const handleSingleCancel = () => {
    resetState();
    onClose();
  };
  // 单个弹窗内数据更新
  const updateSingleData = data => {
    setSingleData({ ...singleData, ...data });
  };
  // 整理传入uni的联系人数据
  const getContactList = () => {
    // 单个选中时判断是否选中了同域名邮箱一起录入
    const checkItemObj = contacts[initStatus][0];
    if (!checkItemObj) {
      return [];
    }
    if (!isFromAiHosting && singleData.check && sameDomainList.length > 0) {
      return sameDomainList;
    } else {
      return [checkItemObj];
    }
  };
  // 抽屉或弹窗的关闭
  const handleUniClose = (success?: boolean) => {
    resetState();
    onClose(success);
  };
  const resetState = () => {
    setDrawerVisibleType(undefined);
    setSingleModal(false);
    setStatusCheck([]);
    // setViewId(0);
    setBatchClueModal(false);
    setBatchClueData(initBatchClueData);
    setSingleData(initSingleData);
  };

  if (!type) {
    return null;
  }

  return (
    <>
      <Modal
        wrapClassName={styles.recordClueModal}
        title="批量新建线索"
        visible={batchClueModal}
        maskClosable={false}
        footer={[
          <Button btnType="minorLine" onClick={handleBatchClueCancel}>
            取消
          </Button>,
          <Tooltip title={batchClueData.recordNum > 0 ? '' : '暂无可录入线索数据'}>
            {/* 此层div避免在Button为disabled的时候外层Tooltip失效 */}
            <div className={styles.recordClueBtn}>
              <Button btnType="primary" loading={loading} disabled={batchClueData.recordNum <= 0 || loading} onClick={() => handleBatchClueConfirm()}>
                <span className={styles.recordClueFlexRow}>
                  批量录入
                  <Tooltip title="相同域名邮箱（排除公共邮箱域名）将自动聚合创建为一条线索">
                    <AlertInfoIcon className={styles.recordClueIcon} />
                  </Tooltip>
                </span>
              </Button>
            </div>
          </Tooltip>,
        ]}
        onCancel={handleBatchClueCancel}
      >
        <>
          <div className={classnames(styles.recordClueChoose, styles.recordClueFlexRow)}>
            <span className={styles.recordClueStrong}>选择邮件营销信状态</span>
            <span className={styles.recordClueFlexRow}>
              不包含已退订邮箱
              <Switch
                size="small"
                className={styles.recordClueSwitch}
                onChange={() => updateBatchClueData({ exclude: !batchClueData.exclude })}
                checked={batchClueData.exclude}
              />
            </span>
          </div>
          <Checkbox.Group
            className={classnames(styles.recordClueCheckbox, styles.recordClueFlexRow)}
            options={options}
            value={statusCheck}
            onChange={checkList => setStatusCheck(checkList as string[])}
          />
          <span>根据以上选择，结果如下</span>
          <div className={classnames(styles.recordClueResult, styles.recordClueFlexRow)}>
            <div className={styles.recordClueFlexColumn}>
              {batchClueData.conformNum <= 1000 ? (
                <span className={styles.recordClueQuantity}>{batchClueData.recordNum}</span>
              ) : (
                <Tooltip title="邮箱数过大，暂不做实时统计">
                  <TongyongCuowutishiXian className={styles.recordClueBottom} />
                </Tooltip>
              )}
              <span className={styles.recordCluePredict}>预计录入邮箱数</span>
            </div>
            <Divider className={styles.recordClueDivider} type="vertical" />
            <div className={styles.recordClueFlexColumn}>
              <span>符合选中状态邮箱数{batchClueData.conformNum}</span>
              <span className={styles.recordClueFlexRow}>
                已存在于线索/客户邮箱数
                {batchClueData.conformNum <= 1000 ? (
                  <>{batchClueData.existNum}</>
                ) : (
                  <Tooltip title="邮箱数过大，暂不做实时统计">
                    <TongyongCuowutishiXian className={styles.recordClueIcon} />
                  </Tooltip>
                )}
              </span>
            </div>
          </div>
          <Checkbox checked={batchClueData.filter} onChange={e => updateBatchClueData({ filter: e.target.checked })}>
            过滤掉和已有线索或客户联系人邮箱域名相同的邮箱
          </Checkbox>
        </>
      </Modal>
      <Modal
        wrapClassName={styles.recordSingleModal}
        title={type === opType.addClue ? '录入线索' : '录入客户'}
        visible={singleModal}
        maskClosable={false}
        onCancel={handleSingleCancel}
        onOk={handleSingleConfirm}
        okButtonProps={{ loading }}
      >
        <Checkbox checked={singleData.check} onChange={e => updateSingleData({ check: e.target.checked })}>
          <>
            <p className={styles.recordSingle}>
              <span>
                列表中有相同域名({singleData.domain})邮箱共{singleData.domainNum}条一起录入
              </span>
              {type === opType.addClue ? (
                <Tooltip title={`单个线索联系人保存上限为${RESTRICT}条，超出部分则自动录入聚合为新线索`}>
                  <TongyongCuowutishiXian />
                </Tooltip>
              ) : (
                <></>
              )}
            </p>
            <span>当前邮箱：{singleData.currentEmail}</span>
          </>
        </Checkbox>
      </Modal>
      {/* 新建、查看客户 新建客户传customerData 查看客户传contactId contactId从标签信息接口拿 */}
      {/* UniDrawerWrapper组件在customerData数据变化时不会重新计算，所以visible特殊处理  */}
      {/* <UniDrawerWrapper
        visible={[opType.addCustomer, opType.customer].includes(drawerVisibleType) && (viewId || getContactList().length > 0)}
        customerId={viewId}
        customerData={viewId ? undefined : { contact_list: getContactList(), company_name: '' }}
        onSuccess={() => handleUniClose(true)}
        onClose={() => handleUniClose()}
        source="edmButton"
        relationParams={{ create_source: { edm_key: edmEmailId, edm_name: edmSubject } }}
      /> */}
      {/* 查看线索 leadsId从标签信息接口拿 */}
      {/* <UniDrawerLeadsView visible={drawerVisibleType === opType.clue} leadsId={viewId} onClose={() => handleUniClose()} source="edmButton" /> */}
      {/* 新建线索 */}
      {/* <UniDrawerLeadsDetail
        visible={drawerVisibleType === opType.addClue}
        contactList={getContactList()}
        onSuccess={() => handleUniClose(true)}
        onClose={() => handleUniClose()}
        source="edmButton"
        relationParams={{ create_source: { edm_key: edmEmailId, edm_name: edmSubject } }}
      /> */}
      {/* 添加到已有客户 */}
      {drawerVisibleType === opType.existCustomer ? (
        <L2cCustomerSelectGridModal contacts={getContactList()} onOk={() => handleUniClose(true)} onCancel={() => handleUniClose()} way="EDM_button" />
      ) : (
        <></>
      )}
      {/* 添加到已有线索 */}
      {drawerVisibleType === opType.existClue ? (
        <L2cLeadsSelectGridModal contacts={getContactList()} onOk={() => handleUniClose(true)} onCancel={() => handleUniClose()} way="EDM_button" />
      ) : (
        <></>
      )}
    </>
  );
};

export default CustomerClue;
