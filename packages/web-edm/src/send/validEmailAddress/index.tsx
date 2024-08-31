import React, { useEffect, useState, useRef, useImperativeHandle, useCallback, useMemo } from 'react';
import moment from 'moment';
import classname from 'classnames';
import debounce from 'lodash/debounce';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import ReactDOM from 'react-dom';
import Button from '@web-common/components/UI/Button';
import { ModalProps, Progress } from 'antd';
import CheckboxItem, { CheckboxItemStatus, ChildChange } from './checkboxItem';
import {
  apiHolder,
  apis,
  EdmSendBoxApi,
  EdmSendConcatInfo,
  ResponseContactsStatus,
  InvalidEmailData,
  BusinessMapModel,
  CheckEmailAddressInfo,
  AddressBookNewApi,
  DisplayModel,
  DisplayModelOpenStatus,
} from 'api';
import Divider from '@lingxi-common-component/sirius-ui/Divider';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import style from './validEmailAddress.module.scss';
import { edmDataTracker } from '../../tracker/tracker';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import cloneDeep from 'lodash/cloneDeep';
import SiriusModal from '@web-common/components/UI/SiriusModal';
import Input from '@lingxi-common-component/sirius-ui/Input';

import {
  AbnormalTypeModel,
  VertifyEmailModel,
  TypesMap,
  InvalidStatusMap,
  ReceiversMapModel,
  splitList,
  RightIcon,
  TrackTime,
  ContactInvalidStatus,
  EmailOtherStatusList,
  EmailVerifyOtherMap,
  getIdToValueData,
} from './util';
import CardList from '@web-mail/common/components/vlist/CardList/CardList';
import gif from '@/images/edm_validating_email_1.gif';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { ReactComponent as ExplanationIcon } from '@/images/icons/edm/yingxiao/explanation-gray16px.svg';
import { getIn18Text } from 'api';
import WarningIcon from '@/images/icons/edm/yingxiao/alert-tips.svg';
import { ReactComponent as EmptyCompanySmallIcon } from '@/images/icons/edm/yingxiao/empty_company_small.svg';
import { ReactComponent as SearchEmptyIcon } from '@/images/icons/edm/yingxiao/search_empty.svg';
import CloseIcon from '@web-common/images/newIcon/tongyong_guanbi_xian.svg';

import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { generateLeadsContactSubFilter } from '@lxunit/app-l2c-crm';
import { useRequest } from 'ahooks';
import { guardString } from '../../utils';
import Minimize from './minimize';

import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew';
import useLocalStorage from '@/hooks/useLocalStorage';

let filterStartTime = 0;

const { idToValueMap, allParentList } = getIdToValueData();

export interface ControlMinimizeModel {
  show: boolean;
  data?: {
    checkedCount: number;
    percent: number;
  };
}
interface ValidEmailModalProps {
  receivers: Array<EdmSendConcatInfo>;
  onClose: (canFilter?: boolean, confirm?: boolean) => void;
  draftId?: string;
  showNoneInvalidListModal?: () => void;
  businessType?: string;
  useOrgQuota?: 0 | 1;
  onCancelFilterAndSend?: () => void;
  minimizeable?: boolean;
  senderEmails?: CheckEmailAddressInfo[];
  hideDirectSendButton?: boolean;
  // 是否以弹窗的形式展示，因为除了营销添加联系人抽屉外，还有其他场景直接调取此组件
  hideModalWrap?: boolean;
  // 更新步骤
  updateCurrentStep?: (num: number) => void;
  onConfirm?: (emails?: EdmSendConcatInfo[], validateResult?: ValidateResult, reAdd?: boolean) => void;
  showReAdd?: boolean;
  checkResult?: ValidateResult;
  // 最小化小窗控制
  controlMinimize?: (dataObj: ControlMinimizeModel) => void;
  existEmailCount?: number;
}
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const addressbookApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;
export interface ResultByStatus {
  all: Map<string, string[]>;
  remove: string[];
  checkResult?: ValidateResult;
}

export interface ValidInterface {
  refresh: () => void;
  fetchResultByStatus: () => ResultByStatus;
}

export interface ValidateResult {
  v2ResultKV?: Map<string, EdmSendConcatInfo>;
  checkResultKV?: Map<string, InvalidEmailData>;
}
interface SummaryCount {
  // 一共过滤了多少人 / 当前剩下多少人
  totalCheck?: number;
  totalLeft?: number;

  exceptionTotal?: number;
  exceptionLeft?: number;

  invalidTotal?: number;
  invalidLeft?: number;
}

