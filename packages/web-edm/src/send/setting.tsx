/* eslint-disable indent */
import {
  apiHolder,
  apis,
  EdmSendBoxApi,
  ISettingData,
  SendStepProps,
  SmartMarketingProps,
  EdmSendConcatInfo,
  isFFMS,
  TaskChannel,
  PrevScene,
  EdmSettingInputRecReq,
} from 'api';
import lodashGet from 'lodash/get';
import { Form, Input, AutoComplete, Select, Tooltip, Button, Spin, message, Popover } from 'antd';
import type { FormListFieldData } from 'antd/lib/form/FormList';
// import { LoadingOutlined } from '@ant-design/icons';
import moment from 'moment';
import { Rule } from 'antd/lib/form';
import React, { useContext, useEffect, useState, useRef, useImperativeHandle, useCallback } from 'react';
import { edmDataTracker } from '../tracker/tracker';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import style from './write.module.scss';
import Alert from '@web-common/components/UI/Alert/Alert';
import { debounce } from 'lodash';
import { getWeekdayWithTimeZoneOffset } from '@web-common/utils/constant';
// import { InsertVariable } from "../components/insertVariable/insertVariable";
import { InsertVariablModal } from '../components/insertVariable/insertVariableModal';
import { SenderEmail } from '../components/SenderEmail/senderEmail';
import { ReactComponent as RemoveIcon } from '@/images/icons/edm/delete.svg';
import useLocalStorage from '@/hooks/useLocalStorage';
import { CronSendModal, CronSendModalMethods, SendMode } from './cronSend';
import { isValidEmailAddress, getEmailsFromString, guardString, getCurTimeStamp } from '../utils';
import { edmWriteContext } from './edmWriteContext';
import { EmptyContactSettingModal } from '../components/insertVariable/emptyContactModal';
import SiriusCheckbox from '@web-common/components/UI/SiriusContact/Checkbox/index';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { Guide, GuideType } from './guide/guide';
import ToolTipSvg from '@/images/common-tooltip.svg';
import { ReactComponent as AddIcon } from '@/images/icons/edm/yingxiao/add-icon-hover.svg';
import { ReactComponent as AiAddIcon } from '@/images/icons/edm/yingxiao/ai-add2.svg';
import { ReactComponent as AiChangeIcon } from '@/images/icons/edm/yingxiao/ai-change2.svg';
import { ReactComponent as LoadingIcon } from '@/images/icons/edm/yingxiao/loading.svg';
import { ReactComponent as TipsIcon } from '@/images/icons/edm/yingxiao/tips-blue.svg';
import { ReactComponent as ArrowIcon } from '@/images/icons/edm/editor/arrow-brand.svg';
import { ReactComponent as CloseIcon } from '@/images/icons/edm/yingxiao/close-icon.svg';
import { ReactComponent as ExplanationIcon } from '@/images/icons/edm/yingxiao/explanation-gray16px.svg';
import { ReactComponent as ExplanationIcon14px } from '@/images/icons/edm/yingxiao/explanation-gray14px.svg';
import { EmailContentAssistantComponent } from './EmailContentAssistant/assistant';
import BindInfoBg from '@/images/icons/edm/yingxiao/bind-info.png';
import { SuggestTheme } from './suggestTheme';
import { InputChange } from './InputChange';
import { aiModSubject, aiTimesSubtract } from './utils/aiModSubject';
import { canIBind } from '../utils/canIBind';
import { SmartMarketingAssistant } from './SmartMarketingAssistant/index';
import { getIn18Text } from 'api';
import { EmailSenderList, Interface } from '../senderRotate/emailSenderList';

const inFFMS = isFFMS();
export interface SubjectDesc {
  tagDesc?: string;
}

export interface Subject {
  emailSubject?: string;
  tagList?: SubjectDesc[];
  subjectType?: number; // 1: 用户主题 2: 系统推荐
}

export interface MailThemeSuggest {
  recentSubjects?: Subject[];
  recommendSubjects?: Subject[];
}

const { Option } = Select;
const VAR_EXPREG = /^#[^]+}$/;

export interface SendSettingProps extends SendStepProps {
  initValues: ISettingData;
  ccReceiversVisible?: boolean;
  isCronEdit?: boolean;
  qs: Record<string, string>;
  sendPush?: (isIm: boolean) => void;
  onSenderEmailChange?: (value?: string) => void;
  onSubjectChange?: () => void;
  renderStartTime?: number;
  setUseContentAssistant?: (type: string) => void;
  /**
   * 控制 containerRef 滚动
   */
  containerScroll?: () => void;
}

const systemApi = apiHolder.api.getSystemApi();
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
// const LoadingIcon = <LoadingOutlined style={{ fontSize: 16 }} spin />;

export const CCReceivers = (props: { checked: boolean; onChange?: (checked: boolean) => any }) => {
  const [ccReceiverChecked, setCcReceiverChecked] = useState<boolean>(props.checked);
  useEffect(() => {
    setCcReceiverChecked(props.checked);
  }, [props.checked]);

  return (
    <div className={style.ccReceiversWrap}>
      <div
        style={{ display: 'flex', height: '100%', width: '120px', alignItems: 'center' }}
        onClick={() => {
          props.onChange?.(!ccReceiverChecked);
          setCcReceiverChecked(_checked => !_checked);
          if (!ccReceiverChecked) {
            Alert.error({
              className: style.receiverAlert,
              width: 400,
              centered: true,
              title: getIn18Text('QUERENSHOUJIANRENKEJIANCHAOSONG'),
              content: getIn18Text(
                'KAIQIHOU\uFF0CSHOUJIANRENKEKANDAOCHAOSONGREN\uFF0CCHAOSONGRENHUISHOUDAODUOFENGCHAOSONGYOUJIAN\u3002\uFF08ZUIDUOZHICHI500GESHOUJIANREN\uFF09'
              ),
            });
          }
        }}
      >
        <SiriusCheckbox checked={ccReceiverChecked} styles={{ width: 16, height: 16, marginRight: 4 }} />
        <span>{getIn18Text('SHOUJIANRENKEJIANCHAOSONG')}</span>
      </div>
    </div>
  );
};

