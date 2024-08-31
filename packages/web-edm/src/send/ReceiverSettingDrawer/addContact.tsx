import React, { useEffect, useState, useRef, useContext, useCallback, useReducer, useMemo, useImperativeHandle } from 'react';
import classnames from 'classnames';
import style from './receiver.module.scss';
import cStyle from './addContact.module.scss';
import { Button, Checkbox, Input, Tabs, Tooltip, Popover, ConfigProvider, message } from 'antd';
import SiriusModal from '@lingxi-common-component/sirius-ui/SiriusModal';

import { apiHolder, apis, EdmSendConcatInfo, EdmSendBoxApi, ICustomerContactData, FieldSettingApi, ResponseFilterCount, DataStoreApi, PrevScene } from 'api';
import { getDataFromHtml, guardString, isValidEmailAddress, onHttpError, parseReceiverEntity } from '../../utils';
import { AddressBookPicker, IAddressContact } from '../../addressBook/views/addressBookPicker/index';
import CustomerPicker from '../../contactPicker/customer';
import PersonalContactPicker from '../../contactPicker/personalContactPicker';
import { AddReceiverType, edmDataTracker } from '../../tracker/tracker';
import { edmWriteContext } from '../edmWriteContext';
import { UserGuideContext } from '../../components/UserGuide/context';
import { PersonalContact } from '../../contactPicker/usePersonalContactGroup';
import { ReceiverList, SearchMode } from '../receiverList';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Alert from '@web-common/components/UI/Alert/Alert';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import IconCard from '@web-common/components/UI/IconCard';
import { formatFileSize } from '@web-common/utils/file';
import { usePermissionCheck } from '@/components/UI/PrivilegeEnhance';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
// import RecycleBin from '@web-common/components/UI/Icons/svgs/disk/RecycleBin';
import { ReactComponent as TongyongShanchu } from '@web-common/images/newIcon/tongyong_shanchu.svg';

import ReceiverTemplate from '../receiverTemplate';
import { AbnormalTypeModel, AbnormalType, TypesMap, AllInvalidStatusCode } from '../validEmailAddress/util';
import { ReactComponent as AskIcon } from '@/images/icons/alert/ask.svg';
import { ReactComponent as ErrorIcon } from '@/images/icons/edm/error-circle-filled.svg';
import { ReactComponent as ErrorRedIcon } from '@/images/icons/edm/error-circle-filled-red.svg';
import CheckCircleFilled from '@ant-design/icons/CheckCircleFilled';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import { ReactComponent as YiwenIconSvg } from '@/images/icons/edm/yingxiao/yiwen-icon.svg';
import { ReactComponent as TipsIcon } from '@/images/icons/edm/yingxiao/tips_black.svg';
import { ReactComponent as ExplanationIcon } from '@/images/icons/edm/yingxiao/explanation-gray16px.svg';
import { ValidEmailAddressModal, ValidInterface, ValidateResult, ControlMinimizeModel } from '../validEmailAddress';
import Minimize from '../validEmailAddress/minimize';
import { getIn18Text } from 'api';
import { FilterDisplay } from './filterStrategy/filterDisplay';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
// import SiriusDrawer from '@web-common/components/UI/SiriusDrawer';
import SiriusDrawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import {
  AbnormalStatusKeyMap,
  AddContactModalModel,
  AddReceiverConfig,
  EmailSourceTrackerMap,
  getClearFilterFromLocalStorage,
  getRangedValue,
  setClearFilterToLocalStorage,
} from './addContact+';
import EditProgress from '../../components/EditProgress/editProgress';