export const ValidEmailAddressModal = React.forwardRef<ValidInterface, ModalProps & ValidEmailModalProps>((props, ref) => {
  const {
    receivers,
    visible,
    onClose,
    draftId,
    // onSendAll,
    businessType,
    useOrgQuota,
    onCancelFilterAndSend,
    minimizeable = true,
    senderEmails,
    hideDirectSendButton = false,
    hideModalWrap = false,
    updateCurrentStep,
    onConfirm,
    checkResult,
    controlMinimize,
    existEmailCount = 0,
    showReAdd = false,
  } = props;
  const [stage, setStage] = useState<'inProgress' | 'complete'>('inProgress');
  const [needCheckEmails, setNeedCheckEmails] = useState<VertifyEmailModel[]>([]);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [percent, _setPercent] = useState<number>(0);
  const [minimize, setMinimize] = useState(false);
  const [checkedCount, setCheckedCount] = useState<number>(0); // 当前checked的总量
  const timer = useRef<null | NodeJS.Timeout | number>(null);
  const [refreshKey, setRefreshKey] = useState(false);

  const [showInvaliWarning, setShowInvaliWarning] = useState(true);

  const [deleteAddressbookChecked, setDeleteAddressbookChecked] = useState(false);
  // check 接口 email=》verifystatus对应关系
  const EmailsVerifyStatusMap = useRef<Map<string, number>>(new Map());

  // 过滤联系人标签的展开收起状态刷新
  const [openStatusKey, setOpenStatusKey] = useState<number>(0);
  const guideId = 'new-feature-guide-show-id';
  const [showNewFeatureGuide, setShowNewFeatureGuide] = useLocalStorage(guideId, true);

  const [originChecked, setOriginChecked] = useState<string[]>([]);

  // MARK: - 新逻辑
  const v2ResultKV = useRef<Map<string, EdmSendConcatInfo>>(checkResult?.v2ResultKV || new Map());
  const checkResultKV = useRef<Map<string, InvalidEmailData>>(checkResult?.checkResultKV || new Map());
  const allResultKV = useRef<Map<string, DisplayModel>>(new Map());
  const displayKV = useRef<Map<string, DisplayModel>>(new Map());
  const invalidKV = useRef<Map<string, DisplayModel>>(new Map());
  const filterData = useRef<Map<number, AbnormalTypeModel>>(new Map());
  const exceptionKV = useRef<Map<string, DisplayModel>>(new Map());
  const noExceptionKV = useRef<Map<string, DisplayModel>>(new Map());

  const currentPageTrackName = !showReAdd ? 'pc_markting_edm_filter_success' : 'pc_markting_edm_filter_add';

  const trackTimeRef = useRef(cloneDeep(TrackTime));
  const [searchWord, setSearchWord] = useState('');

  const [latestClick, setLatestClick] = useState<AbnormalTypeModel>();

  const [summaryData, setSummaryData] = useState<SummaryCount>();
  const constructTotalSummaryData = () => {
    let totalCheckCount = receivers.length;
    let totalLeft = 0;

    let exceptionTotal = 0;
    let exceptionLeft = 0;

    let invalidTotal = 0;
    let invalidLeft = 0;

    receivers.forEach(i => {
      let resp = allResultKV.current.get(i.contactEmail);
      let deleted = i.logicDelete || false;

      if (resp?.invalid) {
        invalidTotal += 1;
        !deleted && (invalidLeft += 1);
      }
      if (resp?.exception) {
        exceptionTotal += 1;
        !deleted && (exceptionLeft += 1);
      }
      !deleted && (totalLeft += 1);
    });

    let summary: SummaryCount = {
      totalCheck: totalCheckCount,
      totalLeft: totalLeft,

      invalidTotal: invalidTotal,
      invalidLeft: invalidLeft,

      exceptionTotal: exceptionTotal,
      exceptionLeft: exceptionLeft,
    };
    setSummaryData(summary);
  };

  useEffect(() => {
    fetchDefaultFilterConfig();
  }, []);

  const fetchDefaultFilterConfig = async () => {
    try {
      const checkedCodes: string[] = [];
      const config = await edmApi.fetchFilterConfig();
      if (!!config.checkConfigs) {
        config.checkConfigs.forEach(each => {
          if (each.filterItems.length > 0) {
            each.filterItems.forEach(item => {
              if (item.status === 1 && item.code) {
                checkedCodes.push(item.code);
              }
            });
          }
        });
      }
      // 因为这里包含了 v2 和 check的所有结果, 所以用字符串做key匹配. 而不是用code 担心有重复
      setOriginChecked(checkedCodes);
      setOpenStatusKey(moment().valueOf());
    } catch (e) {}
  };

  useEffect(() => {
    setDefaultCheckState();
    setOpenStatusKey(moment().valueOf());
  }, [originChecked]);

  const sortedReceivers = useMemo(() => {
    var tops: EdmSendConcatInfo[] = [];
    var othersUnSelected: EdmSendConcatInfo[] = [];
    var othersSelected: EdmSendConcatInfo[] = [];

    receivers.forEach(i => {
      if (i.logicDelete) {
        return;
      }
      if (!displayKV.current.has(i.contactEmail)) {
        return;
      }
      if (latestClick?.emails?.includes(i.contactEmail)) {
        tops.push(i);
      } else {
        allResultKV.current.get(i.contactEmail)?.checked ? othersSelected.push(i) : othersUnSelected.push(i);
      }
    });
    return [...tops, ...othersSelected, ...othersUnSelected];
  }, [latestClick, summaryData, searchWord, openStatusKey]);

  useEffect(() => {
    if (checkResult?.v2ResultKV) {
      v2ResultKV.current = checkResult?.v2ResultKV;
    }
    if (checkResult?.checkResultKV) {
      checkResultKV.current = checkResult?.checkResultKV;
    }
  }, [checkResult]);

  useImperativeHandle(ref, () => ({
    refresh() {
      handleAllResult();
    },
    fetchResultByStatus: () => {
      const newMap = getEmailsListByMap();
      return {
        all: newMap,
        remove: receivers.filter(i => i.logicDelete).map(i => i.contactEmail),
        checkResult: checkResult,
      };
    },
  }));

  const setPercent = (v: any) => {
    _setPercent(v);
  };

  const onChildChange = (data: ChildChange) => {
    const { value, model, type, openHeight = 44 } = data;
    if (!model) {
      return;
    }
    if (type === 'checkStatus') {
      model.checked = value as boolean;
    } else if (type === 'openStatus') {
      model.openStatus = value as DisplayModelOpenStatus;
      model.openHeight = Math.max(openHeight, 44);
      setOpenStatusKey(moment().valueOf());
    }
    refresh();
  };

  const onFilterDataSelectStateChange = (emails?: string[], checked?: boolean) => {
    emails?.forEach(i => {
      let model = displayKV.current.get(i);
      if (model) {
        model.checked = checked;
      }
    });
    refresh();
  };

  const onScroll = ({ scrollTop }) => {
    setScrollTop(scrollTop);
  };

  const getCheckState = (kv: React.MutableRefObject<Map<string, DisplayModel>>): { indeterminate: boolean; check: boolean } => {
    let cCount = 0;
    kv.current.forEach(i => {
      if (i.checked) {
        cCount += 1;
      }
    });
    let indeterminate = false;
    let check = false;
    if (cCount > 0 && cCount < kv.current.size) {
      indeterminate = true;
    }
    if (cCount > 0 && cCount === kv.current.size) {
      check = true;
    }
    return {
      indeterminate,
      check,
    };
  };

  const renderParentCheckBox = () => {
    // TODO: 性能待优化
    let allState = getCheckState(displayKV);
    let exceptionState = getCheckState(exceptionKV);
    let normalState = getCheckState(noExceptionKV);

    if (displayKV.current.size <= 0) {
      return <></>;
    }

    return (
      <div className={style.parentList}>
        <div className={style.parentBox}>
          <Checkbox
            className={style.parentAll}
            indeterminate={allState.indeterminate}
            onChange={e => {
              displayKV.current.forEach(i => (i.checked = e.target.checked));
              refresh();
            }}
            checked={allState.check}
          >
            {getIn18Text('QUANBU (')}
            {displayKV.current.size})
          </Checkbox>
          {exceptionKV.current.size > 0 && (
            <div className={style.parentAllWrap}>
              <Checkbox
                className={style.parentAll}
                indeterminate={exceptionState.indeterminate}
                onChange={e => {
                  exceptionKV.current.forEach(i => (i.checked = e.target.checked));
                  refresh();
                }}
                checked={exceptionState.check}
              >
                特殊状态({exceptionKV.current.size})
              </Checkbox>
              <div className={style.parentSquare} />
            </div>
          )}
          {noExceptionKV.current.size > 0 && (
            <Checkbox
              className={style.parentAll}
              indeterminate={normalState.indeterminate}
              onChange={e => {
                noExceptionKV.current.forEach(i => (i.checked = e.target.checked));
                refresh();
              }}
              checked={normalState.check}
            >
              正常状态({noExceptionKV.current.size})
            </Checkbox>
          )}
        </div>
        <Divider />
        <div className={style.parentBox}>
          {/* <CheckboxGroup className={style.parentGroup} value={checkedList}> */}
          {allParentList.map(item => {
            let infos = filterData.current.get(item.id);
            var totalCount = infos?.emails?.length || 0;
            var selectedCount = infos?.emails?.filter(i => displayKV.current.get(i)?.checked).length || 0;
            return totalCount > 0 ? (
              <Checkbox
                indeterminate={selectedCount > 0 && selectedCount < totalCount}
                checked={selectedCount === totalCount}
                onChange={e => {
                  onFilterDataSelectStateChange(infos?.emails, e.target.checked);
                  if (e.target.checked) {
                    setLatestClick(infos);
                  } else {
                    setLatestClick(undefined);
                  }
                }}
                className={style.parentItem}
                value={item.value}
              >
                {item.label} ({totalCount})
              </Checkbox>
            ) : null;
          })}
        </div>
        {/* </CheckboxGroup> */}
      </div>
    );
  };

  const renderCheckboxEmpty = () => (
    <div className={style.childListEmpty}>
      {searchWord ? (
        <>
          <SearchEmptyIcon />
          <span>搜索为空</span>
        </>
      ) : (
        <>
          <EmptyCompanySmallIcon />
          <span>暂无收件人邮箱地址</span>
        </>
      )}
    </div>
  );

  const renderCheckboxItem = props => {
    const { contactEmail, contactStatus } = props.data;
    let displayModel = displayKV.current.get(contactEmail);
    if (!displayModel) {
      return null;
    }
    return <CheckboxItem contactEmail={contactEmail} contactStatus={contactStatus} displayModel={displayModel} onChildChange={onChildChange} clearEmail={clearEmail} />;
  };

  const renderChildCheckBox = () => {
    let cCount = 0;
    let indeterminate = false;
    let checkAll = false;

    displayKV.current.forEach((v, k) => {
      if (v.checked) {
        cCount += 1;
      }
    });
    if (cCount > 0 && cCount < displayKV.current.size) {
      indeterminate = true;
    }
    if (cCount > 0 && cCount === displayKV.current.size) {
      checkAll = true;
    }
    return (
      <div className={style.childContainer}>
        <div className={style.childTitle}>
          <div className={style.checkbox}>
            <Checkbox
              indeterminate={indeterminate}
              onChange={e => {
                displayKV.current.forEach(i => (i.checked = e.target.checked));
                refresh();
              }}
              checked={checkAll}
            ></Checkbox>
          </div>
          <div className={style.contact}>邮箱地址</div>
          <div className={style.dropdown}>
            <HollowOutGuide
              className={style.hollow}
              enable={true}
              // enable={showNewFeatureGuide}
              guideId={guideId}
              title={'过滤模块全新升级'}
              intro={'展示每个地址全部状态'}
              step={1}
              placement="top"
            >
              <span className={style.dropdownText}>原因</span>
            </HollowOutGuide>
          </div>
          <div className={style.remark}>
            <HollowOutGuide
              className={style.hollow}
              enable={true}
              // enable={showNewFeatureGuide}
              guideId={guideId}
              title={'过滤模块全新升级'}
              intro={'展示每个地址全部状态'}
              step={2}
              placement="top"
            >
              <span className={style.dropdownText}>操作</span>
            </HollowOutGuide>
          </div>
        </div>
        <div className={style.childList}>
          {
            <CardList
              height={340}
              width={803}
              total={20}
              rowHeight={(data: DisplayModel) => {
                const displayModel = displayKV.current.get(data.contactEmail);
                return displayModel ? displayModel.openHeight || 44 : 0;
              }}
              cardMargin={0}
              data={sortedReceivers}
              onScroll={onScroll}
              scrollTop={scrollTop}
              // card={CheckboxItem}
              card={renderCheckboxItem}
              noRowsRenderer={renderCheckboxEmpty}
            />
          }
        </div>
      </div>
    );
  };

  const handleV2Result = (contactInfoList: EdmSendConcatInfo[]) => {
    const needCheckList: VertifyEmailModel[] = contactInfoList.map(receiver => {
      return {
        email: receiver.contactEmail,
        name: receiver.companyName || '',
        sourceName: receiver?.sourceName || '',
        contactStatus: receiver?.contactStatus,
      };
    });
    setNeedCheckEmails(needCheckList);
  };

  const createPollTaskForEmailAddress = (interval = 3000) => {
    let canceled = false;
    let maxError = 10;
    let _httpCancelHandler: (k: LoadOperation) => void = function () {};
    let errorCount = 0;
    timer.current = null;
    return function (emails, draftId, onProgress, onComplete, onError) {
      let first = true;
      let checkStartTime = getCurTimeStamp();
      let repeatCount = 0;
      const reqOnce = function (emails: Array<{ email: string; name?: string; sourceName?: string }>, businessMap: BusinessMapModel | null) {
        // 更新初始时间，仅记录最后一次失败的耗时
        checkStartTime = getCurTimeStamp();
        repeatCount++;
        edmApi
          .checkEmailAddress(
            {
              draftId: draftId,
              contacts: emails,
              businessMap: businessMap,
              first,
              businessType,
              useOrgQuota,
              senderEmailInfos: senderEmails,
            },
            {
              operator: handler => {
                _httpCancelHandler = handler;
              },
            }
          )
          .then(data => {
            recordTrackTime('checkTime', 'reduceTime', getCurTimeStamp() - checkStartTime);
            if (canceled) return;
            errorCount = 0;
            const checkedList: InvalidEmailData[] = [];
            const unCheckedList: Array<{ email: string; name?: string; sourceName: string }> = [];
            data.verifyContactList.forEach((item: InvalidEmailData) => {
              if (item.verifyStatus === -1) {
                unCheckedList.push({ email: item.contactEmail, name: item.contactName, sourceName: item.sourceName || '' });
              } else {
                checkedList.push(item);
              }
            });
            if (checkedList.length) {
              onProgress(checkedList);
            }
            if (unCheckedList.length) {
              clearBeforeClose();
              if (timer.current == -1) {
                return;
              }
              timer.current = setTimeout(() => {
                reqOnce(unCheckedList, data.businessMap);
              }, interval);
            } else {
              onComplete();
            }
          })
          .catch(e => {
            if (e?.code === 100) {
              onError(e.message, checkStartTime, repeatCount);
              return;
            }
            if (canceled) return;
            errorCount++;
            if (errorCount >= maxError) {
              onError('超过最大重试次数，过滤失败', checkStartTime, repeatCount);
              return;
            }
            // setStage('complete');
            toast.error(e?.message || '过滤失败');
            clearBeforeClose();
            if (timer.current == -1) {
              return;
            }
            timer.current = setTimeout(() => {
              reqOnce(emails, null);
            }, interval);
          });
        first = false;
      };
      reqOnce(emails, null);
      return () => {
        canceled = true;
        _httpCancelHandler && _httpCancelHandler('abort');
        clearBeforeClose();
      };
    };
  };

  const setV2Result = (i: EdmSendConcatInfo) => {
    if ((i.contactStatusList?.length || 0) === 0) {
      i.contactStatusList = [i.contactStatus || 0];
    }
    v2ResultKV.current.set(i.contactEmail, i);
  };
  const setCheckResult = (i: InvalidEmailData) => {
    if ((i.verifyStatusList?.length || 0) === 0) {
      i.verifyStatusList = [i.verifyStatus || 1];
    }
    checkResultKV.current.set(i.contactEmail, i);
  };

  const isV2Invalid = (contactStatus?: number) => {
    let code = contactStatus || 0;
    // v2 的 0 是可用
    if (code === 0) {
      return false;
    }
    return ContactInvalidStatus.includes(code);
  };
  // const getV2Reason = (contactStatus?: number) => {
  //   let code = contactStatus || 0;
  //   return idToLabelMap.get(code) || '';
  // };

  const isCheckInvalid = (verifyStatus?: number) => {
    let code = verifyStatus || 0;
    if (code === 0) {
      return true;
    }
    return !EmailOtherStatusList.includes(code);
  };

  const refresh = () => {
    setRefreshKey(!refreshKey);
  };

  const defaultCheckIfNeeded = (model: DisplayModel) => {
    let shouldDefaultSelected = false;
    model.v2?.contactStatusList?.forEach(i => {
      let value = idToValueMap.get(i || 0) || '';
      if (guardString(value) && originChecked.includes(value)) {
        shouldDefaultSelected = true;
      }
    });
    model.check?.verifyStatusList?.forEach(i => {
      let value = idToValueMap.get((i || 0) + 100) || '';
      if (guardString(value) && originChecked.includes(value)) {
        shouldDefaultSelected = true;
      }
    });
    model.checked = shouldDefaultSelected;
  };

  const hitSearch = (i: EdmSendConcatInfo, word: string) => {
    return i.contactEmail.includes(word) || i.contactName.includes(word);
  };

  const isInvalidReceiver = (r: EdmSendConcatInfo) => {
    let v2Resp = v2ResultKV.current.get(r.contactEmail);
    let v2Invalid = (v2Resp?.contactStatusList?.filter(i => isV2Invalid(i)).length || 0) > 0;

    // Check
    let checkResp = checkResultKV.current.get(r.contactEmail);
    let checkInvalid = (checkResp?.verifyStatusList?.filter(i => isCheckInvalid(i)).length || 0) > 0;
    return v2Invalid || checkInvalid;
  };

  useEffect(() => {
    if (allResultKV.current.size > 0) {
      handleAllResult(true);
    }
    edmDataTracker.track(currentPageTrackName, {
      action: 'search',
    });
  }, [searchWord]);

  const setDefaultCheckState = () => {
    receivers.forEach(r => {
      let v = allResultKV.current.get(r.contactEmail);
      if (v) {
        defaultCheckIfNeeded(v);
      }
    });
  };

  const handleAllResult = (ignoreSelectState?: boolean) => {
    displayKV.current.clear();
    invalidKV.current.clear();
    exceptionKV.current.clear();
    noExceptionKV.current.clear();

    filterData.current.clear();
    allParentList.forEach(i => {
      filterData.current.set(i.id, cloneDeep(i));
    });

    let originCheckedReady = originChecked.length > 0;
    // 1. 根据用户输入的邮箱做循环
    receivers?.forEach(r => {
      if (r.logicDelete) {
        return;
      }
      let searching = guardString(searchWord);
      if (searching && !hitSearch(r, searchWord)) {
        return;
      }

      // V2
      let v2Resp = v2ResultKV.current.get(r.contactEmail);
      let v2Invalid = (v2Resp?.contactStatusList?.filter(i => isV2Invalid(i)).length || 0) > 0;
      let v2NoException = (v2Resp?.contactStatusList?.filter(i => i === 0).length || 0) > 0;
      r.contactStatus = v2Resp?.contactStatus;
      r.contactStatusList = v2Resp?.contactStatusList;

      // Check
      let checkResp = checkResultKV.current.get(r.contactEmail);
      let checkInvalid = (checkResp?.verifyStatusList?.filter(i => isCheckInvalid(i)).length || 0) > 0;
      let checkNoException = (checkResp?.verifyStatusList?.filter(i => i === 1).length || 0) > 0;
      r.verifyStatus = checkResp?.verifyStatus;
      r.verifyStatusList = checkResp?.verifyStatusList;

      // Display
      let v = allResultKV.current.get(r.contactEmail);
      if (!v) {
        v = {
          v2: v2Resp,
          check: checkResp,
          invalid: v2Invalid || checkInvalid,
          exception: !(v2NoException && checkNoException),
          openStatus: '',
          openHeight: 44,
        };
        allResultKV.current.set(r.contactEmail, v);
      }
      if (!ignoreSelectState && originCheckedReady) {
        defaultCheckIfNeeded(v);
      }

      displayKV.current.set(r.contactEmail, v);

      if (v2Invalid || checkInvalid) {
        invalidKV.current.set(r.contactEmail, v);
      }
      if (v2NoException && checkNoException) {
        noExceptionKV.current.set(r.contactEmail, v);
      } else {
        exceptionKV.current.set(r.contactEmail, v);
      }
    });

    let invalidInfo = filterData.current.get(-1);
    if (invalidInfo) {
      invalidInfo.emails = [];
    }
    displayKV.current.forEach((v, k) => {
      v.v2?.contactStatusList?.forEach(i => {
        let code = i || 0;
        let model = filterData.current.get(code);
        let emails = model?.emails || [];
        if (!emails.includes(k)) {
          emails.push(k);
        }
        if (model) {
          model.emails = emails;
          filterData.current.set(code, model);
        }
      });
      v.check?.verifyStatusList?.forEach(i => {
        let code = (i || 0) + 100;
        let model = filterData.current.get(code);
        let emails = model?.emails || [];
        if (!emails.includes(k)) {
          emails.push(k);
        }
        if (model) {
          model.emails = emails;
          filterData.current.set(code, model);
        }
      });

      if (invalidKV.current.get(k)) {
        invalidInfo?.emails?.push(k);
      }
    });

    constructTotalSummaryData();
    refresh();
  };

  const checkContactValiteIfNeeded = async () => {
    if (v2ResultKV.current.size === 0 && checkResultKV.current.size === 0) {
      checkContactValite();
      return;
    }

    let needFetchServer = false;
    receivers.forEach(i => {
      let mail = i.contactEmail;
      if (!v2ResultKV.current.has(mail) && !checkResultKV.current.has(mail)) {
        needFetchServer = true;
      }
    });
    if (needFetchServer) {
      checkContactValite();
    } else {
      setStage('complete');
    }
  };

  const checkContactValite = async () => {
    const needStatusList = receivers.map(receiver => {
      return {
        email: receiver.contactEmail,
        name: receiver.contactName,
        sourceName: receiver.sourceName || '',
      };
    });
    filterStartTime = getCurTimeStamp();
    if (needStatusList.length > 6000) {
      let eachLength = Math.ceil(needStatusList.length / 4);
      const mailSplitedList = splitList(needStatusList, eachLength);
      const promiseList: Promise<ResponseContactsStatus>[] = mailSplitedList.map(item => {
        return edmApi.getContactsStatusV2({ contacts: item, draftId: draftId as string });
      });
      try {
        recordTrackTime('v2Time', 'begin');
        const resList = (await Promise.all(promiseList)) as any;
        recordTrackTime('v2Time', 'end');
        let contactInfoList: EdmSendConcatInfo[] = [];
        if (resList.length > 0) {
          resList.forEach(res => {
            const { contactInfoList: list } = res;
            contactInfoList.forEach(i => {
              setV2Result(i);
            });
            contactInfoList = contactInfoList.concat(list);
          });
        }
        handleV2Result(contactInfoList);
      } catch (e) {
        setStage('complete');
        toast.error(e?.message || '过滤失败');
        trackEdmVerifyFail('v2', { reason: e?.message, timeout: getCurTimeStamp() - filterStartTime, contactSize: eachLength });
      }
    } else {
      try {
        recordTrackTime('v2Time', 'begin');
        const res = await edmApi.getContactsStatusV2({
          contacts: needStatusList,
          draftId: draftId as string,
        });
        recordTrackTime('v2Time', 'end');
        const { contactInfoList } = res;
        contactInfoList.forEach(i => {
          setV2Result(i);
        });
        handleV2Result(contactInfoList);
      } catch (e) {
        setStage('complete');
        toast.error(e?.message || '过滤失败');
        trackEdmVerifyFail('v2', { reason: e?.message, timeout: getCurTimeStamp() - filterStartTime, contactSize: needStatusList.length });
      }
    }
  };

  const processCallback = (totalPercent: number, hasCheckedEmails: InvalidEmailData[], originCheckedCount: number) => {
    setPercent(totalPercent > 100 ? 100 : totalPercent);
    setCheckedCount(hasCheckedEmails.length + originCheckedCount);
  };

  const successCallback = () => {
    setPercent(100);
    setStage('complete');
  };

  const processCallbackEvent = useCreateCallbackForEvent(processCallback);
  const successCallbackEvent = useCreateCallbackForEvent(successCallback);

  const checkEmailsValite = () => {
    const emails = needCheckEmails;
    const originPercent = percent;
    const originCheckedCount = checkedCount;
    let hasCheckedEmails: InvalidEmailData[] = [];
    const taskFn = createPollTaskForEmailAddress(3000);

    const cancelTaskFn = taskFn(
      emails,
      draftId as string,
      function (data: InvalidEmailData[]) {
        // 因为第一个接口已经到了50%， 所以在50%的基础上加
        hasCheckedEmails = hasCheckedEmails.concat(data);
        const totalPercent = Number(((hasCheckedEmails.length / receivers.length) * 100 + originPercent).toFixed(2)) || 0;
        data.forEach(item => {
          setCheckResult(item);
          // -1 未检测， 1是检测成功的过滤

          if (!item.verifyStatusList?.includes(-1)) {
            EmailsVerifyStatusMap.current.set(item.contactEmail, item.verifyStatus);
          }
        });

        // handleInvalidMap();
        processCallbackEvent(totalPercent, hasCheckedEmails, originCheckedCount);
      },
      function () {
        // TODO: count
        // successCallbackEvent(count);
        successCallbackEvent();
        sendCompleteTracker();
      },
      function onError(reason: any, checkStartTime: number, repeatCount: number) {
        setStage('complete');
        // error处理
        toast.error({ content: reason || '过滤失败' });
        trackEdmVerifyFail('check', { reason, timeout: getCurTimeStamp() - checkStartTime, contactSize: emails.length, repeatCount: repeatCount });
        closeAndClearTime(true);
      }
    );
    return cancelTaskFn;
  };

  const toastInvalidWarning = () => {
    SiriusModal.info({
      title: '有无效地址未被清除，是否清除全部无效地址？',
      content: '如果过滤结果为无效地址，实际发送后发生退信或拒信，系统不退回发信次数',
      okCancel: true,
      cancelText: '保持现状',
      okText: '清除无效地址',
      onOk(...args) {
        clearInvalidEmails(true);
        run(false);
        edmDataTracker.track('pc_markting_edm_filterWrong', {
          show: true,
          click: 'delete',
        });
      },
      onCancel(...args) {
        run(false);
        edmDataTracker.track('pc_markting_edm_filterWrong', {
          show: true,
          click: 'keep',
        });
      },
      maskClosable: false,
    });
  };

  const getEmailsListByMap = () => {
    let filter = new Map<string, string[]>();
    var allSafeEmails: string[] = [];
    allParentList.forEach(i => {
      filter.set(i.value, cloneDeep(i.emails || []));
    });

    allResultKV.current.forEach((v, k) => {
      if (!v.exception && !v.invalid) {
        allSafeEmails.push(k);
      }
      v.v2?.contactStatusList?.forEach(i => {
        let code = i || 0;
        let value = idToValueMap.get(code);
        if (!value) {
          return;
        }
        let emails = filter.get(value) || [];
        // let emails = model?.emails || [];
        if (!emails.includes(k)) {
          emails.push(k);
        }
        filter.set(value, emails);
      });
      v.check?.verifyStatusList?.forEach(i => {
        let code = (i || 0) + 100;
        let value = idToValueMap.get(code);
        if (!value) {
          return;
        }
        let emails = filter.get(value) || [];
        if (!emails.includes(k)) {
          emails.push(k);
        }
        filter.set(value, emails);
      });
    });
    filter.set('valid', allSafeEmails);
    return filter;
  };

  const trackEdmVerifyFail = (type: 'v2' | 'check', params: { reason: any; timeout: number; contactSize: number; repeatCount?: number }) => {
    edmDataTracker.trackEdmVerifyFail();
    const { reason, timeout, contactSize, repeatCount } = params;
    if (type === 'v2') {
      edmDataTracker.trackEdmVerifyFailV2Error(reason, timeout, contactSize);
    }
    if (type === 'check') {
      edmDataTracker.trackEdmVerifyFailCheckError(reason, timeout, contactSize, repeatCount || 0);
    }
  };

  const sendTracks = () => {
    // edmDataTracker.trackMarktingEdmFilterType(checkedList.filter(item => item !== 'invalid').join() || '');
    // edmDataTracker.trackMarktingEdmFilterEnding(getListCount('selected') === 0 ? 'confirm' : 'delete');
  };

  const getCurTimeStamp = () => {
    return new Date().valueOf();
  };

  const hasUnClearInvalidEmails = () => {
    for (let i of receivers) {
      if (!i.logicDelete && allResultKV.current.get(i.contactEmail)?.invalid) {
        return true;
      }
    }
    return false;
  };

  const deleteFromAddressBookIfNeeded = async () => {
    if (!deleteAddressbookChecked) {
      return;
    }

    let removedEmails = receivers
      .filter(i => {
        return i.logicDelete && isInvalidReceiver(i);
      })
      .map(i => i.contactEmail);

    if (removedEmails.length > 0) {
      await addressbookApi.asyncDeleteContactsByEmails({
        emails: removedEmails,
      });
    }
  };

  const { run, loading: lockRemoveContact } = useRequest<any, any[]>(
    async (showWarning: boolean, reAdd: boolean) => {
      // 是否有'无效地址'
      let totalInvailidCount = summaryData?.invalidLeft || 0;
      if (showWarning && totalInvailidCount > 0) {
        toastInvalidWarning();
        return;
      }

      if (deleteAddressbookChecked) {
        deleteFromAddressBookIfNeeded();
      }

      sendTracks();
      // TODO: 这里要改  hanxu
      if (onConfirm) {
        onConfirm(
          receivers.filter(i => !i.logicDelete),
          {
            v2ResultKV: v2ResultKV.current,
            checkResultKV: checkResultKV.current,
          },
          reAdd
        );
      }
      onClose(undefined, true);
    },
    {
      manual: true,
      refreshDeps: [deleteAddressbookChecked],
    }
  );

  const cancelModal = () => {
    closeAndClearTime();
  };

  const sendCompleteTracker = () => {
    edmDataTracker.trackMarktingEdmFilterSucess();
    if (!!filterStartTime) {
      const endTime = new Date().valueOf();
      edmDataTracker.trackMarktingEdmFilterTime(endTime - filterStartTime);
    }
    filterStartTime = 0;
  };

  const clearBeforeClose = () => {
    timer.current && clearTimeout(Number(timer.current));
  };

  const closeAndClearTime = (canFilter?: boolean) => {
    clearBeforeClose();
    onClose(canFilter || false);
  };

  const cancelFilterAndSend = () => {
    edmDataTracker.trackMarktingEdmFilterDirect();
    edmDataTracker.track('pc_markting_edm_filter_wating', {
      action: 'fast',
    });
    clearBeforeClose();
    timer.current = -1 as unknown as NodeJS.Timeout;
    onCancelFilterAndSend && onCancelFilterAndSend();
  };

  const recordTrackTime = (key: 'totalTime' | 'v2Time' | 'checkTime', vKey: 'begin' | 'end' | 'reduceTime', reduceTime?: number) => {
    if (key === 'checkTime' && vKey === 'reduceTime') {
      trackTimeRef.current[key][vKey] += reduceTime || 0;
      return;
    }
    trackTimeRef.current[key][vKey] = getCurTimeStamp();
  };

  useEffect(() => {
    recordTrackTime('totalTime', 'begin');
    return () => {
      timer.current = -1 as unknown as NodeJS.Timeout;
      clearBeforeClose();
      trackTimeRef.current = cloneDeep(TrackTime);
    };
  }, []);

  useEffect(() => {
    if (stage === 'complete') {
      recordTrackTime('totalTime', 'end');
      const { totalTime, v2Time, checkTime } = trackTimeRef.current;
      const cTotalTime = totalTime.end - totalTime.begin;
      const cV2Time = v2Time.end - v2Time.begin;
      const cCheckTime = checkTime.reduceTime;
      edmDataTracker.trackEdmValidemailTime({
        totalTime: cTotalTime,
        v2Time: cV2Time,
        checkTime: cCheckTime,
        renderTime: cTotalTime - cV2Time - cCheckTime,
        contactSize: receivers.length,
      });

      handleAllResult();
    }
    if (stage === 'complete') {
      updateCurrentStep && updateCurrentStep(3);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'inProgress') {
      edmDataTracker.track('pc_markting_edm_filter_wating', {
        view: 1,
        type: showReAdd ? 0 : 1,
      });
    }
    if (stage === 'complete') {
      edmDataTracker.track(currentPageTrackName, {
        view: 1,
        type: showReAdd ? 0 : 1,
        delet: deleteAddressbookChecked ? 1 : 0,
      });
    }
  }, [stage]);

  useEffect(() => {
    if (needCheckEmails.length > 0) {
      checkEmailsValite();
    }
  }, [needCheckEmails]);

  useEffect(() => {
    if (visible && receivers.length > 0) {
      checkContactValiteIfNeeded();
    }
  }, [receivers, visible]);

  useEffect(() => {
    !visible && clearBeforeClose();
  }, [visible]);

  useEffect(() => {
    const moduleName = location.hash.substring(1).split('?')[0];
    if (!/(edm|wmData|intelliMarketing)/g.test(moduleName)) {
      closeAndClearTime();
    }
  }, [location.hash]);

  useEffect(() => {
    controlMinimize && controlMinimize({ show: minimize, data: { checkedCount, percent } });
  }, [checkedCount, percent]);

  const clearEmail = (email: string) => {
    edmDataTracker.track(currentPageTrackName, {
      action: 'deletSingle',
      delet: deleteAddressbookChecked ? 1 : 0,
    });
    for (const index in receivers) {
      if (receivers[index].contactEmail === email) {
        receivers[index].logicDelete = true;
        break;
      }
    }
    handleAllResult(true);
  };

  const clearInvalidEmails = (ignoreSearch?: boolean) => {
    edmDataTracker.track(currentPageTrackName, {
      action: 'deletWrong',
      delet: deleteAddressbookChecked ? 1 : 0,
    });

    receivers.forEach(i => {
      if (ignoreSearch) {
        if (allResultKV.current.get(i.contactEmail)?.invalid) {
          i.logicDelete = true;
        }
      } else {
        if (invalidKV.current.has(i.contactEmail)) {
          i.logicDelete = true;
        }
      }
    });
    handleAllResult(true);
  };
  const clearExceptionEmails = () => {
    edmDataTracker.track(currentPageTrackName, {
      action: 'deletSpeical',
      delet: deleteAddressbookChecked ? 1 : 0,
    });
    receivers.forEach(i => {
      if (exceptionKV.current.has(i.contactEmail)) {
        i.logicDelete = true;
      }
    });
    handleAllResult(true);
  };
  const clearSelectedEmails = () => {
    edmDataTracker.track(currentPageTrackName, {
      action: 'deletSelect',
      delet: deleteAddressbookChecked ? 1 : 0,
    });
    receivers.forEach(i => {
      let v = displayKV.current.get(i.contactEmail);
      if (v && v.checked) {
        i.logicDelete = true;
      }
    });
    handleAllResult(true);
  };

  const FooterComp = () => {
    let total = summaryData?.totalLeft || 0;
    let exception = summaryData?.exceptionLeft || 0;

    var shouldShowReAdd = showReAdd;
    if (existEmailCount > 0) {
      shouldShowReAdd = false;
    }

    return (
      <div className={classname(style.footerOperation, hideModalWrap ? style.footerOperationHideModal : {})}>
        <div>
          * 本次预计添加{total}个联系人，其中包含{exception}个特殊状态地址。
          {existEmailCount > 0 ? `历史已添加${existEmailCount}个收件人` : ''}
        </div>
        <div className={style.footerBtn}>
          <Button
            btnType="minorLine"
            onClick={() => {
              edmDataTracker.track(currentPageTrackName, {
                action: 'cancel',
                delet: deleteAddressbookChecked ? 1 : 0,
              });
              onClose(undefined, false);
            }}
          >
            取消
          </Button>
          {shouldShowReAdd && (
            <Button
              btnType="primary"
              onClick={() => {
                run(false, true);
              }}
            >
              增加收件人
            </Button>
          )}

          <HollowOutGuide
            // enable={showNewFeatureGuide}
            enable={true}
            className={style.hollow}
            guideId={guideId}
            title={'过滤模块全新升级'}
            intro={'确认收件人，添加剩余保留的地址'}
            step={3}
            placement="topRight"
            onClose={() => {
              setShowNewFeatureGuide(false);
            }}
          >
            <Button
              loading={lockRemoveContact}
              btnType="primary"
              onClick={() => {
                edmDataTracker.track(currentPageTrackName, {
                  action: 'confirm',
                  delet: deleteAddressbookChecked ? 1 : 0,
                });
                run(true);
              }}
            >
              确认收件人
            </Button>
          </HollowOutGuide>
        </div>
      </div>
    );
  };

  const handleCloseMinimize = () => {
    setMinimize(false);
    controlMinimize && controlMinimize({ show: false });
  };

  const InvalidEmailWarningComp = () => {
    if (showInvaliWarning && hasUnClearInvalidEmails()) {
      return (
        <div className={style.invalidWarning}>
          <div className={style.left}>
            <img src={WarningIcon} className={style.warningIcon} />
            建议将无效地址全部清除，如果过滤结果为无效地址，实际发送后发生退信或拒信，系统不退回发信次数
          </div>
          <img
            src={CloseIcon}
            className={style.closeIcon}
            onClick={() => {
              setShowInvaliWarning(false);
            }}
          />
        </div>
      );
    }
    return null;
  };

  const InProgressComp = () => {
    if (stage === 'inProgress') {
      return (
        <div className={style.inNewProgressWrap}>
          <img style={{ marginTop: '20px' }} src={gif} alt="" width="130" height="130" />
          <div className={style.percentInfo}>
            {getIn18Text('YIGUOLV')}
            <span className={style.color}>{checkedCount}</span>&nbsp;条数据...&nbsp;
            <span>({percent}%)</span>
          </div>

          <div className={style.tipsInfo}>可最小化等待，或选择直接过滤，自动发送且清除无效地址</div>
          <Progress strokeColor="#4C6AFF" className={style.progress} percent={percent} showInfo={false} />
          <div className={style.warnInfo}>
            <div className={style.warnInfoItem}>
              <RightIcon fillColor1="#4C6AFF" fillColor2="#94A6FF" />
              <span className={style.warnInfoText}>{getIn18Text('JIANCHADEZHIGESHISHI')}</span>
            </div>
            <div className={style.warnInfoItem}>
              <RightIcon fillColor1="#6FE6B5" fillColor2="#0FD683" />

              <span className={style.warnInfoText}>{getIn18Text('JIANCHADUIFANGFUWUQI')}</span>
            </div>
            <div className={style.warnInfoItem}>
              <RightIcon fillColor1="#FFD394" fillColor2="#FFB54C" />
              <span className={style.warnInfoText}>{getIn18Text('JIANCHAYOUXIANGHUOYUEZHUANG')}</span>
            </div>
            <div className={style.warnInfoItem}>
              <RightIcon fillColor1="#83B3F7" fillColor2="#3081F2" />
              <span className={style.warnInfoText}>{getIn18Text('SHIBIEGONGGONGYOUXIANG、')}</span>
            </div>
          </div>
          {minimizeable && (
            <div className={style.newBtns}>
              {!hideDirectSendButton && (
                <Button btnType="minorLine" onClick={cancelFilterAndSend}>
                  直接过滤并发送
                  <Tooltip placement="top" title={getIn18Text('QIEHUANBIANJIEFASONGXI')} arrowPointAtCenter>
                    <ExplanationIcon className={style.btnIcon} />
                  </Tooltip>
                </Button>
              )}

              <Button
                btnType="primary"
                onClick={() => {
                  edmDataTracker.trackMarktingEdmFilterMinimize();
                  edmDataTracker.track('pc_markting_edm_filter_wating', {
                    action: 'min',
                  });
                  setMinimize(true);
                  controlMinimize && controlMinimize({ show: true, data: { checkedCount, percent } });
                }}
              >
                最小化
              </Button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderActionComp = () => {
    let selectedCount = 0;
    displayKV.current.forEach(i => {
      if (i.checked) {
        selectedCount += 1;
      }
    });

    return (
      <div className={style.actionArea}>
        <Button btnType="minorLine" onClick={clearSelectedEmails}>
          清除选中地址({selectedCount})
        </Button>
        <Button btnType="minorLine" onClick={clearExceptionEmails}>
          清除特殊地址({exceptionKV.current.size})
        </Button>
        <Button
          btnType="minorLine"
          onClick={() => {
            clearInvalidEmails(false);
          }}
        >
          清除无效地址({invalidKV.current.size})
        </Button>
        <Checkbox
          checked={deleteAddressbookChecked}
          onChange={e => {
            setDeleteAddressbookChecked(e.target.checked);
          }}
        >
          在营销联系人同步删除选中的无效地址
        </Checkbox>
      </div>
    );
  };

  // 邮件地址/联系人姓名筛选变化 缓存函数使debounce生效
  const updateContactInput = useCallback(
    debounce(val => {
      setSearchWord(val);
    }, 300),
    []
  );

  const handleInput = e => {
    const val: string = e?.target?.value || '';
    updateContactInput(val.trim());
  };

  const CompleteComp = () => {
    if (stage !== 'complete') {
      return null;
    }
    let hasException = noExceptionKV.current.size < receivers.length;
    const abnormalCount = summaryData?.exceptionTotal || 0;

    let texta = (
      <div className={style.header}>
        共过滤<span className={style.color}>&nbsp;{summaryData?.totalCheck}&nbsp;</span>个收件人，其中有
        <span className={style.color}>&nbsp;{summaryData?.exceptionTotal}&nbsp;</span>
        条特殊状态地址，请选择地址清除
      </div>
    );

    let textb = <div className={style.header}>共过滤{receivers.length}个收件人，全部为正常状态，请确认收件人</div>;
    return (
      <>
        {hasException && abnormalCount > 0 ? texta : textb}
        {InvalidEmailWarningComp()}
        <div className={style.titleWrap}>
          <div className={style.title}>已选地址列表</div>
          <Input
            className={style.input}
            placeholder={getIn18Text('QINGSHURUYXDZ')}
            onChange={handleInput}
            prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
          />
        </div>
        {renderParentCheckBox()}
        {renderActionComp()}
        {renderChildCheckBox()}
      </>
    );
  };

  const NoneMinimizeComp = () => {
    if (hideModalWrap) {
      return (
        <div className={style.validEmailAddress} id='add-contact-root-id"'>
          <div className={style.modalBody}>
            {InProgressComp()}
            {CompleteComp()}
          </div>
          {stage === 'complete' ? FooterComp() : null}
        </div>
      );
    }
    return (
      <Modal
        visible={visible}
        width={stage === 'complete' ? 836 : 418}
        className={style.validEmailAddress}
        onCancel={cancelModal}
        afterClose={clearBeforeClose}
        maskClosable={false}
        destroyOnClose={true}
        closable={true}
        centered={true}
        bodyStyle={{ height: 'auto', paddingBottom: stage === 'complete' ? '8px' : '24px' }}
        footer={stage === 'complete' ? FooterComp() : null}
      >
        {/* loading */}
        <div className={style.modalBody}>
          {InProgressComp()}
          {CompleteComp()}
        </div>
      </Modal>
    );
  };

  if (!hideModalWrap && minimize) {
    return <Minimize checkedCount={checkedCount} percent={percent} closeMinimize={handleCloseMinimize} />;
  }
  return NoneMinimizeComp();
});

// 这里用于其他业务直接调起过滤联系人弹窗
export const showValidEmailAddressModal = (props: Omit<ModalProps & ValidEmailModalProps, 'visible'>) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const closeHandler = () => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
    props.onClose();
  };
  ReactDOM.render(<ValidEmailAddressModal visible {...props} onClose={closeHandler} />, container);
};