export const SendSetting = React.forwardRef((props: SendSettingProps & SmartMarketingProps, ref) => {
  // 智能营销助手
  // receivers
  const {
    receivers,
    mailContent,
    mailTextContent,
    astrictCountVal,
    smartMarketingVisible,
    visible,
    smartSendOn = true,
    handleReMarkingSwitchChange,
    setUseContentAssistant,
    baseSecondSendInfo,
    onSubjectChange,
    onSenderEmailChange,
    initValues,
    containerScroll,
  } = props;
  const initSecondSendData = props.initData || [];
  const [form] = Form.useForm<ISettingData>();
  const [emailValidateTrigger, setEmailValidateTrigger] = useState('onBlur');
  const [visibleSubAutoComplete, setVisibleSubAutoComplete] = useState<boolean>(false);
  const [visibleEmailContentAssistant, setVisibleEmailContentAssistant] = useState<boolean>(false);
  const visibleInsertVariable = useRef<boolean>(false);
  const [edmEmailCategory, setEdmEmailCategory] = useLocalStorage('EDM_EmailCategory', 0);
  const { state, dispatch } = useContext(edmWriteContext).value;
  const [push, setPush] = useLocalStorage<boolean>('edm_mail_push_setting', true);
  const selectRef = useRef();
  const pushTypeRef = useRef();
  const currentFocusInputRef = useRef<HTMLInputElement>();
  const [curSelectedGuide, setCurSelectedGuide] = useState<GuideType | null>(null);
  // 变量弹窗
  const [variableVisible, setVariableVisible] = useState(false);
  const themeIndexRef = useRef<number>(0);
  const smartMarketingAssistantRef = useRef<HTMLDivElement>(null);
  const readonly = props.readonly;

  const senderListRef = useRef<Interface>();

  const channel = props.channel || TaskChannel.normal;

  // 是否展示绑定提示
  const [showBindTips, setShowBindTips] = useState(false);

  useEffect(() => {
    dispatch({
      type: 'setState',
      payload: {
        senderEmails: baseSecondSendInfo.sendSettingInfo?.senderEmails || initValues.senderEmails,
      },
    });
  }, [baseSecondSendInfo, initValues]);

  // ai改写主题loading
  const [aiLoading, setAiLoading] = useState(false);
  const [needFillPaths, setNeedFillPaths] = useState<Array<number>>([]);
  // 记录ai改写的内容，方便做下一次修改
  const [aiRewrite, setAiRewrite] = useState<Record<number, string>>({});

  const appendVarMulti = (value: string[], index: number) => {
    const variable = value[value.length - 1];
    const input = document.querySelectorAll('.edm-email-subject-item input')[index] as HTMLInputElement;
    const subjects = form.getFieldValue('emailSubjects');
    const oldVal = subjects[index]?.subject || '';
    const insertContent = ` #{${variable}}`;
    let newVal = oldVal + insertContent;
    if (input && oldVal) {
      newVal = oldVal.substring(0, input.selectionStart) + insertContent + oldVal.substring(input.selectionEnd);
    }
    const copy = [...subjects];
    copy[index] = { subject: newVal };
    form.setFieldsValue({ emailSubjects: copy });
    edmDataTracker.track('pc_markting_edm_sendprocess_setting_Contact_click');
  };

  const validateEdmCc = async (emails: string[]) => {
    try {
      await edmApi.validateEdmCc({ ccInfos: (emails || []).map(email => ({ email })) });
      return null;
    } catch (e) {
      return (e as Error)?.message ?? getIn18Text('TONGYUFUWUQICUOWU\uFF0CQINGZHONGXINSHURU');
    }
  };

  const rules = {
    edmSubject: [
      { required: true, message: getIn18Text('QINGSHURURENWUZHUTI') },
      { type: 'string', max: 30, message: getIn18Text('ZUIDUOSHURU30GEZIFU') },
    ],
    emailSubject: [
      { required: true, message: getIn18Text('QINGSHURUYOUJIANZHUTI') },
      { type: 'string', max: 256, message: getIn18Text('ZUIDUOSHURU256GEZIFU') },
    ],
    sender: [
      { required: true, message: getIn18Text('QINGSHURUFAJIANRENNICHENG') },
      { type: 'string', max: 256, message: getIn18Text('ZUIDUOSHURU256GEZIFU') },
    ],
    replyEmail: [
      { required: true, message: getIn18Text('QINGSHURUHUIFUYOUXIANG') },
      { type: 'email', message: getIn18Text('YOUXIANGGESHIBUZHENGQUE') } as Rule,
      { type: 'string', max: 256, message: getIn18Text('ZUIDUOSHURU256GEZIFU') },
    ],
    ccEmails: [
      {
        validator: async (_: any, value: string) => {
          const emails = getEmailsFromString(value || '');
          if (emails.some(item => !isValidEmailAddress(item))) {
            return Promise.reject(getIn18Text('CUNZAIGESHIBUZHENGQUEDEYOUXIANG'));
          }
          if (emails.length !== [...new Set(emails)].length) {
            return Promise.reject(getIn18Text('CUNZAIZHONGFUDEYOUXIANG'));
          }
          if (emails.length > 3) {
            return Promise.reject(getIn18Text('CHAOSONGYOUXIANGZUIDUOZHICHI3GE'));
          }
          const error = await validateEdmCc(emails);
          if (error) {
            return Promise.reject(error);
          }
          return Promise.resolve();
        },
      },
    ],
  };

  const onFieldsChange = changedFields => {
    const replyField = changedFields.find(field => (Array.isArray(field.name) ? field.name[0] : field.name) === 'replyEmail');
    if (replyField && !replyField.validating) {
      setEmailValidateTrigger(replyField.errors.length ? 'onChange' : 'onBlur');
    }
    // todo
    const values = form.getFieldsValue();
    const { emailCategory } = values;
    setEdmEmailCategory(emailCategory);
  };

  useImperativeHandle(ref, () => ({
    highLightAddSubject() {
      // TODO: 高亮一下 '手动添加主题'  @hanxu
    },
    validateFields() {
      // validateFields无法检测手动setFields的error
      const haveError = form.getFieldsError()?.find(item => item.errors.length > 0);
      if (haveError) {
        return Promise.reject(new Error('invalid replyEmail'));
      }
      let emails = senderListRef?.current?.getSenderList();
      if (emails?.length === 0) {
        form.validateFields();
        return Promise.reject(new Error('invalid sender'));
      } else {
        return form.validateFields().then(data => {
          data.senderEmails = emails?.map(i => i.email);
          return Promise.resolve(data);
        });
      }
    },
    getSenderEmails() {
      let emails = senderListRef?.current?.getSenderList();
      return emails;
    },
    getValues() {
      const values = form.getFieldsValue();
      const { ccEmails } = values;

      delete values.ccEmails;

      let emails = senderListRef?.current?.getSenderList();

      return {
        ...values,
        emailSubjects: (values.emailSubjects || []).filter(obj => obj?.subject),
        // 兼容老版本
        senderEmail: systemApi.getCurrentUser()?.id,
        senderEmails: emails?.map(i => i.email),
        ccInfos: getEmailsFromString(ccEmails || '').map(email => ({ email })),
      };
    },
    configEmailSubject(content: string) {
      const subjects = form.getFieldValue('emailSubjects');
      const copy = [...subjects];
      const tempSubject = decodeURIComponent(content);
      copy[0] = { subject: tempSubject };
      form.setFieldsValue({ emailSubjects: copy });
    },
    resetFields() {
      form.resetFields();
    },
    clearHoverGuide() {
      setCurSelectedGuide(null);
    },
    isValidInput() {
      return this.validateFields();
    },
    clearVariableHoverGuide() {
      if (curSelectedGuide === GuideType.InsertVariable) {
        clearGuide();
      }
    },

    // 智能营销助手相关
    isSmartSendOpen() {
      return smartMarketingAssistantRef.current?.isSmartSendOpen();
    },
    getAstrictCount() {
      return smartMarketingAssistantRef.current?.getAstrictCount();
    },
    getReMarketingInfo(noSync?: boolean) {
      return smartMarketingAssistantRef.current?.getReMarketingInfo(noSync);
    },
    async getAiModifyInfo() {
      console.log('come here');
      const info = await smartMarketingAssistantRef.current?.getAiModifyInfo();
      return info;
    },

    closeTipVisible() {
      smartMarketingAssistantRef.current?.closeTipVisible();
      return;
    },
    getAiModifyStatus() {
      return smartMarketingAssistantRef.current?.getAiModifyStatus();
    },
    getAiModifySwitchChecked() {
      return smartMarketingAssistantRef.current?.getAiModifySwitchChecked();
    },
    closeMultiVersionSwitch() {
      smartMarketingAssistantRef.current?.closeMultiVersionSwitch();
      return;
    },
    openMultiVersionSwitch() {
      smartMarketingAssistantRef.current?.openMultiVersionSwitch();
    },
  }));
  useEffect(() => {
    // 兼容老字段
    const values = props.initValues;
    if (!props.initValues.emailSubjects || props.initValues.emailSubjects.length === 0) {
      values.emailSubjects = [{ subject: props.initValues.emailSubject || '' }];
    }
    if (props.initValues.ccInfos && props.initValues.ccInfos.length) {
      values.ccEmails = props.initValues.ccInfos.map(item => item.email).join(';');
      setCcEmailsVisible(true);
    }
    form.setFieldsValue(values); // 已经设置了啊！
    setEdmEmailCategory(values.emailCategory);
    if (props.isCronEdit && props.initValues.sendTime) {
      cronSendModalRef.current?.setCronSendTime(
        props.initValues.sendTime,
        props.initValues.sendTimeZone || '',
        props.initValues.sendTimeCountry,
        props.initValues.cronSendType === 0 ? SendMode.standard : SendMode.local
      );
    }
    handleCheckReplyEmail(values.replyEmail || '');
  }, [props.initValues, props.isCronEdit, form]);

  const user = apiHolder.api.getSystemApi().getCurrentUser();

  const [ccEmailsVisible, setCcEmailsVisible] = useState<boolean>(false);

  const [showCronSendModal, setShowCronSendModal] = useState<boolean>(false);

  const [mailThemeSuggest, setMailThemeSuggest] = useState<MailThemeSuggest | null>(null);

  // 主题focus的index
  const [themeFocusIndex, setThemeFocusIndex] = useState<number>(-1);

  const cronSendModalRef = useRef<CronSendModalMethods>(null);

  const handleCronSendEdit = (sendTime: string, sendTimeZone: string, sendTimeCountry: string) => {
    form.setFieldsValue({ sendTime, sendTimeZone, sendTimeCountry });

    setShowCronSendModal(false);

    return Promise.resolve(true);
  };

  const InputType: Record<string, number> = {
    edmSubject: 1,
    emailSubject: 2,
    sender: 3,
    ccEmails: 4,
    replyEmail: 5,
  };

  const [inputMemory, setInputMemory] = useState<Record<number, any>>({});

  const fetchRecommandSubject = async () => {
    const recommandSubject = (await edmApi.getRecommandSubject()) as MailThemeSuggest;
    setMailThemeSuggest(recommandSubject);
  };

  const subjectChangeNotify = debounce(() => {
    onSubjectChange && onSubjectChange();
  }, 1000);

  async function getInputMemory() {
    const res = await edmApi.getEdmSettingInputRec();

    const memories = res?.memories ?? [];
    const memoryMap = memories.reduce((map: Record<number, any>, item) => {
      if (item.type === InputType.sender) {
        const data = form.getFieldsValue();
        form.setFieldsValue({
          ...data,
          sender: item.contents[0] || '',
        });
        handleCheckReplyEmail(data?.replyEmail || '');
      }
      map[item.type] = [
        {
          label: getIn18Text('ZUIJINSHURU'),
          options: inputRecentComp(item.contents, item.type),
        },
      ];
      return map;
    }, {});
    // 重置了？
    setInputMemory(memoryMap);
    if (props.renderStartTime) {
      edmDataTracker.trackEdmWritePageLoadTime({
        totalTime: getCurTimeStamp() - props.renderStartTime,
        from: (new URLSearchParams(location.href).get('from') as PrevScene) || 'newCreate',
        contactSize: props.receivers?.length || 0,
      });
    }
  }
  async function updateInputMemory() {
    const res = await edmApi.getEdmSettingInputRec();
    const memories = res?.memories ?? [];
    const memoryMap = memories.reduce((map: Record<number, any>, item) => {
      map[item.type] = [
        {
          label: getIn18Text('ZUIJINSHURU'),
          options: inputRecentComp(item.contents, item.type),
        },
      ];
      return map;
    }, {});
    setInputMemory(memoryMap);
  }
  useEffect(() => {
    props.sendPush && props.sendPush(push as boolean);
  }, [push]);
  useEffect(() => {
    fetchRecommandSubject();
    getInputMemory();
    fetchTimezone();
  }, []);
  useEffect(() => {
    setTimeout(() => {
      if (visibleEmailContentAssistant && currentFocusInputRef.current) {
        currentFocusInputRef.current.focus(); // 需要保留主题input的聚焦状态，抽屉展开后将Input重置为聚焦状态
      }
    }, 0);
  }, [visibleEmailContentAssistant]);

  const onGuideChange = (type: GuideType) => {
    setCurSelectedGuide(type);
  };
  const clearGuide = () => {
    setCurSelectedGuide(null);
  };

  const [timeZoneTextMap, setTimeZoneTextMap] = useState<Record<string, string>>({});
  async function fetchTimezone() {
    const res = await edmApi.getEdmCronTimezone();
    const timeZoneTextMap: Record<string, string> = {};

    (res?.countryList || []).forEach(country => {
      (country?.timeZoneList || []).forEach(item => {
        timeZoneTextMap[item.timeZone] = item.timeZoneDesc;
      });
    });

    setTimeZoneTextMap(timeZoneTextMap);
  }

  const getCronSendTimeText = (sendTime: string, sendTimeZone: string, sendTimeCountry: string, timeZoneTextMap: Record<string, string>) => {
    let country = sendTimeCountry || '';
    let timezoneMap = timeZoneTextMap[sendTimeZone] || '';
    let offset = getWeekdayWithTimeZoneOffset(moment(sendTime.replace(' ', 'T') + sendTimeZone), sendTimeZone);
    if (props.initValues.cronSendType === 1) {
      return `${sendTime} ${guardString(sendTimeZone) ? offset : ''}`;
    }
    return `${country} ${timezoneMap} ${sendTime} ${guardString(sendTimeZone) ? offset : ''}`;
  };

  const viewTimeRef = useRef({
    start: 0,
    hasReport: false,
  });

  const { qs } = props;
  // 只有再次发件埋点
  const shouldReportTime = qs?.resend;
  useEffect(() => {
    if (!shouldReportTime) {
      return;
    }
    if (props.visible && !viewTimeRef.current?.start) {
      // 初次计时
      viewTimeRef.current.start = +new Date();
      return;
    }

    if (!props.visible && !viewTimeRef.current?.hasReport) {
      // 切换tab 上报埋点
      const time = new Date().getTime() - viewTimeRef.current?.start;
      edmDataTracker.trackWriteSettingTime(time, 'v0');
      viewTimeRef.current.hasReport = true;
    }
  }, [props.visible]);

  const getMailThemeDefaultName = () => {
    const prefix = '营销任务';
    const curDate = moment().format('YYYYMMDD');
    return prefix + '-' + curDate;
  };

  const taskTheme = () => {
    return (
      <Form.Item label={'任务名称'} name="edmSubject" rules={rules.edmSubject} initialValue={getMailThemeDefaultName()}>
        <AutoComplete
          getPopupContainer={node => node}
          defaultActiveFirstOption={false}
          options={inputMemory[InputType.edmSubject]}
          onFocus={() => onGuideChange(GuideType.Subject)}
          onBlur={() => {
            clearGuide();
          }}
          // filterOption={false}
        >
          <Input width={360} placeholder={getIn18Text('RENWUZHUTIBUHUIZHANSHIGEISHOUJIANREN')} readOnly={readonly} maxLength={48} />
        </AutoComplete>
      </Form.Item>
    );
  };

  const renderBindTips = () => (
    <div className={style.tipsContent}>
      <img src={BindInfoBg} alt="" />
      <div className={style.tipsInfo}>您的回复邮箱可以绑定在网易外贸通，回信消息不遗漏，处理业务更方便。</div>
    </div>
  );

  // 校验回复邮箱是否是三方域名绑定的域别名，生成的邮箱别名
  const handleCheckReplyEmail = async (email: string) => {
    // 基础校验通过，进行三方别名邮箱校验
    form.validateFields(['replyEmail']).then(async () => {
      const result = await edmApi.checkReplyEmail({ email });
      if (result?.thirdAlias) {
        setShowBindTips(false);
        form.setFields([
          {
            name: 'replyEmail',
            errors: ['此回复邮箱无法正常收到客户回信，建议更换'],
          },
        ]);
      } else {
        const result = await canIBind(email);
        setShowBindTips(result);
      }
    });
  };

  const replyMail = () => {
    return (
      <>
        <Form.Item
          label={getIn18Text('HUIFUYOUXIANG')}
          name="replyEmail"
          rules={rules.replyEmail}
          tooltip={{
            title: <div>可填写其他地址，用于接收回信</div>,
            placement: 'bottom',
            // overlayClassName: style.lightTooltip,
            color: 'red',
            icon: <ExplanationIcon />,
          }}
          initialValue={user?.id}
          validateTrigger={emailValidateTrigger}
        >
          <AutoComplete
            onBlur={e => handleCheckReplyEmail(e?.target?.value || '')}
            getPopupContainer={node => node}
            defaultActiveFirstOption={false}
            options={inputMemory[InputType.replyEmail]}
            filterOption={false}
          >
            <Input
              width={360}
              placeholder={getIn18Text('QINGSHURUSHOUJIANRENHUIFUSHI\uFF0CJIESHOUHUIXINDEYOUXIANG')}
              readOnly={readonly}
              maxLength={256}
              // suffix={<Tooltip
              //   placement="bottom"
              //   overlayClassName={style.lightTooltip}
              //   title="可填写其他地址，用于接收回信">
              //   <Info stroke="#A8AAAD" />
              // </Tooltip>}
            />
          </AutoComplete>
        </Form.Item>
        {showBindTips && (
          <Form.Item label=" " colon={false} noStyle>
            <div className={style.addSubWrap + ' ' + style.subWrap2}>
              <span>可在邮箱模块绑定此邮箱进行收信</span>
              <Popover trigger="hover" title={null} content={renderBindTips()}>
                <TipsIcon className={style.subIcon} />
              </Popover>
            </div>
          </Form.Item>
        )}
      </>
    );
  };

  const dynamicNoti = () => {
    return (
      <Form.Item className={style.selectType} label="任务通知">
        <Select
          ref={selectRef}
          suffixIcon={<DownTriangle />}
          dropdownClassName={style.dropdown}
          onChange={type => {
            type === 'IM' ? setPush(true) : setPush(false);
            selectRef.current?.blur();
          }}
          style={{ width: 376, borderRadius: 4 }}
          defaultValue={push ? 'IM' : 'None'}
        >
          <Option value="IM">通过IM通知</Option>
          <Option value="None">不通知</Option>
        </Select>
      </Form.Item>
    );
  };

  const taskPushTypeComp = () => {
    return (
      <Form.Item className={style.selectType} name="emailCategory" initialValue={edmEmailCategory} label={<div>任务类型</div>} colon={false} hidden={inFFMS}>
        <Form.Item noStyle name="emailCategory">
          <Select
            ref={pushTypeRef}
            suffixIcon={<DownTriangle />}
            dropdownClassName={style.dropdown}
            onChange={type => {
              setEdmEmailCategory(type);
              pushTypeRef.current?.blur();
            }}
            style={{ width: 376, borderRadius: 4 }}
            defaultValue={edmEmailCategory}
          >
            <Option value={0}>无类型</Option>
            <Option value={1}>通知</Option>
            <Option value={2}>邀请</Option>
            <Option value={3}>开发信</Option>
            <Option value={4}>广告</Option>
          </Select>
        </Form.Item>
        {edmEmailCategory === 4 && (
          <div className={style.adTips}>{getIn18Text('RUOSHUYUGUANGGAOYINGXIAOLEIYOUJIAN\uFF0CFASONGHOUXITONGHUIZIDONGZAIBIAOTIQIANTIANJIA\u201C[AD]\u201DZIYANG')}</div>
        )}
      </Form.Item>
    );
  };

  const senderNickName = () => {
    return (
      <Form.Item label={getIn18Text('FAJIANRENNICHENG')} name="sender" rules={rules.sender}>
        <AutoComplete getPopupContainer={node => node} defaultActiveFirstOption={false} options={inputMemory[InputType.sender]} filterOption={false} disabled={aiLoading}>
          <Input width={360} placeholder={getIn18Text('QINGSHURUYOUJIANSONGDASHI\uFF0CXIANSHIDEFAJIANRENNICHENG')} readOnly={readonly} maxLength={256} />
        </AutoComplete>
      </Form.Item>
    );
  };

  const addCC = () => {
    return (
      <Form.Item label=" " colon={false} noStyle>
        <div className={style.addCCWrap}>
          <div style={{ display: 'flex', width: '100px', height: '100%', alignItems: 'center' }} onClick={() => setCcEmailsVisible(!ccEmailsVisible)}>
            <SiriusCheckbox checked={ccEmailsVisible} styles={{ width: 16, height: 16, marginRight: 4 }} />
            <span>添加抄送人</span>
          </div>
        </div>
      </Form.Item>
    );
  };

  async function deleteRecentInputRec(type: number, content: string) {
    const req: EdmSettingInputRecReq = { type: type, content: content };
    const res = await edmApi.deleteEdmSettingInputRec(req);
    if (typeof res === 'boolean' && res) {
      // 删除成功，拉取最新数据
      updateInputMemory();
    } else {
      toast.error({ content: '删除失败' });
    }
  }

  const inputRecentComp = (recents: string[], type: number) => {
    return recents.map((item, index) => {
      return {
        key: 'recent+' + index.toString(),
        value: item,
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
            <div className={style.themeRecentTitle} title={item}>
              {item}
            </div>
            <CloseIcon
              style={{ height: 16, width: 16, display: 'inline-block', flexShrink: 0, alignSelf: 'center' }}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                deleteRecentInputRec(type, item || '');
              }}
            />
          </div>
        ),
      };
    });
  };

  const recommandSubjectComp = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className={style.recommandTitle}>
          推荐主题
          <Tooltip title="系统选取了您近期打开率较高的邮件主题及部分系统热门推荐主题">
            <ExplanationIcon14px />
          </Tooltip>
        </div>
      </div>
    );
  };

  async function deleteEdmSettingInputRec(type: number, content: string) {
    const req: EdmSettingInputRecReq = { type: type, content: content };
    const res = await edmApi.deleteEdmSettingInputRec(req);
    if (typeof res === 'boolean' && res) {
      // 删除成功，拉取最新数据
      fetchRecommandSubject();
    } else {
      toast.error({ content: '删除失败' });
    }
  }

  const recommandSubjectRecentComp = () => {
    const recents = mailThemeSuggest?.recentSubjects || [];
    return recents.map((item, index) => {
      return {
        key: 'recent+' + index.toString(),
        value: item.emailSubject,
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
            <div
              onClick={() => {
                edmDataTracker.track('pc_markting_edm_subject_dropdown_list_click', {
                  click_type: '最近输入',
                  click_content: item.emailSubject || '',
                });
              }}
              className={style.themeRecentTitle}
              title={item.emailSubject}
            >
              {item.emailSubject}
            </div>
            <CloseIcon
              style={{ height: 16, width: 16, display: 'inline-block', flexShrink: 0, alignSelf: 'center' }}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                deleteEdmSettingInputRec(InputType.emailSubject, item.emailSubject || '');
              }}
            />
          </div>
        ),
      };
    });
  };
  const recommandSubjectRecommandComp = () => {
    const suggests = mailThemeSuggest?.recommendSubjects || [];
    return suggests.map((item, index) => {
      return {
        key: 'recommand+' + index.toString(),
        value: item.emailSubject,
        label: <SuggestTheme {...item} />,
        // result: item.emailSubject
      };
    });
  };

  const themeContentAssistantComp = () => {
    return (
      <div
        className={style.themeContentAssistantContent}
        onClick={() => {
          if (!visibleEmailContentAssistant) {
            edmDataTracker.track('pc_markting_edm_subjectContent');
            setVisibleEmailContentAssistant(true);
          }
        }}
      >
        <span className={style.themeContentAssistantDefault}>获取更多优质高打开率主题，</span>
        <span className={style.themeContentAssistantBrand}>主题内容助手</span>
        <ArrowIcon />
      </div>
    );
  };

  // ai改写主题
  const aiChangeTheme = async (them: string, paths: Array<number>, values: Array<any>) => {
    setAiLoading(true);
    const data = form.getFieldsValue();
    // const aiChangeSubjects = [...values, ...Array.from({length: (5 - values.length)})];
    form.setFieldsValue({
      ...data,
      emailSubjects: values,
    });
    try {
      const res = await aiModSubject([data.emailSubjects![0]!.subject], paths.length, 3);
      // 成功之后改写
      let tempIndex = 0;
      let aiRewrite: any = {};
      const emailSubjects = values
        ?.map((item, index) => {
          if (paths.includes(index)) {
            // 需要改写
            const subject = res[tempIndex++] || '';
            aiRewrite[index] = subject;
            return {
              subject,
            };
          }
          return item;
        })
        .filter(item => !!item.subject);
      setAiRewrite(aiRewrite);
      form.setFieldsValue({
        ...data,
        emailSubjects,
      });
      message.success('主题生成成功');
      onSubjectChange && onSubjectChange();
      aiTimesSubtract();
      // return res;
    } catch (err: any) {
      message.error(err?.message || err);
      // 失败之后复原
      form.setFieldsValue(data);
    }
    setAiLoading(false);
  };

  // ai润色
  const aiPolishThem = async (values: Array<any>, paths: Array<number>) => {
    setAiLoading(true);
    const data = form.getFieldsValue();
    try {
      const res = await aiModSubject(
        values.map(value => value.subject),
        1,
        5
      );
      // 成功之后改写
      let tempIndex = 0;
      let aiRewrite: any = {};
      const emailSubjects = data.emailSubjects?.map((item, index) => {
        if (paths.includes(index)) {
          // 需要改写
          const subject = res[tempIndex++] || '';
          aiRewrite[index] = subject;
          return {
            subject,
          };
        }
        aiRewrite[index] = item.subject;
        return item;
      });
      // 成功之后标记所有内容为ai填写
      setAiRewrite(aiRewrite);
      form.setFieldsValue({
        ...data,
        emailSubjects,
      });
      aiTimesSubtract();
    } catch (err: any) {
      message.error(err?.message || err);
      // 失败之后复原
      form.setFieldsValue(data);
    }
    setAiLoading(false);
  };

  // 点击ai生成主题
  const addAiTheme = (fields: FormListFieldData[]) => {
    // 埋点
    edmDataTracker.aiGenerateThem();

    const values: Array<any> = form.getFieldValue('emailSubjects');
    if (values == null || !values[0] || !values[0].subject) {
      return message.error('请填写邮件主题');
    }
    if (VAR_EXPREG.test(values[0].subject.trim())) {
      return message.error('仅包含变量无法生成更多主题');
    }
    const filledValues = [...values, ...Array.from({ length: 5 - values.length })];
    // 需要填充的paths。有两个条件1: 内容未填写；2. 改内容由ai填写
    const needFillPaths = filledValues.reduce((pre, cur, index) => {
      if (!cur || !cur.subject || (aiRewrite[index] && aiRewrite[index] === filledValues[index].subject)) {
        return [...pre, index];
      }
      return pre;
    }, [] as Array<any>);
    if (needFillPaths.length === 0) {
      return message.error('最多添加5个主题');
    }
    setNeedFillPaths(needFillPaths);
    // 开始请求ai改写
    aiChangeTheme('', needFillPaths, filledValues);
  };

  const aiPolishThemClick = () => {
    // 埋点
    edmDataTracker.aiRewriteTheme();

    const values: Array<any> = form.getFieldValue('emailSubjects');
    if (values == null || values.some(value => value == null || !value.subject)) {
      return message.error('请输入主题内容');
    }
    const filterValues = values.filter((value, index) => !VAR_EXPREG.test(value.subject.trim()));
    if (filterValues.length === 0) {
      return message.error('仅包含变量无法进行改写');
    }

    const needFillPaths = values.reduce((pre, cur, index) => {
      if (!VAR_EXPREG.test(cur.subject.trim())) {
        return [...pre, index];
      }
      return pre;
    }, [] as Array<number>);
    setNeedFillPaths(needFillPaths);
    void aiPolishThem(filterValues, needFillPaths);
  };

  const mailTheme = (name: string, index: number, restField: any) => {
    // ai生成主题
    if (aiLoading && needFillPaths.includes(index)) {
      const value = form.getFieldValue('emailSubjects')[index]?.subject;
      return <Input style={{ width: 376 }} value={value || 'AI邮件主题正在生成中...'} suffix={<LoadingIcon className={style.loadingIcon} />} />;
    }

    const recents = mailThemeSuggest?.recentSubjects || [];
    const recentOption =
      recents.length > 0
        ? {
            label: <div>最近输入</div>,
            options: recommandSubjectRecentComp(),
          }
        : null;

    const suggest = mailThemeSuggest?.recommendSubjects || [];
    const suggestOption =
      suggest.length > 0
        ? {
            label: recommandSubjectComp(),
            options: recommandSubjectRecommandComp(),
          }
        : null;

    let options = [];
    const themeContentAssistant = {
      label: themeContentAssistantComp(),
      options: [],
    };
    options.push(themeContentAssistant);
    if (recentOption) {
      options.push(recentOption);
    }
    if (suggestOption) {
      options.push(suggestOption);
    }

    const renderSuffix = () => {
      return (
        <div
          onMouseDown={e => {
            e.stopPropagation();
          }}
          onClick={() => {
            themeIndexRef.current = index;
            clearGuide();
            setVariableVisible(true);
          }}
        >
          <div
            className={classnames(style.insertBtn)}
            onMouseEnter={e => {
              onGuideChange(GuideType.InsertVariable);
              e.stopPropagation();
            }}
          >
            插入变量
          </div>
        </div>
      );
    };

    return (
      <Form.Item {...restField} noStyle name={[name, 'subject']} fieldKey={[name, 'subject']} rules={rules.emailSubject}>
        <AutoComplete
          dropdownClassName={style.dropdownTheme}
          getPopupContainer={node => node}
          defaultActiveFirstOption={false}
          options={index === themeFocusIndex ? options : []}
          onChange={() => {
            subjectChangeNotify && subjectChangeNotify();
          }}
          filterOption={false}
          onDropdownVisibleChange={visible => {
            setTimeout(() => {
              setVisibleSubAutoComplete(!visibleInsertVariable.current && visible);
            }, 100);
            if (visible) {
              onGuideChange(GuideType.MailTheme);
            }
          }}
          open={visibleSubAutoComplete}
        >
          <Input
            className={style.inputBox}
            style={{ width: 376 }}
            placeholder={getIn18Text('QINGSHURUYOUJIANZHUTI，QINGJINLIANGBIMIANYUGUOWANGZHONGFU')}
            maxLength={256}
            onChange={() => {
              subjectChangeNotify();
            }}
            onFocus={event => {
              setThemeFocusIndex(index);
              onGuideChange(GuideType.MailTheme);
              currentFocusInputRef.current = event.target;
            }}
            onBlur={() => {
              if (curSelectedGuide === GuideType.MailTheme || curSelectedGuide === GuideType.InsertVariable) {
                clearGuide();
              }
            }}
            suffix={inFFMS ? null : renderSuffix()}
          />
        </AutoComplete>
      </Form.Item>
    );
  };

  const MailAbstractComp = () => {
    return (
      <Form.Item label="邮件摘要" name="emailSummary">
        <Input onFocus={() => onGuideChange(GuideType.MailAbstract)} onBlur={() => clearGuide()} maxLength={50} placeholder="请输入邮件摘要，未输入则使用默认摘要" />
      </Form.Item>
    );
  };

  const ccMails = () => {
    return (
      <Form.Item label={getIn18Text('CHAOSONGREN')} name="ccEmails" rules={rules.ccEmails} className={style.ccEmails}>
        <AutoComplete getPopupContainer={node => node} defaultActiveFirstOption={false} options={inputMemory[InputType.ccEmails]} filterOption={false}>
          <Input width={360} placeholder={getIn18Text('QINGSHURUCHAOSONGYOUXIANG\uFF0CYIFENHAOFENGE')} />
        </AutoComplete>
      </Form.Item>
    );
  };

  const ccReceiversVisible = () => {
    return (
      <Form.Item label=" " name="ccReceivers" valuePropName="checked" colon={false} noStyle>
        <CCReceivers value={} />
      </Form.Item>
    );
  };

  const sendingTime = () => {
    return (
      <>
        <Form.Item className={style.sendTimeSetting} label={getIn18Text('FASONGSHIJIAN')} required shouldUpdate>
          {() => {
            const sendTime = form.getFieldValue('sendTime');
            const sendTimeZone = form.getFieldValue('sendTimeZone');
            const sendTimeCountry = form.getFieldValue('sendTimeCountry');

            return (
              <Input
                placeholder={getIn18Text('QINGXUANZEFASONGSHIJIAN')}
                readOnly
                value={sendTime ? getCronSendTimeText(sendTime, sendTimeZone, sendTimeCountry, timeZoneTextMap) : ''}
                onClick={() => setShowCronSendModal(true)}
              />
            );
          }}
        </Form.Item>
        <Form.Item name="sendTime" noStyle>
          <Input hidden />
        </Form.Item>
        <Form.Item name="sendTimeZone" noStyle>
          <Input hidden />
        </Form.Item>
        <Form.Item name="sendTimeCountry" noStyle>
          <Input hidden />
        </Form.Item>
      </>
    );
  };

  const handleReceiverContacts = () => {
    if (!receivers || receivers.length === 0) {
      return null;
    }
    return receivers.map(i => ({
      email: i.contactEmail,
      name: i.contactName || '',
      companyName: i.companyName || '',
      continent: i.continent || '',
      country: i.country || '',
      province: i.province || '',
      city: i.city || '',
      variableMap: i.variableMap,
      sourceName: i.sourceName || '',
      position: i.position || '',
      remarks: i.remarks || '',
      verifyStatus: i.verifyStatus,
      verifyStatusList: i.verifyStatusList,
      contactStatus: i.contactStatus,
      contactStatusList: i.contactStatusList,
    }));
  };

  const SenderEmailComp = () => {
    let list = props.initValues.senderEmails;
    // 兼容老版本, 没有 senderEmails 字段的情况
    if ((!list || list.length === 0) && props.initValues.senderEmail) {
      list = [props.initValues.senderEmail];
    }

    return (
      <Form.Item label={'发件地址选择'} name={'senderRotateList'}>
        <EmailSenderList
          ref={senderListRef}
          preCheckList={list}
          valueChanged={() => {
            onSenderEmailChange && onSenderEmailChange();
          }}
          visible={props.visible}
          containerScroll={containerScroll}
        />
      </Form.Item>
    );
  };

  return (
    <>
      {smartMarketingVisible ? (
        <div style={{ display: props.visible ? undefined : 'none' }} className={style.formTitle}>
          任务信息
        </div>
      ) : (
        <></>
      )}
      <Form
        form={form}
        className={classnames([style.settingForm, smartMarketingVisible ? style.smartForm : ''])}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        labelAlign="right"
        style={{ display: props.visible ? undefined : 'none' }}
        // validateTrigger='onBlur'
        onFieldsChange={onFieldsChange}
      >
        {/* 任务名称 */}
        {taskTheme()}
        {/* 邮件主题 */}
        <Form.List name="emailSubjects" initialValue={[{ subject: '' }]}>
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(({ key, name, fieldKey, ...restField }, index) => {
                return (
                  <Form.Item
                    label={index === 0 ? getIn18Text('YOUJIANZHUTI') : ' '}
                    colon
                    required={index === 0 ? true : false}
                    key={key}
                    style={{ marginBottom: '10px' }}
                    className={`edm-email-subject-item overflow-item`}
                  >
                    {mailTheme(name, index, restField)}
                    {fields.length === 1 ? null : (
                      <span className={style.dynamicCtrlIcon}>
                        <RemoveIcon
                          onClick={() => {
                            remove(index);
                            onSubjectChange && onSubjectChange();
                          }}
                        />
                      </span>
                    )}
                  </Form.Item>
                );
              })}
              {
                <Form.Item label=" " colon={false} noStyle>
                  <div className={style.addSubWrap}>
                    <div className={style.addSubLeft}>
                      <Button
                        type="link"
                        disabled={fields.length >= 5}
                        onClick={() => {
                          fields.length < 5 ? add() : null;
                        }}
                        className={style.btnBox1}
                      >
                        <AddIcon className={style.addSubIcon} />
                        <span className={style.addSubTxt}>手动添加主题</span>
                      </Button>
                      <Button
                        type="link"
                        style={{
                          marginRight: 6,
                        }}
                        disabled={aiLoading}
                        onClick={() => addAiTheme(fields)}
                        className={style.btnBox}
                      >
                        <AiAddIcon className={style.addSubIcon} />
                        <span className={style.addSubTxt2}>AI生成主题</span>
                      </Button>
                      <Button type="link" disabled={aiLoading} onClick={aiPolishThemClick} className={`${style.btnBox} ${style.btnBox2}`}>
                        <AiChangeIcon className={style.addSubIcon} />
                        <span className={style.addSubTxt2}>AI润色</span>
                      </Button>
                    </div>
                  </div>
                </Form.Item>
              }
              <div style={{ position: 'relative', top: -48 }}>
                <Form.ErrorList errors={errors} />
              </div>
            </>
          )}
        </Form.List>
        {/* 发件人昵称 */}
        {senderNickName()}
        {/* 添加抄送人 */}
        {!inFFMS && addCC()}
        {ccEmailsVisible && (
          <>
            {ccMails()}
            {props.ccReceiversVisible && ccReceiversVisible()}
          </>
        )}
        {/* 发件人 */}
        {SenderEmailComp()}
        {/* 邮件摘要 */}
        {MailAbstractComp()}
        {/* 回复邮箱 */}
        {replyMail()}
        {/* 任务类型 */}
        {taskPushTypeComp()}
        {/* 任务通知 */}
        {!inFFMS && dynamicNoti()}
        {/* 发送时间 */}
        {props.isCronEdit && sendingTime()}
      </Form>

      {/* 智能营销助手 */}
      {smartMarketingVisible && (
        <div style={{ display: visible ? 'flex' : 'none', justifyContent: 'center' }}>
          {
            <SmartMarketingAssistant
              ref={smartMarketingAssistantRef}
              visible={visible}
              channel={channel}
              mailContent={mailContent}
              smartSendOn={smartSendOn}
              newReceivers={receivers as EdmSendConcatInfo[]}
              astrictCountVal={astrictCountVal}
              initData={initSecondSendData || []}
              baseSecondSendInfo={props.baseSecondSendInfo}
              needSystemRecommend={props.needSystemRecommend}
              mailTextContent={mailTextContent}
              handleSwitchChange={checked => {
                handleReMarkingSwitchChange && handleReMarkingSwitchChange(checked);
              }}
            />
          }
        </div>
      )}

      {props.isCronEdit && (
        <CronSendModal
          ref={cronSendModalRef}
          visible={showCronSendModal}
          onSend={handleCronSendEdit}
          receivers={handleReceiverContacts()}
          onCancel={() => setShowCronSendModal(false)}
        />
      )}
      <EmptyContactSettingModal
        visible={state.showEmptyContactModal}
        value={state.emptyContactType}
        onClose={() => dispatch({ type: 'setState', payload: { showEmptyContactModal: false } })}
        onOk={value => {
          dispatch({
            type: 'setState',
            payload: {
              showEmptyContactModal: false,
              emptyContactType: value,
            },
          });
        }}
      />
      {curSelectedGuide && (
        <Guide
          guideType={curSelectedGuide}
          clickClose={() => {
            clearGuide();
          }}
        ></Guide>
      )}
      {variableVisible && (
        <InsertVariablModal
          variableVisible={variableVisible}
          trackSource="主题"
          onChange={v => {
            appendVarMulti(v as string[], themeIndexRef.current);
            setVariableVisible(false);
            onSubjectChange && onSubjectChange();
          }}
          defaultOpen={true}
          onVisible={visible => {
            !visible && setVariableVisible(false);

            visibleInsertVariable.current = visible;
            setVisibleSubAutoComplete(false);
            if (visible) {
              onGuideChange(GuideType.InsertVariable);
            }
            if (!visible && curSelectedGuide === GuideType.InsertVariable) {
              clearGuide();
            }
          }}
        />
      )}
      {visibleEmailContentAssistant && (
        <EmailContentAssistantComponent
          isTheme={true}
          emailContentAssistantOpen={visibleEmailContentAssistant}
          setEmailContentAssistantOpen={setVisibleEmailContentAssistant}
          insertContent={content => {
            const subjects = form.getFieldValue('emailSubjects');
            const copy = [...subjects];
            copy[themeFocusIndex] = { subject: content };
            form.setFieldsValue({ emailSubjects: copy });
            setUseContentAssistant && setUseContentAssistant('subject');
          }}
        ></EmailContentAssistantComponent>
      )}
    </>
  );
});