interface TemplateFileCardData {
  file: File;
  name: string;
  size: string;
  progress: number;
  uploading: boolean;
  summary?: {
    total: number;
    invalid: number;
  };
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const fieldSettingApi = apiHolder.api.requireLogicalApi(apis.fieldSettingApiImpl) as FieldSettingApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

const stepConfig = [
  {
    stepNum: 1,
    stepDesc: getIn18Text('XUANZESHOUJIANREN'),
    stepType: 'chooseContact',
    stepHide: false,
  },
  {
    stepNum: 2,
    stepDesc: '过滤收件人',
    stepType: 'filterContact',
    stepHide: false,
  },
  {
    stepNum: 3,
    stepDesc: '确认收件人',
    stepType: 'confirmContact',
    stepHide: false,
  },
];

export const AddContactModal = React.forwardRef((props: AddContactModalModel, ref) => {
  const { state, dispatch } = useContext(edmWriteContext).value || {};
  const { state: userGuideState, dispatch: userGuideDispatch = () => {} } = useContext(UserGuideContext);
  const {
    visible,
    closeModal,
    hasVariable,
    containerHeight,
    capacity,
    receiveType,
    stepsInfo,
    isAddContactStep,
    validateSubmit,
    saveDraft,
    sendFilterCapacity,
    sendReceivers,
    showFilterTips,
    needCheckAllLogic = true,
    sourceFrom = 'write',
    setCloseContactStoreClueTips,
    ignoreIncreaseSourceName = false,
    senderEmails,
    controlAddContactModal,
    secondryAdd = false,
    existEmailCount = 0,
    directCheck = false,
    businessType = '',
  } = props;

  // 选中的联系人列表
  const [receivers, setReceivers] = useState<Array<EdmSendConcatInfo>>(props.receivers || []);

  const [disabledReceivers, setSisabledReceivers] = useState<Array<EdmSendConcatInfo>>(props.disableReceivers || []);

  // 最外层
  const [sReceivers, setSReceivers] = useState<Array<EdmSendConcatInfo>>(props.receivers || []);
  // 添加联系人tab
  const [activeTab, setActiveTab] = useState('1');
  // 错误弹窗展示
  const [warningIsShow, setWarningIsShow] = useState(false);
  const [showSecondryAddNoti, setShowSecondryAddNoti] = useState<boolean>(false);
  // 添加联系人loading
  const [addReceiversLoading, setAddReceiversLoading] = useState<boolean>(false);
  // 是否过滤过
  const [hasFilted, setHasFilted] = useState<boolean>(false);
  //
  const [hasFirstFilted, setHasFirstFilted] = useState<boolean>(true);

  // 过滤弹窗是否展示
  const [noneInvalidMailsModal, setNoneInvalidMailsModal] = useState(false);

  // 导入的联系人是否上传到网盘
  const [uploadEdisk, setUploadEdisk] = useState<boolean>(false);
  // 手动输入联系人框的值
  const [plainText, setPlainText] = useState('');

  // 实际发送人数限制 ===过滤数
  const [filterCapacity, setFilterCapacity] = useState<ResponseFilterCount>();
  // 是否消耗全部的过滤
  const [useOrgQuota, setUseOrgQuota] = useState<0 | 1>(0);

  // 收件人 map
  const [receiversMap, setReceiversMap] = useState<Map<string, Map<string, EdmSendConcatInfo>>>(new Map());

  const [nextStep, setNextStep] = useState<'filter' | 'normal' | ''>('');

  const [receiversChanged, setReceiversChanged] = useState<boolean>(false);

  const [hideDirectSendButton, setHideDirectSendButton] = useState(false);

  const [searchMode, setSearchMode] = useState<SearchMode>('normal');

  // 当前步骤
  const [currentStep, setCurrentStep] = useState<number>(1);

  const validateRef = useRef<ValidInterface>();
  const [reAdd, setReAdd] = useState(false);

  const [showResultPageDirect, setShowResultPageDirect] = useState(false);

  const [checkResult, setCheckResult] = useState<ValidateResult>({
    v2ResultKV: new Map(),
    checkResultKV: new Map(),
  });

  // 是否展示最小化的小窗
  const [minimizeData, setMinimizeData] = useState<ControlMinimizeModel>();

  // 是否有变量管理权限
  const hasPermission = usePermissionCheck('EDM_TMPL_VARIABLE_SETTING', 'ORG_SETTINGS', 'ORG_SETTINGS_TMPL_VARIABLE_SETTING');
  // 临时上传文件
  const [templateFile, setTemplateFile] = useReducer((state: TemplateFileCardData | null, action: { type: String; payload: any }) => {
    switch (action.type) {
      case 'setup': {
        return action.payload;
      }
      case 'updateProgress': {
        return { ...state, progress: action.payload };
      }
      case 'setUploading': {
        return { ...state, uploading: action.payload };
      }
      case 'setSummary': {
        return { ...state, summary: action.payload };
      }
    }
  }, null);

  // 上传文件控件ref
  const fileRef = useRef<HTMLInputElement>(null);
  // 当前组件ref
  const receiverRef = useRef<HTMLDivElement>(null);
  const sendCapacity = state?.sendCapacity;
  // 发送人数限制
  const CAPACITY = props.capacity;
  const systemLang = window?.systemLang || 'zh';
  const search = new URLSearchParams(location.href);
  const isGlobalSearch = search.get('businessType') === 'global_search';
  const sSendType = search.get('sendType');
  const isFormCopyTask = search.get('from') === 'copyTask';

  // 是否可以点击过滤按钮
  const canFilter = useMemo(() => receivers.length > 0 && !hasFilted, [receivers, hasFilted]);

  // 退订数
  const unsubscribeCount = useMemo(() => receivers.reduce((s, a) => (s += a.contactStatus === 2 ? 1 : 0), 0), [receivers]);

  const receiverSortFn = (a: any, b: any) => {
    return a.contactStatus !== undefined && b.contactStatus !== undefined ? b.contactStatus - a.contactStatus : 1;
  };

  const updateCheckResult = (resp: ValidateResult) => {
    resp.v2ResultKV?.forEach((v, k) => {
      checkResult.v2ResultKV?.set(k, v);
    });
    resp.checkResultKV?.forEach((v, k) => {
      checkResult.checkResultKV?.set(k, v);
    });
    setCheckResult(checkResult);
  };

  const receiverSort = (receivers: EdmSendConcatInfo[]) => {
    const formatReceivers: EdmSendConcatInfo[] = [];
    let otherReceivers: EdmSendConcatInfo[] = [];
    receivers.forEach(item => {
      if (item.contactStatus === 3) {
        formatReceivers.push(item);
      } else {
        otherReceivers.push(item);
      }
    });
    otherReceivers.sort(receiverSortFn);
    return formatReceivers.concat(otherReceivers);
  };

  const getWarnText = (
    validCount: number,
    duplicateCount: number,
    invalidCount: number,
    unsubscribeCount: number,
    blacklistCount: number,
    sendLimitCount: number = 0
  ) => {
    const str = `解析${validCount - blacklistCount}个有效地址`;
    let optional = [
      `${duplicateCount}个已重复`,
      `${invalidCount}个错误地址`,
      `${unsubscribeCount}个历史退订地址`,
      `${blacklistCount}个黑名单地址`,
      `${sendLimitCount}个发信限制地址`,
    ];
    const arr = [duplicateCount, invalidCount, unsubscribeCount, blacklistCount, sendLimitCount];
    optional = optional.filter((s, i) => arr[i] > 0);
    if (optional.length > 0) {
      return str + getIn18Text('，QIZHONG') + optional.join('，');
    }
    return str;
  };

  useEffect(() => {
    if (directCheck) {
      setTimeout(() => {
        handleNextStep();
      }, 0);
    }
  }, [directCheck]);

  // 切换到添加联系人步骤时，如果当前是添加联系人小窗状态且已经过滤完成，则打开添加联系人抽屉
  useEffect(() => {
    if (isAddContactStep && minimizeData?.data?.percent === 100) {
      handleCloseMinimize();
    }
  }, [isAddContactStep]);

  /**
   * 各种方式添加联系人方式综合处理
   * @param newReceivers 新加入的联系人列表
   * @param silence 是否展示默认去除重复联系人弹窗
   * @returns 是否添加成功
   */
  const addReceivers = async (params: AddReceiverConfig) => {
    const { newReceivers, autoGetContactStatus, isAdd = true, silence, fromType } = params;
    const map: Record<string, number> = {};
    const oldLength = isAdd ? receivers.length : 0;
    if (isAdd) {
      receivers.forEach(r => {
        map[r.contactEmail] = 1;
      });
    }
    const list: EdmSendConcatInfo[] = [];
    const needStatusList: Array<{ email: string; name: string }> = [];
    const hasOldReceivers = isAdd && receivers.length > 0;
    let validCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;
    let unsubscribeCount = 0;
    let blacklistCount = 0;
    let sendLimitCount = 0;
    let fErrorContactsMap: Map<string, EdmSendConcatInfo> = new Map();
    newReceivers.forEach(entity => {
      const { contactName, contactStatus, blacklist } = entity;
      const contactEmail = entity.contactEmail?.trim();
      if (contactEmail && contactEmail.length !== 0) {
        // 错误地址
        const isValid = isValidEmailAddress(contactEmail);
        let sourceName = '';
        let increaseSourceName = '';
        if (isAdd) {
          if (activeTab === '2') {
            sourceName = entity.sourceName || '';
            increaseSourceName = fromType || ''; // 客户管理选择区分我的客户|我的线索
          } else if (activeTab === '1') {
            sourceName = entity.sourceName || '';
            increaseSourceName = ['1'].includes(activeTab) ? EmailSourceTrackerMap[activeTab].value : '';
          } else {
            const tabName = ['3', '4', '5'].includes(activeTab) ? EmailSourceTrackerMap[activeTab].value : '';
            sourceName = tabName;
            increaseSourceName = tabName;
          }
          if (ignoreIncreaseSourceName) {
            // 如果需要忽略increaseSourceName，则手动添加的联系人IncreaseSourceName为''，业务调用方单独赋值
            increaseSourceName = '';
          }
        } else {
          // 其他业务添加，透传外层业务传递的sourceName，如果上游未传参则为空,increaseSourceName这里置'',在写信页组装联系人时increaseSourceName赋值为prevScene
          sourceName = entity.sourceName || '';
          increaseSourceName = entity.increaseSourceName || '';
        }
        const prevScene = (new URLSearchParams(location.href).get('from') as PrevScene) || 'unknown';

        let fallbackName = guardString(increaseSourceName) ? increaseSourceName : prevScene;

        if (map[contactEmail] !== 1) {
          const contact = {
            ...entity,
            contactEmail,
            contactName: contactName || '',
            contactStatus: contactStatus || (blacklist ? 4 : !isValid ? 3 : 1),
            valid: entity.valid,
            reason: blacklist ? 'blacklist' : !isValid ? 'formatError' : '',
            sourceName: guardString(sourceName) ? sourceName : `${fallbackName}-empty`,
            increaseSourceName: fallbackName,
          };
          list.push(contact);
          map[contactEmail] = 1;
          if (!isValid || contactStatus === 3) {
            invalidCount++;
            fErrorContactsMap.set(contactEmail, contact);
          } else {
            validCount++;
            blacklist && blacklistCount++;
            needStatusList.push({ email: contactEmail, name: contactName || '' });
          }
        } else {
          duplicateCount++;
        }
      }
    });

    if (isAdd && duplicateCount > 0 && duplicateCount === newReceivers.length) {
      toast.warn(getIn18Text('ZHONGFUDEZHI，TIANJIA'));
      return;
    }

    // const limit = oldLength + list.length > CAPACITY;
    const limit = oldLength + list.length > (sendCapacity?.singleSendCount || 0);
    console.log('needCheckAllLogic========', needCheckAllLogic);
    if (limit && needCheckAllLogic) {
      setWarningIsShow(true);
      if (isFormCopyTask) {
        onSendReceivers([]);
      }
      Alert.error({
        className: style.receiverAlert,
        width: 400,
        centered: true,
        title: getIn18Text('DANCIFAJIANRENSHUCHAOXIAN\uFF0CWUFAJIXUTIANJIA'),
        content: getIn18Text('KETONGGUOYOUXIANGLIANXIKEFURENYUANSHENQINGTISHENG\u3002'),
        okText: getIn18Text('ZHIDAOLE'),
        onOk: () => setWarningIsShow(false),
        onCancel: () => setWarningIsShow(false),
      });
      return false;
    }
    // 二次添加, 需要展示提示框
    if (hasOldReceivers && validCount) {
      setShowSecondryAddNoti(true);
    } else {
      setShowSecondryAddNoti(false);
    }

    if (needStatusList.length && autoGetContactStatus) {
      const res = await getContactsStatusV2(needStatusList);
      if (res) {
        list.forEach(contact => {
          const saveOriginValue = contact.valid === false; // 是否保留原始值（“可能无效”）
          if (res.map[contact.contactEmail]) {
            Object.assign(contact, res.map[contact.contactEmail]);
          }
          if (saveOriginValue) {
            if (!contact.contactStatus || contact.contactStatus === 1) {
              contact.contactStatus = 1.5;
            }
          }
        });
        unsubscribeCount += res.unsubscribeCount;
        blacklistCount += res.blacklistCount;
        sendLimitCount += res.sendLimitCount;
      }
    }
    let ret = receivers.concat(list);
    if (!isAdd) {
      ret = list;
      // 一键营销进入， 需要将newrecieivers 同步更新，否则会使用旧的receivers
      // onSendReceivers(ret.sort(receiverSortFn));
      businessType !== 'global_search' && onSendReceivers(receiverSort(ret));
    }
    setHasFilted(false);
    // 全球搜第一次进入时，已经过滤了
    if (hasFirstFilted && isGlobalSearch && sSendType === 'filter') {
      setHasFilted(true);
      setHasFirstFilted(false);
    }
    // setReceivers(ret.sort(receiverSortFn));
    setReceivers(receiverSort(ret));
    saveReceiverMap('formatError', fErrorContactsMap); // 和 receivers 同步进行
    // 新增
    newReceivers.length > 0 && setReceiversChanged(true);
    if (!silence) {
      setWarningIsShow(true);
      if (autoGetContactStatus) {
        Alert.warn({
          className: style.receiverAlert,
          width: 400,
          centered: true,
          icon: null,
          title: getWarnText(validCount, duplicateCount, invalidCount, unsubscribeCount, blacklistCount, sendLimitCount),
          content: (
            <div>
              {getIn18Text('ZHU\uFF1A')}
              <li>{getIn18Text('-RUOYOUWEIJIANCECHUDEDEZHIYOUXIANG\uFF0CQINGZHONGXINJIANCHAGESHI')}</li>
              <li>{getIn18Text('-ZHONGFUDEZHIZIDONGQUZHONG\uFF0CBUBAOHANZAIFASONGLIEBIAOZHONG')}</li>
            </div>
          ),
          okText: getIn18Text('ZHIDAOLE'),
          onOk: () => setWarningIsShow(false),
          onCancel: () => setWarningIsShow(false),
        });
      } else {
        list.length && props.visible && toast.success(getIn18Text('YICHENGGONGTIANJIA') + list.length + getIn18Text('GESHOUJIANREN（CHONG'));
      }
    }
    edmDataTracker.trackMarktingEdmFilterSource(EmailSourceTrackerMap[activeTab].key);
    return true;
  };

  const clearReceiverMap = () => {
    setReceiversMap(new Map());
  };

  const saveReceiverMap = (key: string, contactsMap: Map<string, EdmSendConcatInfo>) => {
    const childMap = receiversMap.get(key) || new Map();
    for (const [k, v] of contactsMap) {
      childMap.set(k, v);
    }
    receiversMap.set(key, childMap);
    console.log('saveToReceiverMap==============', receiversMap);
    setReceiversMap(receiversMap);
  };

  const removeReceiverMap = (key: string, email?: string) => {
    if (!email) {
      removeBatchReceiver(key);
      receiversMap.set(key, new Map());
    } else {
      const childMap = receiversMap.get(key) || new Map();
      if (childMap) {
        childMap.delete(email);
      }
      receiversMap.set(key, childMap);
    }
    setReceiversMap(receiversMap);
  };

  const setReceiversAndDispatch = (array: EdmSendConcatInfo[]) => {
    setReceivers(array);
    if (array.length === 0) {
      dispatch({
        type: 'setState',
        payload: {
          canSend: false,
        },
      });
    }
  };

  const removeBatchReceiver = (key: string) => {
    const childMap = receiversMap.get(key) || new Map();
    const array = receivers.filter(r => !childMap.has(r.contactEmail));
    setReceiversAndDispatch(array);
    if ((props.receivers?.length || 0) > 0) {
      onSendReceivers(array, receiveType === 'filter' ? false : true, false);
    }
  };

  /**
   * 删除某条选中联系人
   * @param email
   */
  const removeReceiver = (email: string, contactStatus: number) => {
    if (contactStatus === 3) {
      removeReceiverMap('formatError', email);
    }
    const array = receivers.filter(r => r.contactEmail !== email);
    setReceiversAndDispatch(array);
    // 删除
    setReceiversChanged(true);
  };

  //
  const handleReceiverMap = (receiver: EdmSendConcatInfo) => {
    removeReceiverMap('formatError', receiver?.originContactEmail || '');
    if (receiver.contactStatus === 3) {
      const newMap = new Map();
      newMap.set(receiver.contactEmail, receiver);
      saveReceiverMap('formatError', newMap);
    }
  };

  const setValidReceiver = (receiver: EdmSendConcatInfo, type = 'valid', before: string = '') => {
    handleReceiverMap(receiver);
    if (type === 'input-edit') {
      let list: EdmSendConcatInfo[] = receivers.map(e => {
        return {
          ...e,
          contactEmail: e.contactEmail === before ? receiver.contactEmail : e.contactEmail,
          contactStatus: e.contactEmail === before ? receiver.contactStatus : e.contactStatus,
        };
      });

      setReceivers(list);
      return;
    }
    if (type === 'edit') {
      let list: EdmSendConcatInfo[] = receivers.map(e => {
        return {
          ...e,
          contactEmail: e.contactEmail === before ? receiver.contactEmail : e.contactEmail,
          contactStatus: e.contactEmail === before ? receiver.contactStatus : e.contactStatus,
        };
      });

      setReceivers(list);
      return;
    }

    setReceivers(
      receivers.map(item => {
        if (receiver === item) {
          return {
            ...receiver,
            contactStatus: 1,
          };
        }
        return item;
      })
    );
    toast.success({ content: getIn18Text('SHEZHICHENGGONG') });
  };

  /**
   * 通过服务端获取邮件的状态
   * @param needStatusList 需要获取的邮件状态列表
   * @returns
   */
  const getContactsStatusV2 = useCallback(
    async (needStatusList: Array<Record<string, string>>) => {
      setAddReceiversLoading(true);
      try {
        const res = await edmApi.getContactsStatusV2({
          contacts: needStatusList,
          draftId: state.draftId as string,
        });
        const unsubscribeCount = res.unsubscribeCount;
        const blacklistCount = res.blacklistCount;
        const sendLimitCount = res.sendLimitCount;
        const map: Record<string, EdmSendConcatInfo> = {};
        res.contactInfoList.forEach(contact => {
          map[contact.contactEmail] = contact;
        });
        return {
          map,
          unsubscribeCount,
          blacklistCount,
          sendLimitCount,
        };
      } catch (error) {
        console.error('[getContactsStatusV2] error', error);
        return undefined;
      } finally {
        setAddReceiversLoading(false);
      }
    },
    [setAddReceiversLoading]
  );

  /**
   * 通过个人联系人添加
   * @param contacts
   */
  const handleImportByContact = (contacts: PersonalContact[]) => {
    if (contacts && contacts.length) {
      addReceivers({ newReceivers: contacts });
      edmDataTracker.trackAddReciver(AddReceiverType.SelectFromPersonalContact, {
        quantity: contacts.length,
        draftID: state.draftId as string,
      });
    }
  };
  /**
   * 通过客户添加
   * @param contacts
   */
  const handleImportByCustomer = (contacts: ICustomerContactData[], fromType: string) => {
    const receivers = contacts.map(contact => {
      return {
        valid: contact.valid,
        contactEmail: contact.email,
        contactName: contact.contact_name,
        blacklist: contact.blacklist,
        sourceName: contact.source_name,
      };
    });
    addReceivers({ newReceivers: receivers, fromType: fromType });
    edmDataTracker.trackAddReciver(AddReceiverType.Select, {
      quantity: receivers.length,
      draftID: state.draftId as string,
    });
  };

  /**
   * 点击选择文件
   * @param e
   * @returns
   */
  const handleFileSelected = (e: any) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0] as File;
    setTemplateFile({
      type: 'setup',
      payload: {
        file: file,
        name: file.name,
        size: formatFileSize(file.size),
        progress: 0,
        uploading: false,
      },
    });
    e.target.value = '';
  };
  // 检测到已上传内容中有新增变量信息，批量保存
  const addDetectionVar = (variables: string[]) => {
    fieldSettingApi
      .batchAddVariable({ variableNames: variables })
      .then(data => {
        if (data) {
          message.success(getIn18Text('BAOCUNCHENGGONG'));
        } else {
          message.error(getIn18Text('BAOCUNSHIBAI'));
        }
      })
      .catch(() => {
        message.error(getIn18Text('BAOCUNSHIBAI'));
      });
  };
  /**
   * 上传文件后点击添加
   */
  const handleImportByFile = async () => {
    const file = templateFile.file;
    let id = state?.draftId;
    if (!id) {
      id = await edmApi.createDraft();
      dispatch({
        type: 'setState',
        payload: {
          draftId: id,
        },
      });
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileSize', String(file.size));
    formData.append('fileName', file.name);
    formData.append('draftId', id as string);
    formData.append('type', '1');
    formData.append('uploadEdisk', String(uploadEdisk));
    setTemplateFile({
      type: 'setUploading',
      payload: true,
    });
    // 上传、解析csv excel
    edmApi
      .uploadTemplateFile(formData, {
        onUploadProgress: (ev: ProgressEvent) => {
          setTemplateFile({
            type: 'updateProgress',
            payload: ev.loaded / ev.total,
          });
        },
      })
      .then(
        data => {
          if (!data.contactInfoList || data.contactInfoList.length === 0) {
            toast.warn({ content: getIn18Text('WEIJIANCEDAOYOUXIAOLIANXIREN\uFF0CQINGJIANCHAWENJIAN') });
            return;
          }
          edmDataTracker.trackAddReciver(AddReceiverType.Import, {
            draftID: id as string,
            quantity: data.contactInfoList.length,
          });
          // TODO: 这里得看一下 contactStatus逻辑 @hanxu
          // 临时上传文件
          setTemplateFile({
            type: 'setSummary',
            payload: {
              total: data.contactInfoList.length,
              invalid: data.contactInfoList.reduce((sum, a) => (sum += a.contactStatus === 3 ? 1 : 0), 0),
            },
          });
          // 添加联系人
          addReceivers({ newReceivers: data.contactInfoList });
          if (data.extraVariables && data.extraVariables.length > 0 && hasPermission) {
            // 检测到已上传内容中有新增变量信息，提示是否直接保存至自定义变量
            Modal.confirm({
              icon: null,
              title: (
                <p style={{ display: 'flex', flexDirection: 'row', marginBottom: '0' }}>
                  <span style={{ marginRight: '8px' }}>
                    <ErrorIcon />
                  </span>
                  <span style={{ color: '#272E47', fontSize: '16px', lineHeight: '24px', fontWeight: '500' }}>{getIn18Text('JIANCEDAOYISHANGCHUANNEI')}</span>
                </p>
              ),
              content: null,
              okText: getIn18Text('BAOCUN'),
              onOk: () => addDetectionVar(data.extraVariables),
              cancelText: getIn18Text('setting_system_switch_cancel'),
            });
          }
        },
        data => {
          if (data?.code === 100) {
            setWarningIsShow(true);
            Alert.warn({
              className: style.receiverAlert,
              centered: true,
              width: 400,
              title: getIn18Text('SHOUJIANRENSHULIANGCHAOCHUZUIDAXIANZHI\uFF0CQINGSHANJIANLIANXIRENHOUZHONGXINSHANGCHUAN\u3002'),
              okText: getIn18Text('ZHIDAOLE'),
              onOk: () => setWarningIsShow(false),
              onCancel: () => setWarningIsShow(false),
            });
            return;
          } else if (data.status === undefined || data.status < 500) {
            onHttpError(data);
          }
        }
      )
      .finally(() => {
        setTemplateFile({
          type: 'setUploading',
          payload: false,
        });
      });
  };
  /**
   * 手动添加联系人发生变化
   * @param e
   */
  const handlePlainTextChange = (e: any) => {
    setPlainText(e.target.value);
  };
  /**
   * 通过手动添加联系人
   * @returns
   */
  const addFromPlainText = async () => {
    console.log('Yao plainText', plainText);
    const rows = plainText.split(/[;；\n]+/).filter(s => s.length > 0);
    if (!rows.length) {
      return;
    }
    const entities = rows.map(row => parseReceiverEntity(row));

    const isSuccess = await addReceivers({ newReceivers: entities });
    isSuccess && setPlainText('');
    edmDataTracker.trackAddReciver(AddReceiverType.Manual, { quantity: entities.length, draftID: state.draftId as string });
  };

  /**
   * 一键清空所有联系人
   */
  const handleRemoveAll = () => {
    Modal.confirm({
      title: getIn18Text('SHIFOUQINGKONGSHOUJIANRENLIEBIAO'),
      okText: getIn18Text('QINGKONG'),
      cancelText: getIn18Text('QUXIAO'),
      onOk: () => {
        setShowSecondryAddNoti(false);
        setReceivers([]);
        clearReceiverMap();
        setReceiversChanged(true);
      },
    });
  };

  const formatErrorModalComp = (nextStep: 'filter' | 'normal') => {
    Modal.confirm({
      title: `存在${receiversMap.get('formatError')?.size || 0}个格式错误的地址，无法进行过滤，请修改或清除地址`,
      okText: '一键清除',
      cancelText: '去查看',
      onOk: () => {
        removeReceiverMap('formatError');
        setNextStep(nextStep);
      },
      onCancel(...args) {
        controlAddContactModal && controlAddContactModal(true);
      },
    });
  };

  const handleNextStep = () => {
    const updateStep = currentStep + 1;
    const lastStep = stepConfig[stepConfig.length - 1].stepNum;
    if (updateStep <= lastStep) {
      setCurrentStep(updateStep);
    }
  };

  const handleValidateAddress = async (skipValidateData: boolean = false, useOrgQuota?: 0 | 1) => {
    userGuideDispatch({ payload: { shouldShow: false, hasOperate: true } });
    if (!skipValidateData && validateSubmit) {
      const isValid = await validateSubmit(true);
      if (!isValid) {
        return;
      }
    }
    if (!state.draftId && saveDraft) {
      await saveDraft();
    }
    setCloseContactStoreClueTips && setCloseContactStoreClueTips(true);
    handleNextStep();
    // closeModal('', true);
    setUseOrgQuota(useOrgQuota || 0);
  };

  const handleQuotaEmpty = () => {
    Modal.info({
      content: <span style={{ color: '#272E47', fontWeight: '500', fontSize: '16px' }}>{getIn18Text('GUOLVCISHUBUZUWUFAFASONG')}</span>,
    });
  };
  const handleQuotaTodayEmpty = (skipValidateData?: boolean) => {
    edmDataTracker.trackFiltrationShortageView();
    Modal.confirm({
      icon: <ExclamationCircleOutlined />,
      content: <span style={{ color: '#272E47', fontWeight: '500', fontSize: '16px' }}>{getIn18Text('JINRIGUOLVCISHUBUZUSHIFOUXIAOHAOZONG')}</span>,
      okText: getIn18Text('QUEREN'),
      cancelText: getIn18Text('setting_system_switch_cancel'),
      onOk: () => {
        edmDataTracker.trackFiltrationShortageClick(getIn18Text('QUEDING'));
        handleValidateAddress(skipValidateData, 1);
      },
      onCancel: () => {
        edmDataTracker.trackFiltrationShortageClick(getIn18Text('setting_system_switch_cancel'));
      },
    });
  };
  /**
   * 点击过滤按钮处理
   * @param skipValidateData 草稿列表立即发送状态，由于editor创建延迟，验证有问题
   * @returns
   */
  const handleCheckAddress = async (skipValidateData = false) => {
    // 判断是否存在格式错误的
    if ((receiversMap?.get('formatError')?.size || 0) > 0) {
      formatErrorModalComp('filter');
      return;
    }
    const dayLeft = filterCapacity?.dayLeft || 0;

    edmDataTracker.trackMarktingEdmFilterCreate();
    const receiversCount = receivers.length;

    if (receiversCount <= dayLeft) {
      await handleValidateAddress(skipValidateData);
    } else {
      // 从接口中获取真实未check的数据
      // 精准发送，即使是定是任务 也要消耗当天的次数
      const contacts = receivers.map(receiver => {
        return {
          email: receiver.contactEmail as string,
          sourceName: receiver.sourceName || '',
        };
      });
      const quotaRes = await edmApi.getQuotaCheckCount({
        contacts,
      });

      const { needQuota, orgQuotaEnough } = quotaRes;
      if (!orgQuotaEnough) {
        handleQuotaEmpty();
        return;
      }
      if (Number(needQuota) <= dayLeft) {
        await handleValidateAddress(skipValidateData);
      } else {
        handleQuotaTodayEmpty(skipValidateData);
      }
    }
  };

  const filterBtnDisabled = !canFilter || receivers.length === 0;

  /**
   * 服务端获取发送数量限制
   */
  const getFilterCount = useCallback(() => {
    edmApi.getFilterCount().then(data => {
      setFilterCapacity(data);
      sendFilterCapacity && sendFilterCapacity(data);
    });
  }, []);

  const showConfirmFilterModeDialog = () => {
    SiriusModal.error({
      title: '已添加和新增邮箱全部切换为便捷发送模式',
      okCancel: true,
      cancelText: '过滤新增地址',
      okText: '确认便捷发送',
      onOk(...args) {
        closeModal('normal');
        setCurrentStep(1);
        onSendReceivers(null, true, true);
      },
      onCancel(...args) {
        handleCheckAddress(true);
      },
      maskClosable: false,
    });
  };

  const onAppendContacts = (list: EdmSendConcatInfo[], directSend?: boolean, needAdd?: boolean) => {
    var resp: EdmSendConcatInfo[] = list;
    let kv = new Map<string, EdmSendConcatInfo>();
    list.forEach(i => {
      kv.set(i.contactEmail, i);
    });
    receivers.forEach(i => {
      if (!kv.has(i.contactEmail)) {
        resp.push(i);
      }
    });
    let sortedResult = receiverSort(resp);

    setHasFilted(true);
    setReceivers(sortedResult);

    onSendReceivers(sortedResult, directSend, needAdd);
    setReAdd(false);
    if (directSend) {
      closeModal('normal');
      setCurrentStep(1);
    } else {
      closeModal('filter');
    }
  };

  const onConfirmContacts = (list: EdmSendConcatInfo[], reAdd?: boolean) => {
    // TODO:  拼 contactStatus 和 verifyStatus  @Hanxu
    let sortedResult = receiverSort(list);

    setHasFilted(true);
    setReceivers(sortedResult);

    onSendReceivers(sortedResult, false, true);
    if (reAdd) {
      setReAdd(true);
    } else {
      setReAdd(false);
      closeModal('filter'); // 单纯的过滤 不应该
    }
  };

  useEffect(() => {
    if (visible && receivers.length === 0) {
      setCurrentStep(1);
    }
    if (visible) {
      receivers.forEach(i => (i.logicDelete = false));
      validateRef.current?.refresh();
    }
    if (visible && currentStep === 3) {
      setShowResultPageDirect(true);
    } else {
      setTimeout(() => {
        setShowResultPageDirect(false);
      }, 100);
    }
  }, [visible, reAdd]);

  useEffect(() => {
    if (visible && reAdd) {
      setReAdd(false);
    }
  }, [visible]);

  useEffect(() => {
    edmDataTracker.track('pc_markting_edm_filter_select', {
      view: 1,
      type: (checkResult.v2ResultKV?.size || 0) > 0 ? 1 : 0,
    });
  }, [visible]);

  const showNoneInvalidListModal = () => {
    setNoneInvalidMailsModal(true);
    getFilterCount(); // 关闭 后  重新更新一下过滤次数
  };

  const onCancelFilterAndSend = () => {
    onSendReceivers(receivers, true, true); // 不过滤直接发送，所以将所有的人直接发送
    closeModal('normal');
    setCurrentStep(1);
  };

  useImperativeHandle(ref, () => ({
    getReceivers() {
      return receivers || [];
    },
    getIsUploadEdisk() {
      return uploadEdisk;
    },
    getReceiverType() {
      if (receiveType === 'filter') {
        return 1;
      }
      if (receiveType === 'normal') {
        return 4;
      }
      return 1;
    },
    getHasFilter() {
      return hasFilted;
    },
    closeAllModal() {
      closeModal('');
      setNoneInvalidMailsModal(false);
    },
    showValidateEmail(modal: boolean, hideDirectSend: boolean) {
      setHideDirectSendButton(hideDirectSend);
    },
    showWithMode(mode: SearchMode) {
      setSearchMode(mode);
    },
    getShowValidateEmailModal() {
      return false;
    },
    checkContacts() {
      return handleCheckAddress(true);
    },
    fetchResultByStatus() {
      return validateRef.current?.fetchResultByStatus();
    },
  }));

  const renderFooter = () => {
    return (
      <div className={classnames(style.filterBtnWrap)}>
        <div className={style.filterInfo}>*{getIn18Text('GUOLVJIEGUOJINZUOWEICANKAO\uFF0CYIGUOLVYOUXIANGBUZHONGFUJIRUGUOLVCISHU')}</div>
        <div className={style.filterBtns}>
          <Button
            onClick={() => {
              edmDataTracker.track('pc_markting_edm_filter_select', {
                action: 'cancel',
              });
              closeDrawerBefore();
            }}
          >
            <span>{getIn18Text('setting_system_switch_cancel')}</span>
          </Button>
          {/* {receiveType === 'filter' && ( */}
          <>
            <Button
              onClick={() => {
                edmDataTracker.track('pc_markting_edm_filter_select', {
                  action: 'fast',
                });
                if (receivers.length === 0) {
                  toast.warning({ content: getIn18Text('QINGTIANJIASHOUJIANREN') });
                  return;
                }
                if (receiversMap.get('formatError')?.size > 0) {
                  formatErrorModalComp('normal');
                  return;
                }
                // 二次添加场景, 第一次如果是过滤, 第二次选便捷, 要弹窗
                if (secondryAdd && receiveType === 'filter') {
                  showConfirmFilterModeDialog();
                } else {
                  closeModal('normal');
                  onSendReceivers(null, true, true);
                }
              }}
              className={style.easySendBtn}
            >
              <span>{getIn18Text('BIANJIEFASONG')}</span>
              <Tooltip title="无需等待过滤结果，创建任务后系统自动完成过滤，清除过滤规则选中状态的地址">
                <TipsIcon />
              </Tooltip>
            </Button>
            {!canFilter && sReceivers.length > 0 ? (
              <Button
                type="primary"
                onClick={() => {
                  closeModal('normal');
                  onSendReceivers(null, true, true);
                }}
              >
                {getIn18Text('QUEDING')}
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={() => {
                  edmDataTracker.track('pc_markting_edm_filter_select', {
                    action: 'check',
                  });
                  handleCheckAddress(true);
                }}
                disabled={filterBtnDisabled}
              >
                {getIn18Text('GUOLVDEZHI')}
              </Button>
            )}
          </>
        </div>
      </div>
    );
  };

  const renderTitle = () => {
    return (
      <p className={classnames(style.addContactTitle)}>
        <span className={classnames(style.title)}>{getIn18Text('SHOUJIANREN')}</span>
        {renderProgress()}
      </p>
    );
  };

  const renderTopTip = () => {
    if (receiveType === 'filter' && showSecondryAddNoti) {
      return (
        <div className={style.secondryAddNoti}>
          <ErrorIcon />
          存在新添加联系人，需要重新过滤地址
        </div>
      );
    }
    // if (showInvalidRemoveAll) {
    //   return (
    //     <div
    //       className={style.invalidRemoveAll}
    //       onClick={() => {
    //         userGuideDispatch({ payload: { shouldShow: false, hasOperate: true } });
    //       }}
    //     >
    //       <ErrorIcon style={{ marginRight: 5, zoom: 0.8 }} />
    //       {totalFilteredCount() > 0 ? (
    //         <div>
    //           {getIn18Text('CUNZAIYICHANGZHUANGTAILIAN')}
    //           <span style={{ color: '#FE5B4C' }}>{totalFilteredCount()}</span>
    //           {getIn18Text('REN，KEPILIANGQINGCHU')}
    //         </div>
    //       ) : (
    //         <div>{getIn18Text('CUNZAIYICHANGZHUANGTAILIANXIREN，KEPILIANGQINGCHU')}</div>
    //       )}
    //       <span className={style.invalidRemoveAllOperations}>
    //         <span className={style.invalidRemoveAllSeparator} />
    //         <ConfigProvider autoInsertSpaceInButton={false}>
    //           <Popover
    //             content={clearFilterPopover}
    //             trigger="click"
    //             visible={clearFilterVisible}
    //             placement="bottomRight"
    //             onVisibleChange={setClearFilterVisible}
    //             overlayClassName={style.popoverOverlay}
    //             getPopupContainer={() => receiverRef.current as HTMLElement}
    //           >
    //             <Button className={style.invalidRemoveAllFilter} size="small">
    //               <span>{getIn18Text('LIJIQINGCHU')}</span>
    //             </Button>
    //           </Popover>
    //         </ConfigProvider>
    //       </span>
    //     </div>
    //   );
    // }
    const formatCounts = receiversMap.get('formatError')?.size || 0;
    if (formatCounts > 0) {
      return (
        <div className={style.filterTip}>
          <span className={style.filterTipText}>
            <ErrorRedIcon style={{ marginRight: 5 }} /> 存在{formatCounts}个格式错误地址，请修改或清除地址{' '}
          </span>
          <span
            className={style.filterTipBtn}
            onClick={() => {
              removeReceiverMap('formatError');
            }}
          >
            清除地址
          </span>
        </div>
      );
    }
    return <></>;
  };

  const onSendReceivers = (sReceivers?: EdmSendConcatInfo[] | null, directSend?: boolean, needAdd?: boolean) => {
    setSReceivers(sReceivers || receivers);
    sendReceivers(sReceivers || receivers, directSend, needAdd, checkResult);
  };

  const renderProgress = () => {
    if (showResultPageDirect) {
      return null;
    }

    return <EditProgress wrapClassName={style.stepProgress} stepConfig={stepConfig} currentStep={currentStep} />;
  };

  const renderTipsInTop = () => {
    if (showFilterTips) {
      return (
        <div className={style.showFilterTips}>
          <YiwenIconSvg />
          <span className={style.showFilterTipsInfo}>{getIn18Text('QINGZAIFASONGQIANDIANJI')}</span>
        </div>
      );
    }
    if (sourceFrom === 'hostingIndex' && receivers.length > 0 && !showFilterTips) {
      return (
        <div className={style.showFilterTips}>
          <YiwenIconSvg />
          <span className={style.showFilterTipsInfo}>
            {getIn18Text('YITIANJIA')}
            {receivers.length}
            {getIn18Text('GELIANXIREN，QINGXIAN')}
          </span>
        </div>
      );
    }
    return '';
  };

  const initializeReceivierMap = (newReceivers: EdmSendConcatInfo[]) => {
    // debugger
    let fErrorContactsMap: Map<string, EdmSendConcatInfo> = new Map();

    newReceivers.forEach(entity => {
      const { contactStatus } = entity;
      const contactEmail = entity.contactEmail?.trim();
      if (contactEmail && contactEmail.length !== 0) {
        // 错误地址
        const isValid = isValidEmailAddress(contactEmail);

        if (!isValid || contactStatus === 3) {
          fErrorContactsMap.set(contactEmail, entity);
        }
      }
    });
    saveReceiverMap('formatError', fErrorContactsMap);
  };

  const closeDrawerBefore = () => {
    if (receiversChanged) {
      Modal.confirm({
        maskClosable: false,
        title: `关闭后变更的收件人不会被保存，是否继续？`,
        okText: '确认',
        cancelText: '取消',
        onOk: () => {
          closeSelf();
        },
      });
      return;
    }
    closeModal('');
  };

  const closeSelf = () => {
    setCurrentStep(1);
    closeModal('');
  };

  useEffect(() => {
    hasVariable ? setActiveTab('3') : setActiveTab('1');
  }, [hasVariable]);

  useEffect(() => {
    dataStoreApi.get('edmUploadEdisk').then(({ data }) => {
      setUploadEdisk(data === 'true');
    });
  }, []);

  useEffect(() => {
    // 关闭时，初始化临时数据
    if (!props.visible) {
      setReceiversChanged(false);
      clearReceiverMap();
    } else {
      initializeReceivierMap(props.receivers || []);
    }
  }, [props.visible]);

  useEffect(() => {
    if (props.visible && state.editorCreated && props.receivers?.length && state.currentStage === 3) {
      handleCheckAddress(true);
    }

    if (props.visible) {
      getFilterCount();
      if (userGuideState?.currentStep < 0) {
        userGuideDispatch({ payload: { currentStep: 0, shouldShow: true } });
      }
    }
    if (props.visible) {
      setReceivers(sReceivers);
      setActiveTab('1');
      setPlainText('');
      setTemplateFile({
        type: 'setup',
        payload: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.visible, state.editorCreated]);

  useEffect(() => {
    if (nextStep) {
      if (nextStep === 'normal') {
        closeModal('normal');
        onSendReceivers(null, true, true);
      } else {
        !filterBtnDisabled && handleCheckAddress(true);
      }
      setNextStep('');
    }
  }, [nextStep]);

  useEffect(() => {
    const canSend = sReceivers.length > 0 && (receiveType === 'normal' || (receiveType === 'filter' && (hasFilted || isGlobalSearch)));
    dispatch({
      type: 'setState',
      payload: {
        canSend: canSend,
      },
    });
  }, [hasFilted, receiveType, sReceivers]);

  useEffect(() => {
    if (hasFilted === true && showSecondryAddNoti) {
      setShowSecondryAddNoti(false);
    }
    if (receivers.length === 0) {
      setShowSecondryAddNoti(false);
    }
  }, [hasFilted, receivers]);

  useEffect(() => {
    const fetch = async () => {
      await addReceivers({ newReceivers: props.receivers || [], isAdd: false });
    };
    if (props.receivers?.length) {
      fetch();
    }
  }, [props.receivers]);

  useEffect(() => {
    // 新手引导第二步
    if (userGuideState.currentStep >= 1) {
      return;
    }

    if (activeTab === '2' && templateFile?.file) {
      userGuideDispatch({ payload: { shouldShow: true, currentStep: 1, hasOperate: false } });
      return;
    }

    if (activeTab === '4' && plainText?.trim()?.length) {
      userGuideDispatch({ payload: { shouldShow: true, currentStep: 1, hasOperate: false } });
      return;
    }
  }, [activeTab, templateFile, plainText]);

  useEffect(() => {
    // 新手引导第三、四步
    if (userGuideState.currentStep > 2 || userGuideState.currentStep < 1) {
      return;
    }

    const shouClear = receivers.some(item => [1.5, 2, 3, 4, 5, 6, 7, 8, 9].includes(item.contactStatus as number));

    if (shouClear && userGuideState.currentStep === 1) {
      userGuideDispatch({ payload: { shouldShow: true, currentStep: 2, hasOperate: false } });
      return;
    }

    if (!canFilter || !receivers.length) {
      return;
    }

    if (userGuideState.currentStep === 2 && !userGuideState.hasOperate) {
      return;
    }

    userGuideDispatch({ payload: { shouldShow: true, currentStep: 3, hasOperate: false } });
  }, [userGuideState.currentStep, userGuideState.hasOperate, canFilter, receivers]);

  useEffect(() => {
    // 新手引导第五步
    if (userGuideState.currentStep === Number.POSITIVE_INFINITY) {
      // 已结束
      return;
    }
    if (state.canSend && userGuideState.currentStep === 3) {
      userGuideDispatch({ payload: { shouldShow: true, currentStep: 4 } });
    }
  }, [userGuideState.currentStep, state.canSend]);

  const fetchContainerHeight = () => {
    return containerHeight - 88 - (showFilterTips ? 40 : 0);
  };

  useEffect(() => {
    // 避免弹窗和引导冲突
    if (userGuideState.hasOperate) {
      return;
    }
    if (warningIsShow) {
      userGuideDispatch({ payload: { shouldShow: false } });
    } else {
      userGuideDispatch({ payload: { shouldShow: true } });
    }
  }, [warningIsShow, userGuideState.hasOperate]);

  const NoneInvalidMailsModalComp = () => {
    if (!noneInvalidMailsModal) {
      return null;
    }
    return (
      <Modal
        visible={noneInvalidMailsModal}
        footer={null}
        closable={false}
        width={476}
        onCancel={() => onSendReceivers()}
        bodyStyle={{ textAlign: 'center' }}
        afterClose={() => {
          closeModal('');
        }}
      >
        <div>
          <div style={{ margin: '14px 0px', color: '#262A33', fontSize: '16px', fontWeight: '500' }}>
            <CheckCircleFilled style={{ color: '#5FC375', marginRight: 6 }} />
            过滤完成
          </div>
          <div style={{ color: '#7D8085', marginBottom: '20px' }}>
            {getIn18Text('YIGUOLV')}
            <span style={{ color: 'rgba(247, 79, 79, 1)' }}>0</span>
            {getIn18Text('GEWUXIAODEZHI')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'end' }}>
            <Button
              type="primary"
              onClick={() => {
                setNoneInvalidMailsModal(false);
                setHasFilted(true);
                onSendReceivers(null, false, true);
                closeModal('filter');
              }}
            >
              {getIn18Text('QUEDING')}
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  const ValidEmailModalComp = () => {
    if (![2, 3].includes(currentStep)) {
      return null;
    }
    return (
      <ValidEmailAddressModal
        visible={true}
        checkResult={checkResult}
        existEmailCount={existEmailCount}
        ref={validateRef}
        useOrgQuota={useOrgQuota}
        receivers={receivers}
        senderEmails={senderEmails}
        hideDirectSendButton={hideDirectSendButton}
        showNoneInvalidListModal={showNoneInvalidListModal}
        showReAdd={showResultPageDirect}
        onClose={(_, confirm) => {
          if (!confirm) {
            closeDrawerBefore();
          }
        }}
        draftId={state.draftId}
        onCancelFilterAndSend={onCancelFilterAndSend}
        hideModalWrap
        updateCurrentStep={setCurrentStep}
        businessType={businessType}
        onConfirm={(emails, validateResult, reAdd) => {
          getFilterCount();
          onConfirmContacts(emails || [], reAdd);
          if (validateResult) {
            updateCheckResult(validateResult);
          }
        }}
        controlMinimize={handleMinimize}
      />
    );
  };

  const BodyHeaderComp = () => {
    return (
      <p className={style.stepTitle}>
        <span>
          <span className={style.divider}></span>
          <span className={style.title}>{getIn18Text('XUANZESHOUJIANREN')}：</span>
        </span>
        <span
          className={classnames(style.tip)}
          style={{
            color: filterCapacity && Math.min(filterCapacity?.dayLeft, filterCapacity?.totalLeft) < receivers.length ? '#F74F4F' : '#7D8085',
            visibility: filterCapacity ? 'visible' : 'hidden',
          }}
        >
          {getIn18Text('SHENGYUGUOLVSHU:')} {filterCapacity?.dayLeft.toLocaleString()} {getIn18Text('CI/RI\u3001')} {filterCapacity?.totalLeft.toLocaleString()}{' '}
          {getIn18Text('CI/ZONG')}
        </span>
      </p>
    );
  };

  const getPickedContacts = () => {
    if (disabledReceivers.length > 0) {
      return disabledReceivers;
    }
    return receivers;
  };

  const AddressBookPickerComp = () => {
    return (
      <AddressBookPicker
        className={style.tabContentWrap}
        height={fetchContainerHeight()}
        style={{ height: fetchContainerHeight() }}
        pickedContacts={getPickedContacts() as unknown as IAddressContact[]}
        onPickedChange={handleImportByContact}
        disabledBtn={false}
      />
    );
  };

  const CustomerPickerComp = () => {
    return (
      <CustomerPicker
        className={style.tabContentWrap}
        style={{ height: fetchContainerHeight() }}
        pickedContacts={
          disabledReceivers.length > 0
            ? disabledReceivers
            : (receivers.map(receiver => ({
                ...receiver,
                email: receiver.contactEmail,
              })) as any)
        }
        onPickedChange={handleImportByCustomer}
        way="EDM"
      />
    );
  };

  const FileImportPickerComp = () => {
    return (
      <div className={style.tabContentWrap} style={{ height: fetchContainerHeight() }}>
        <div className={style.topTip} hidden={!props.hasVariable}>
          <AskIcon />
          <span>{getIn18Text('YITIANJIAGUOBIANLIANGXIN')}</span>
        </div>
        <div className={style.fileSelectorWrap}>
          {templateFile && (
            <div style={{ marginBottom: 24 }}>
              <div className={style.templateFileCard}>
                <div className={style.cardWrap}>
                  <div style={{ marginRight: 8 }}>
                    <IconCard type="xlsx" />
                  </div>
                  <div className={style.file}>
                    <div className={style.fileName}>{templateFile?.name}</div>
                    <div className={style.fileSize}>{templateFile.size}</div>
                  </div>
                </div>
                <div
                  className={style.progress}
                  style={{
                    width: (templateFile.progress >= 1 ? 0 : templateFile.progress) * 100 + '%',
                  }}
                ></div>
              </div>
            </div>
          )}
          <Button type="primary" onClick={() => fileRef.current?.click()}>
            {getIn18Text('XUANZEWENJIAN')}
          </Button>
          <p className={style.fileTypeDesc}>
            {getIn18Text('ZHICHIxls\u3001xlsx\u3001csvGESHIDEWENJIAN')}
            <ReceiverTemplate />
          </p>
          <p className={style.fileTypeDesc} style={{ marginTop: 0 }}>
            {getIn18Text('RUOMOBANXUXINZENGBIANLIANG\uFF0CQINGLIANXIGUANLIYUANZAI\u201CQIYESHEZHI-YOUJIANYINGXIAOMOBANBIANLIANG\u201DZHONGPEIZHI')}
          </p>
          <input
            type="file"
            style={{ display: 'none' }}
            ref={fileRef}
            onChange={handleFileSelected}
            accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          />
        </div>
        <div className={style.filterBtnWrap}>
          <Checkbox className={style.fileTypeDesc} style={{ marginTop: 0 }} checked={uploadEdisk} onChange={event => setUploadEdisk(event.target.checked)}>
            {getIn18Text('DAORUWENJIANBAOCUNWEIYUNWENDANG')}
          </Checkbox>
          <Button type="primary" onClick={handleImportByFile} disabled={!templateFile || !templateFile.file} loading={templateFile?.uploading}>
            {getIn18Text('TIANJIA')}
          </Button>
        </div>
      </div>
    );
  };

  const PersonalContactPickerComp = () => {
    return (
      <PersonalContactPicker
        className={style.tabContentWrap}
        style={{ height: fetchContainerHeight() }}
        pickedContacts={getPickedContacts() as unknown as PersonalContact[]}
        onPickedChange={handleImportByContact}
      />
    );
  };

  const MaunllyImportPickerComp = () => {
    return (
      <div className={style.tabContentWrap} style={{ height: fetchContainerHeight() }}>
        <Input.TextArea
          className={style.textarea}
          rows={8}
          autoFocus
          placeholder={getIn18Text(
            'ZHANTIEXUYAOFASONGDEYOUXIANGDEZHI\uFF0CLIANXIRENXINGMINGSHIYONG\u201C\uFF0C\u201DGEKAI\uFF0CYOUXIANGDEZHISHIYONG\u201C\uFF1B\u201DHUOHUICHEGEKAI\uFF0CRU\uFF1AZHANGSAN\uFF0Czhangsan@163.com'
          )}
          onChange={handlePlainTextChange}
          value={plainText}
        />
        <div className={style.filterBtnWrap}>
          <Button type="primary" onClick={addFromPlainText} disabled={plainText.trim().length === 0}>
            {getIn18Text('TIANJIA')}
          </Button>
        </div>
      </div>
    );
  };

  const BodySelectedMailByTabsComp = () => {
    return (
      <Tabs
        activeKey={activeTab}
        className="custom-ink-bar"
        onTabClick={() => {
          userGuideDispatch({ payload: { shouldShow: false, hasOperate: true } });
        }}
        onChange={key => setActiveTab(key)}
      >
        <Tabs.TabPane tab={getIn18Text('YINGXIAOLIANXIREN')} key="1">
          <PermissionCheckPage resourceLabel="CHANNEL" accessLabel="VIEW" menu="ADDRESS_BOOK">
            {AddressBookPickerComp()}
          </PermissionCheckPage>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<span title={getIn18Text('KEHUGUANLIXUANZE')}>{getIn18Text('KEHUGUANLIXUANZE')}</span>} key="2">
          {CustomerPickerComp()}
        </Tabs.TabPane>
        <Tabs.TabPane tab={<span title={getIn18Text('CONGWENJIANDAORU')}>{getIn18Text('CONGWENJIANDAORU')}</span>} key="3">
          {FileImportPickerComp()}
        </Tabs.TabPane>
        <Tabs.TabPane tab={<span title={getIn18Text('GERENTONGXUNLU')}>{getIn18Text('GERENTONGXUNLU')}</span>} key="4">
          {PersonalContactPickerComp()}
        </Tabs.TabPane>
        <Tabs.TabPane tab={<span title={getIn18Text('SHOUDONGTIANJIA')}>{getIn18Text('SHOUDONGTIANJIA')}</span>} key="5">
          {MaunllyImportPickerComp()}
        </Tabs.TabPane>
      </Tabs>
    );
  };

  const BodyAddedMailsComp = () => {
    return (
      <div style={{ width: '420px' }}>
        <div className={style.bodyTitle}>
          <span className={style.bodyTitleLeft}>
            {getIn18Text('YITIANJIA\uFF1A')}
            {unsubscribeCount > 0 && (
              <span style={{ fontSize: 12, color: '#A8AAAD' }}>
                {getIn18Text('YIXUANZE')} {receivers.length} {getIn18Text('REN\uFF0CQIZHONG')} {unsubscribeCount} {getIn18Text('RENZENGTUIDING')}
              </span>
            )}
            &nbsp;{receivers.length}
            <span style={{ color: '#A8AAAD' }}>/{CAPACITY}</span>
            <Tooltip title={`每日添加的上限为${CAPACITY}人，当前已添加${receivers.length}人`}>
              <ExplanationIcon style={{ marginLeft: 3, marginBottom: -3 }} />
            </Tooltip>
          </span>
          <span className={style.bodyTitleRight} onClick={handleRemoveAll} className={style.removeAllReceiver}>
            <TongyongShanchu />
            {getIn18Text('QINGKONG')}
          </span>
        </div>
        <div className={style.receiverListWrap} style={{ height: fetchContainerHeight() }}>
          {renderTopTip()}
          {
            <ReceiverList
              height={getRangedValue(props.containerHeight - 185, 210, 430) + (receiveType === 'normal' ? 94 : 0)}
              draftId={state?.draftId}
              receivers={reAdd ? [] : receivers}
              searchMode={searchMode}
              onRemove={removeReceiver}
              onValid={setValidReceiver}
              showSecondryAddNoti={receiveType === 'filter' && showSecondryAddNoti}
              filterType={receiveType}
            />
          }
        </div>
      </div>
    );
  };

  const FilterStrategyComp = () => {
    return <FilterDisplay />;
  };

  const MainBodyComp = () => {
    return currentStep === 1 ? (
      <>
        {renderTipsInTop()}
        <div
          className={style.step3}
          style={{
            display: props.visible ? undefined : 'none',
            marginBottom: '16px',
            position: 'relative',
          }}
          ref={receiverRef}
        >
          {BodyHeaderComp()}
          <div className={style.stepContentWrap} style={{ marginTop: '0px' }}>
            <div className={`${style.addReceiverWrap} ${systemLang === 'en' ? style.enLang : ''}`}>{BodySelectedMailByTabsComp()}</div>
            {/* 右侧 */}
            {BodyAddedMailsComp()}
          </div>
        </div>
        {FilterStrategyComp()}
        {renderFooter()}
      </>
    ) : (
      <></>
    );
  };

  const AddContactModalComp = () => {
    if (!reAdd) {
      return null;
    }
    return (
      <AddContactModal
        visible={reAdd && visible}
        senderEmails={[]}
        secondryAdd={true}
        closeModal={directSend => {
          closeModal(directSend);
        }}
        containerHeight={containerHeight}
        existEmailCount={receivers.length}
        hideDirectSendButton={hideDirectSendButton}
        hasVariable={hasVariable}
        receivers={[]}
        // 因为不好做去重, 这里先不选择了, 后续考虑做不可点击状态 @hanxu
        disableReceivers={[]}
        // disableReceivers={receivers}
        capacity={capacity}
        receiveType={hasFilted ? 'filter' : receiveType}
        validateSubmit={validateSubmit}
        saveDraft={saveDraft}
        sendFilterCapacity={sendFilterCapacity}
        sendReceivers={(receivers, directSend, needAdd, checkResult) => {
          // 这里是新增的逻辑
          onAppendContacts(receivers, directSend, needAdd);
          if (checkResult) {
            updateCheckResult(checkResult);
          }
        }}
        // ref={addContactRef}
        showFilterTips={showFilterTips}
        stepsInfo={stepsInfo}
        setCloseContactStoreClueTips={setCloseContactStoreClueTips}
        needCheckAllLogic={needCheckAllLogic}
        ignoreIncreaseSourceName={ignoreIncreaseSourceName}
      />
    );
  };

  const handleMinimize = (data: ControlMinimizeModel) => {
    // 如果过滤开始有进度且抽屉处于关闭状态，不更新小窗展示数据
    if (data?.data?.percent && !minimizeData?.show) {
      return;
    }
    setMinimizeData(data);
  };

  // 关闭小窗意味着打开抽屉
  const handleCloseMinimize = () => {
    setMinimizeData({} as ControlMinimizeModel);
    controlAddContactModal && controlAddContactModal(true);
  };

  let showMinimize = minimizeData?.show && minimizeData.data;

  if (reAdd) {
    return AddContactModalComp();
  }

  return (
    <div className={style.drawerDiv}>
      <SiriusDrawer
        style={{ transform: 'translateX(0px)' }}
        className={style.receiverSettingDrawerDiv}
        visible={visible && !showMinimize}
        title={renderTitle()}
        destroyOnClose={false}
        closable={true}
        width={886}
        maskClosable={false}
        maskStyle={{ background: '#ffffff00' }}
        onClose={closeDrawerBefore}
      >
        <>
          {MainBodyComp()}
          {ValidEmailModalComp()}
          {NoneInvalidMailsModalComp()}
          {AddContactModalComp()}
        </>
      </SiriusDrawer>
      {showMinimize ? <Minimize checkedCount={minimizeData?.data?.checkedCount} percent={minimizeData?.data?.percent} closeMinimize={handleCloseMinimize} /> : <></>}
    </div>
  );
});
