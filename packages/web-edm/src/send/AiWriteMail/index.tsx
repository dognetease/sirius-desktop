import React, { useState, useEffect, useMemo } from 'react';
import styles from './index.module.scss';
import { Editor as EditorType } from '@web-common/tinymce';
import { Button, Form, Tabs, message, Spin, Modal } from 'antd';
import { api, apis, EdmSendBoxApi, AiWriteMailModel, GPTDayLeft, MailApi as MailApiType, ProductAuthApi } from 'api';
import cloneDeep from 'lodash/cloneDeep';
import { valiteMoment } from '@web-schedule/components/CreateBox/util';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import IconCard from '@web-common/components/UI/IconCard/index';
import { useNiceModal } from '@web-common/components/UI/NiceModal/NiceModal';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { AiForm } from './AiForm';
import ImagePreview from '@web-common/components/UI/ImagePreview';
import Translate, { TranslateParams } from '../../components/translate/index';
import { MarketingVideo, guardString } from '../../utils';
import { getTranslateFrom } from './util';
import { defaultValueMap, staticTabs } from './util';
import LeftOutlined from '@ant-design/icons/LeftOutlined';
import RightOutlined from '@ant-design/icons/RightOutlined';
import CopyToClipboard from 'react-copy-to-clipboard';
import ErrorSvg from '@/images/icons/alert/error.svg';
import LoadingGif from '@/images/icons/edm/edm_ai_loading.gif';
import { initDefaultMoment } from '@web-schedule/components/CreateBox/util';
import { edmDataTracker } from '../../tracker/tracker';
import { ReactComponent as QuickIntroduction } from '@/images/icons/edm/quick_introduction.svg';
import { getIn18Text } from 'api';
import { aiTimesSubtract } from '../utils/aiModSubject';
let gptApi = api.requireLogicalApi(apis.mailApiImpl) as MailApiType;
let defaultActiveTab: tabValueModel = 'product_desc';
if (process.env.BUILD_ISEDM) {
  gptApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
  defaultActiveTab = 'develop';
}
const productAuthApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
// 翻译loading
const TransLoadingComp = (props: { loading: string }) => {
  const { loading } = props;
  return !!loading ? (
    <div className={styles.pageLoading}>
      <Spin tip={loading} indicator={<IconCard type="tongyong_jiazai" />} />
    </div>
  ) : null;
};

export interface Props {
  visible: boolean;
  onClose: () => void;
  aiInsertContent: (content: string) => void;
  type: 'write' | 'retouch';
  originalContent?: string;
  onUse?: (id: string, type: 'write' | 'retouch') => void;
  source?: 'market' | 'general';
  editorRef?: React.RefObject<EditorType>;
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};
const tailLayout = {
  wrapperCol: { span: 24 },
};

type tabValueModel = 'default' | 'product_desc' | 'develop' | 'holiday_wishes' | 'retouch' | 'report' | 'conference_invitatio' | 'attendance_application' | 'notice';

type ValueMapModel = {
  [key in tabValueModel]: AiWriteMailModel;
};

const ai_limit_err_msg = getIn18Text('BAOQIANJINRIAISHENGCHENGCISHUYIYONGGUANG');
export const AiWriteMail = (Props: Props) => {
  const { visible, source, onClose, aiInsertContent, type = 'write', originalContent, onUse = () => {}, editorRef } = Props;
  const [activeTab, setActiveTab] = useState<tabValueModel>(defaultActiveTab || 'product_desc');
  const [valueMap, setValueMap] = useState<ValueMapModel>(cloneDeep(defaultValueMap));
  const [currentValues, setCurrentValues] = useState<AiWriteMailModel>(cloneDeep(defaultValueMap['product_desc']));
  // const [contentList, setContentList] = useState<string[]>([]);
  const [contentNum, setContentNum] = useState<number>(0);

  const [tabContentMap, setTabContentMap] = useState<Map<tabValueModel, { content: string; isTranslation: boolean; translation: string[]; transFrom: string }[]>>(
    new Map()
  );
  const [contentChange, setContentChange] = useState<number>(0);
  const [optionsChange, setOptionsChange] = useState<boolean>(false);

  const [retouchTexts, setRetouchTexts] = useState<string[]>([]);

  const getCurrentRetouchText = (): string => {
    return retouchTexts[contentNum] || '';
  };
  const setNewRetouchText = (content: string) => {
    retouchTexts.push(content);
    setContentNum(retouchTexts.length - 1);
  };

  // 润色结果分段array
  const retouchTextSection = () => {
    let text = getCurrentRetouchText();

    if (!text) {
      return [];
    } else {
      return text.replace(/(\n)+/gi, '\n').split('\n');
    }
  };

  const [quota, setQuota] = useState<GPTDayLeft | null>(null);
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [writeErr, setWriteErr] = useState<Error>();
  const [retouchErr, setRetouchErr] = useState<Error>();

  const [translateLoading, setTranslateLoading] = useState<string>(''); // 翻译 loading 文案
  const [retouchTranslation, setRetouchTranslation] = useState<boolean>(false); // AI润色翻译开关
  const [retouchTransContent, setRetouchTransContent] = useState<string[]>([]); // AI润色翻译结果
  const [retouchTransFrom, setRetouchTransFrom] = useState<string>('auto'); // AI润色翻译原文语言

  const [inputMemory, setInputMemory] = useState<Record<string, any>>({});

  const paidGuideModal = useNiceModal('paidGuide');

  // Ai写信当前展示内容翻译开关状态
  const activeIsTranslation = useMemo(() => {
    return (tabContentMap?.get(activeTab) || [])[contentNum]?.isTranslation;
  }, [tabContentMap, activeTab, contentNum]);
  // Ai写信当前展示内容分段array
  const activeContent = useMemo(() => {
    const content = (tabContentMap?.get(activeTab) || [])[contentNum]?.content;
    if (content) {
      return content.replace(/(\n)+/gi, '\n').split('\n');
    } else {
      return [];
    }
  }, [tabContentMap, activeTab, contentNum]);
  // Ai写信当前展示内容的翻译结果
  const activeTranslation = useMemo(() => {
    return (tabContentMap?.get(activeTab) || [])[contentNum]?.translation;
  }, [tabContentMap, activeTab, contentNum]);
  // Ai写信当前展示内容的翻译原文语言
  const activeTransFrom = useMemo(() => {
    return (tabContentMap?.get(activeTab) || [])[contentNum]?.transFrom;
  }, [tabContentMap, activeTab, contentNum]);

  const onTabChange = (key: string) => {
    valueMap[activeTab] = currentValues;
    setValueMap(valueMap);
    setActiveTab(key as tabValueModel);
    const newCurrentValues = cloneDeep(valueMap[key as tabValueModel]); // 重置表单
    if (['5'].includes(newCurrentValues?.type)) {
      newCurrentValues.moments = initDefaultMoment();
      newCurrentValues.date = 'data';
    } else if (['6', '7'].includes(newCurrentValues?.type)) {
      const curDate = moment();
      newCurrentValues.time = 'time';
      newCurrentValues.moments = {
        startDate: curDate,
        endDate: curDate.clone(),
      };
    }
    setCurrentValues(newCurrentValues);
    form.setFieldsValue(newCurrentValues);
  };
  const renderTabPanes = () => {
    return staticTabs.map(tab => {
      return <Tabs.TabPane tab={tab.label} key={tab.value}></Tabs.TabPane>;
    });
  };

  const packParams = (values: any): AiWriteMailModel | false => {
    if (!values) {
      const formValue = form.getFieldsValue();
      values = { ...currentValues, moments: formValue.moments };
    }
    let req = { ...values, type: Number(defaultValueMap[activeTab].type) };
    if (req.moments) {
      const errorDos = {
        '5': '汇报日期开始时间不能晚于结束时间',
        '6': '会议开始时间不能晚于结束时间',
        '7': '考勤申请开始时间不能早于结束时间',
      };
      let validateRes = valiteMoment({ startDate: req.moments.startDate, endDate: req.moments.endDate }, errorDos[req.type]);
      if (!validateRes) return false;
      const fromTime = req.moments.startTime?.format('HH:mm');
      const toTime = req.moments.endTime?.format('HH:mm');
      req.fromDate = req.moments.startDate.format('YYYY-MM-DD');
      req.toDate = req.moments.endDate.format('YYYY-MM-DD');

      if (fromTime && toTime) {
        validateRes = valiteMoment(
          { startDate: req.moments.startDate, endDate: req.moments.endDate, startTime: req.moments.startTime, endTime: req.moments.endTime },
          errorDos[req.type]
        );
        if (!validateRes) return false;
        req.fromDate += ` ${fromTime}`;
        req.toDate += ` ${toTime}`;
      }
    }
    delete req.requiredList;
    delete req.moments;
    switch (req.type) {
      case 5:
        req.reportContent = req.extraDesc;
        delete req.extraDesc;
        break;
      case 8:
        req.announcementContent = req.extraDesc;
        delete req.extraDesc;
        break;
    }
    return handleReqBeforeSend(req);
  };

  const handleReqBeforeSend = req => {
    if (req.tone === '其他') {
      req.tone = req.otherTone;
    }
    req.tone = req.tone || '';
    delete req.otherTone;
    return req;
  };

  const handleError = (err, trackInfo: any) => {
    if (!err) {
      err = { name: '', message: getIn18Text('CHUCUOLE，QINGSHAOHOU') };
    }
    edmDataTracker.track('waimao_mail_click_generateFail', {
      trackInfo: trackInfo,
      way: source,
    });
    setIsLoading(false);
    fetchQuota();
    if (type === 'write') {
      setWriteErr(err);
    }
    if (type === 'retouch') {
      setRetouchErr(err);
    }
  };
  const handleSuccess = () => {
    setIsLoading(false);
    clearError();
    fetchQuota();
    fetchRecord();
    aiTimesSubtract();
  };

  const trackBuild = () => {
    let type = '';
    switch (activeTab) {
      case 'develop':
        type = 'coldEmail';
        break;
      case 'product_desc':
        type = 'productIntroduction';
        break;
      case 'holiday_wishes':
        type = 'festivalGreeting';
        break;
      case 'retouch':
        type = 'other';
        break;
    }
    edmDataTracker.track('waimao_mail_click_templateType', {
      templateType: type,
      way: source,
    });
  };

  const onBuildMailRetouchError = (err, req) => {
    handleError(err, { language: req.language, content: req });
    if (err && err.message) {
      message.error({
        content: err.message,
      });
    }
  };

  const onBuildMail = async (values: any) => {
    debugger;
    if (isLoading || !!translateLoading) {
      return;
    }
    if (!['sirius', 'ultimate'].includes(productAuthApi.doGetProductVersionId())) {
      if (!process.env.BUILD_ISEDM && productAuthApi.doGetProductVersionId() === 'free') {
        // 办公免费版
        closeSelf();
        paidGuideModal.show({ errType: '6', origin: '写信页', source: 'AI写信' });
      } else {
        message.error({
          content: '当前邮箱版本不支持使用此功能，请联系管理员',
        });
      }
      return;
    }
    if (quota === null || (quota && quota?.dayLeft) === 0) {
      message.error({
        content: ai_limit_err_msg,
      });
      return;
    }
    const req = packParams(values);
    if (req === false) return;
    setIsLoading(true);
    trackBuild();
    try {
      if (process.env.BUILD_ISEDM) {
        // 外贸是不用循环的
        const data = await gptApi.gptEmailWrite(req);
        gptEmailWriteSucc(data, req);
      } else {
        // 办公需要对接口进行循环调用
        gptApi.gptEmailWrite(
          req,
          data => {
            gptEmailWriteSucc(data, req);
          },
          err => onBuildMailRetouchError({ message: err }, req)
        );
      }
    } catch (err) {
      onBuildMailRetouchError(err, req);
    }
  };

  const gptEmailWriteSucc = (data, req) => {
    handleSuccess();
    if (data.text) {
      if (!tabContentMap?.has(activeTab)) {
        tabContentMap?.set(activeTab, []);
      }
      let contentList = getContentsByTab();
      // tabContentMap?.set(activeTab, [...contentList, data.text]);
      tabContentMap?.set(activeTab, [...contentList, { content: data.text, isTranslation: false, translation: [], transFrom: getTranslateFrom(req.language) }]);
      setTabContentMap(cloneDeep(tabContentMap));
      setContentChange(contentChange + 1);
      onUse(data.gptRecordId, 'write');
      //
      scrollToBottom();
      // 其他时
      if (req.type === 0) {
        edmDataTracker.track('waimao_mail_click_aiWritingemail​_otherContent', {
          content: data.text,
          way: source,
        });
      }
      edmDataTracker.track('waimao_mail_click_aiWritingemail​_language', {
        language: req.language,
        way: source,
      });
      edmDataTracker.track('waimao_mail_click_aiWritingemail​_tone', {
        tone: req.tone,
        way: source,
      });
    }
  };

  const scrollToBottom = () => {
    const containerWrapper = document.querySelector(`.aiWriteMailDrawer`)?.querySelector(`.ant-drawer-body`) as Element; // 外层容器 出现滚动条的dom
    if (containerWrapper) {
      setTimeout(() => {
        containerWrapper.scrollTo(0, containerWrapper.scrollHeight);
      }, 100);
    }
  };

  const onRetouch = async (values: any) => {
    if (isLoading || !!translateLoading) {
      return;
    }
    if (!['sirius', 'ultimate'].includes(productAuthApi.doGetProductVersionId())) {
      if (!process.env.BUILD_ISEDM && productAuthApi.doGetProductVersionId() === 'free') {
        // 办公免费版
        closeSelf();
        paidGuideModal.show({ errType: '6', origin: '写信页', source: 'AI润色' });
      } else {
        message.error({
          content: '当前邮箱版本不支持使用此功能，请联系管理员',
        });
      }
      return;
    }
    if (quota === null || (quota && quota?.dayLeft) === 0) {
      message.error({
        content: ai_limit_err_msg,
      });
      return;
    }

    setIsLoading(true);
    const req = packParams(values);
    if (req === false) return;
    req.originalContent = originalContent;

    try {
      if (process.env.BUILD_ISEDM) {
        // 外贸是不用循环的
        const data = await gptApi.gptEmailRetouch(req);
        onRetouchSucc(data, req);
      } else {
        // 办公需要对接口进行循环调用
        gptApi.gptEmailRetouch(
          req,
          data => {
            onRetouchSucc(data, req);
          },
          err => onBuildMailRetouchError({ message: err }, req)
        );
      }
    } catch (err) {
      onBuildMailRetouchError(err, req);
    }
  };

  const onRetouchSucc = (data, req) => {
    edmDataTracker.track('waimao_mail_click_aiRephrase​_generate', { way: source });
    handleSuccess();
    setRetouchTransFrom(getTranslateFrom(req.language));
    if (!tabContentMap?.has(activeTab)) {
      tabContentMap?.set(activeTab, []);
    }
    let contentList = getContentsByTab();
    // tabContentMap?.set(activeTab, [...contentList, data.text]);
    tabContentMap?.set(activeTab, [...contentList, { content: data.text, isTranslation: false, translation: [], transFrom: getTranslateFrom(req.language) }]);
    setTabContentMap(cloneDeep(tabContentMap));

    if (data.text) {
      onUse(data.gptRecordId, 'retouch');
      setNewRetouchText(data.text);
      // setRetouchText(data.text);
    }
  };

  const getContentsByTab = () => {
    return tabContentMap?.get(activeTab) || [];
  };

  const changeCont = (behavior: 'left' | 'right', disabled: boolean) => {
    if (disabled || isLoading || !!translateLoading) {
      return;
    }
    const contentList = getContentsByTab();
    const totalCount = contentList.length - 1;
    const newCount = behavior === 'left' ? contentNum - 1 : contentNum + 1;
    if (newCount < 0 || newCount > totalCount) {
      message.error({
        content: getIn18Text('MEIYOUGENGDUO'),
      });
      return;
    }
    changeContentByNum(newCount);
  };

  // 插入
  const insertContent = () => {
    const contentList = getContentsByTab();
    let content = contentList[contentNum]?.content || '';
    content = content.replace(/[\n\r]/g, '<br/>');
    aiInsertContent(content);
    edmDataTracker.track('waimao_mail_click_backfillEmail', { way: source });
  };

  const onValuesChange = (changedValues: any) => {
    form.setFieldsValue({ ...currentValues, ...changedValues });
    setCurrentValues({ ...currentValues, ...changedValues });
    setOptionsChange(true);
  };

  const changeContentByNum = (num: number) => {
    setContentNum(num);
    renderContent(num);
  };

  const renderContent = (num: number) => {
    const contentList = getContentsByTab();
    let html = contentList[num]?.content || '';
    if (!html) return;
    html = html.replace(/[\n\r]/g, '<br/>');
    let placeholder = document.createElement('div');
    placeholder.innerHTML = html;
    placeholder.style.color = '#000000';
    // let nodes = placeholder.childNodes;
    const parentNode = document.getElementById('ai-write-mail-editor');
    if (parentNode) {
      parentNode.innerHTML = '';
      parentNode.appendChild(placeholder);
    }
  };

  // AI写信点击翻译回调
  const onTranslate = (res: TranslateParams) => {
    let contentList = getContentsByTab();
    let resTranslation: string[] = activeTranslation;
    if (res.serviceRes && res.serviceRes.success) {
      // 翻译成功，调用接口，并成功返回
      resTranslation = res.serviceRes.data.translations.map(i => {
        const doc = new DOMParser().parseFromString(i, 'text/html');
        return doc.documentElement.innerText;
      });
    }
    if (contentList[contentNum]) {
      contentList[contentNum].isTranslation = res.isTranslation;
      contentList[contentNum].translation = resTranslation;
    }
    tabContentMap?.set(activeTab, [...contentList]);
    setTabContentMap(cloneDeep(tabContentMap));
  };

  // AI润色翻译回调
  const onRetouchTranslate = (res: TranslateParams) => {
    setRetouchTranslation(res.isTranslation);
    if (res.serviceRes && res.serviceRes.success) {
      // 翻译成功，调用接口，并成功返回
      const resTranslation = res.serviceRes.data.translations.map(i => {
        const doc = new DOMParser().parseFromString(i, 'text/html');
        return doc.documentElement.innerText;
      });
      setRetouchTransContent(resTranslation);
    }
  };

  const HeaderComp = () => {
    return (
      <div className={styles.header} style={type === 'retouch' ? { boxShadow: '0px 1px 0px #EBEDF2' } : {}}>
        <div className={styles.titleLeft}>
          {type === 'write' && <div className={styles.title}>{getIn18Text('AIWRITE')}</div>}
          {type === 'retouch' && <div className={styles.title}>{getIn18Text('AIRETOUCH')}</div>}
          <div className={styles.forFree}>{getIn18Text('XIANSHIMIANFEI')}</div>
          <div className={styles.quickIntroduction} onClick={() => ImagePreview.preview({ data: [MarketingVideo.ai], startIndex: 0 })}>
            <QuickIntroduction />
            <span>{getIn18Text('KUAISULEJIE')}</span>
          </div>
        </div>
        <div className={styles.titleRight}>
          {quota && quota.dayLeft >= 0 && (
            <div className={styles.title}>
              {getIn18Text('JINRIHAIKESHIYONG')}
              {quota.dayLeft}
              {getIn18Text('CI')}
            </div>
          )}
          <div className={styles.close} onClick={() => closeSelf()} />
        </div>
      </div>
    );
  };

  const closeAndclearData = () => {
    onClose();
    setRetouchTexts([]);
    // setRetouchText(undefined);
    setRetouchTransContent([]);
    setRetouchTranslation(false);
  };

  const handleSureLogic = () => {
    SiriusModal.confirm({
      title: `关闭后已填写或已生成的内容不会被保存，是否继续？`,
      content: '',
      centered: true,
      okText: getIn18Text('QUEREN'),
      cancelText: getIn18Text('QUXIAO'),
      onOk: () => {
        closeAndclearData();
      },
    });
  };

  const closeSelf = () => {
    if (optionsChange || contentChange !== 0) {
      handleSureLogic();
      return;
    }
    closeAndclearData();
  };

  const clearError = () => {
    setWriteErr(undefined);
    setRetouchErr(undefined);
  };

  const fetchQuota = async () => {
    let dayLeft = (await gptApi.getGPTQuota()) as GPTDayLeft;
    setQuota(dayLeft);
    editorRef?.current?.fire('changeCount', { used: dayLeft.dayLeft, total: dayLeft.dayLimit });
    if (dayLeft.dayLeft === 0) {
      if (type === 'write') {
        setWriteErr({ name: '', message: ai_limit_err_msg });
      }
      if (type === 'retouch') {
        setRetouchErr({ name: '', message: ai_limit_err_msg });
      }
    }
  };

  const fetchRecord = async () => {
    const res = await gptApi.getGptRecord({
      gptType: type === 'write' ? 0 : 1,
    });
    if (res) {
      let memoryMap: any = {};
      for (const key in res) {
        if (res[key].length > 0) {
          memoryMap[key] = [
            {
              label: getIn18Text('ZUIJINSHURU'),
              options: res[key].map(option => {
                return { label: option, value: option, key: option };
              }),
              historyOptions: res[key],
            },
          ];
        }
      }
      setInputMemory(memoryMap);
      console.log('fetchRecord=====', res, memoryMap);
    }
  };

  const showGenerateBtn = type === 'write' && (tabContentMap?.get(activeTab) || []).length === 0 && quota && quota.dayLeft >= 0;

  useEffect(() => {
    if (visible) {
      fetchQuota();
      fetchRecord();
    }
  }, [visible]);

  useEffect(() => {
    form.setFieldsValue(currentValues);
  }, []);

  useEffect(() => {
    const contentList = tabContentMap?.get(activeTab) || [];
    changeContentByNum(contentList.length - 1);
  }, [contentChange]);

  useEffect(() => {
    changeContentByNum(0);
  }, [activeTab]);

  useEffect(() => {
    if (type === 'retouch') {
      setActiveTab('retouch');
      setCurrentValues(cloneDeep(defaultValueMap['retouch']));
    }
  }, [type]);

  const errorComp = () => {
    return (
      // style={{ position: 'absolute', background: '#FFEFED', marginBottom: '0px', bottom: '0px', height: '42px', width: '100%' }}

      <div className={styles.err}>
        <img className={styles.icon} src={ErrorSvg} />
        {type === 'write' && writeErr && <div className={styles.text}>{writeErr.message}</div>}
        {type === 'retouch' && retouchErr && <div className={styles.text}>{retouchErr.message}</div>}
        {writeErr?.message != ai_limit_err_msg && retouchErr?.message !== ai_limit_err_msg && (
          <div
            onClick={() => {
              if (type === 'retouch') {
                onRetouch(null);
              }
              if (type === 'write') {
                onBuildMail(null);
              }
            }}
            className={styles.refresh}
          >
            {getIn18Text('ZHONGSHI')}
          </div>
        )}
      </div>
    );
  };

  const WriteResultComp = () => {
    if (type === 'retouch') {
      return null;
    }
    if (type === 'write' && (tabContentMap?.get(activeTab) || []).length === 0) {
      return null;
    }
    return (
      <div className={styles.content}>
        <div className={styles.contentName}>生成内容如下</div>
        <div className={styles.contentHeader}>
          <Translate
            language={activeTransFrom}
            isTranslation={activeIsTranslation}
            contents={activeContent}
            setLoading={setTranslateLoading}
            onTranslate={onTranslate}
            needServerRes={!activeTranslation || activeTranslation.length === 0}
            sourceType="aiWriting"
          />
          <div className={styles.contentOperate}>
            <div>
              <LeftOutlined
                onClick={() => {
                  changeCont('left', contentNum === 0);
                }}
                style={{ color: contentNum === 0 || isLoading || !!translateLoading ? '#ddd' : '#3F465C' }}
              />
              <span className={styles.contentCount}>
                {contentNum + 1} / {(tabContentMap?.get(activeTab) || []).length}
              </span>
              <RightOutlined
                onClick={() => {
                  changeCont('right', contentNum + 1 === (tabContentMap?.get(activeTab) || []).length);
                }}
                style={{ color: isLoading || !!translateLoading || contentNum + 1 === (tabContentMap?.get(activeTab) || []).length ? '#ddd' : '#3F465C' }}
              />
            </div>
            <div>
              <Button
                onClick={() => {
                  edmDataTracker.track('waimao_mail_click_aiWritingemail_generate', {
                    type: 'regenerate',
                    way: source,
                  });
                  onBuildMail();
                }}
                className={styles.contentBtn}
                disabled={currentValues.requiredList?.some(i => !currentValues[i]) || isLoading || !!translateLoading}
              >
                {getIn18Text('CHONGXINSHENGCHENG')}
              </Button>
              <CopyToClipboard
                onCopy={(_, result) => {
                  edmDataTracker.track('waimao_mail_click_aiWritingemail​_copy', {
                    way: source,
                  });
                  message.success({
                    content: getIn18Text('FUZHICHENGGONG'),
                  });
                }}
                options={{ format: 'text/plain' }}
                text={(tabContentMap?.get(activeTab) || [])[contentNum]?.content}
              >
                <Button className={styles.contentBtn}>{getIn18Text('YIJIANFUZHI')}</Button>
              </CopyToClipboard>

              <Button type="primary" onClick={insertContent} className={styles.contentBtn} disabled={isLoading || !!translateLoading}>
                {getIn18Text('TIANRUDAOYOUJIAN')}
              </Button>
            </div>
          </div>
        </div>
        <div className={styles.contentBody} style={{ display: !!translateLoading || !activeIsTranslation ? 'block' : 'none' }}>
          <TransLoadingComp loading={translateLoading} />
          <div id="ai-write-mail-editor"> </div>
        </div>
        <div className={styles.translationList} style={{ display: !translateLoading && activeIsTranslation ? 'block' : 'none' }}>
          {activeContent.map((i, index) => (
            <div className={styles.item}>
              <div className={styles.original}>{i}</div>
              <div className={styles.translationBox}>
                <p className={styles.translation}>
                  <span>{getIn18Text('FANYI')}</span>
                  {activeTranslation[index] || ''}
                </p>
                <p className={styles.youdao}>
                  <span>{getIn18Text('YIv16')}</span>翻译结果来自有道词典
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const RetouchResultComp = () => {
    if (type === 'write') {
      return null;
    }
    return (
      <div className={styles.retouch}>
        <div className={styles.title}>{getIn18Text('RUNSEJIEGUORUXIA：')}</div>
        <div className={styles.contentHeader}>
          <Translate
            language={retouchTransFrom}
            isTranslation={retouchTranslation}
            contents={retouchTextSection()}
            setLoading={setTranslateLoading}
            onTranslate={onRetouchTranslate}
            needServerRes={!retouchTransContent || retouchTransContent.length === 0}
            sourceType="aiRephrase"
          />
          <div className={styles.contentOperate}>
            <div>
              <LeftOutlined
                onClick={() => {
                  changeCont('left', contentNum === 0);
                }}
                style={{ color: contentNum === 0 || isLoading || !!translateLoading ? '#ddd' : '#3F465C' }}
              />
              <span className={styles.contentCount}>
                {contentNum + 1} / {(tabContentMap?.get(activeTab) || []).length}
              </span>
              <RightOutlined
                onClick={() => {
                  changeCont('right', contentNum + 1 === (tabContentMap?.get(activeTab) || []).length);
                }}
                style={{ color: isLoading || !!translateLoading || contentNum + 1 === (tabContentMap?.get(activeTab) || []).length ? '#ddd' : '#3F465C' }}
              />
            </div>
            <div>
              <Button
                onClick={() => {
                  edmDataTracker.track('waimao_mail_click_aiWritingemail_generate', {
                    type: 'regenerate',
                    way: source,
                  });
                  onRetouch(null);
                }}
                className={styles.contentBtn}
                disabled={isLoading || !!translateLoading}
              >
                {getIn18Text('CHONGXINSHENGCHENG')}
              </Button>
              <CopyToClipboard
                onCopy={(_, result) => {
                  edmDataTracker.track('waimao_mail_click_aiWritingemail​_copy', {
                    way: source,
                  });
                  message.success({
                    content: getIn18Text('FUZHICHENGGONG'),
                  });
                }}
                options={{ format: 'text/plain' }}
                text={(tabContentMap?.get(activeTab) || [])[contentNum]?.content}
              >
                <Button className={styles.contentBtn}>{getIn18Text('YIJIANFUZHI')}</Button>
              </CopyToClipboard>

              <Button type="primary" onClick={insertContent} className={styles.contentBtn} disabled={isLoading || !!translateLoading}>
                {getIn18Text('TIANRUDAOYOUJIAN')}
              </Button>
            </div>
          </div>
        </div>
        <div className={styles.contentBody} style={{ display: !!translateLoading || !retouchTranslation ? 'block' : 'none' }}>
          <TransLoadingComp loading={translateLoading} />
          <div className={styles.oriContent}>{getCurrentRetouchText()}</div>
        </div>
        <div className={styles.translationList} style={{ display: !translateLoading && retouchTranslation ? 'block' : 'none' }}>
          {retouchTextSection().map((i, index) => (
            <div className={styles.item}>
              <div className={styles.original}>{i}</div>
              <div className={styles.translationBox}>
                <p className={styles.translation}>
                  <span>{getIn18Text('FANYI')}</span>
                  {retouchTransContent[index] || ''}
                </p>
                <p className={styles.youdao}>
                  <span>{getIn18Text('YIv16')}</span>翻译结果来自有道词典
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const LoadingComp = () => {
    return (
      <div className={styles.loadingGif}>
        <img src={LoadingGif} alt="" width="100" height="100" />
      </div>
    );
  };

  const RetouchOriginComp = () => {
    if (type === 'write') {
      return null;
    }
    return (
      <div className={styles.retouch}>
        <div className={styles.titleArea}>
          <div className={styles.titleContent}>
            <div className={styles.title}>{getIn18Text('DAIRUNSEYUANWENRUXIA')}</div>
            <div className={styles.subTitle}>{getIn18Text('YOUJIANYUANWENJIANYI1')}</div>
          </div>
          <Button
            className={styles.retouchAction}
            onClick={() => onRetouch(currentValues)}
            disabled={!quota?.dayLeft && ['sirius', 'ultimate'].includes(productAuthApi.doGetProductVersionId())}
          >
            {getIn18Text('KAISHIRUNSE')}
          </Button>
        </div>
        <div className={styles.oriContent}>{originalContent}</div>
      </div>
    );
  };

  const TabsComp = () => {
    return (
      <div className={styles.tabs}>
        <div className={styles.tabsTitle}>邮件用途:</div>
        <Tabs className={styles.tabsTabs} onChange={onTabChange} activeKey={activeTab}>
          {renderTabPanes()}
        </Tabs>
      </div>
    );
  };

  const FormComp = () => {
    return (
      <Form
        className={styles.form}
        {...layout}
        layout="vertical"
        onValuesChange={onValuesChange}
        form={form}
        onFinish={onBuildMail}
        style={{ paddingBottom: showGenerateBtn ? '92px' : '20px' }}
      >
        <AiForm
          writeValue={currentValues}
          type={type}
          // visible={visible}
          inputMemory={inputMemory}
          sendWriteValue={values => {
            onValuesChange(values);
          }}
        />
        {showGenerateBtn && (
          <Form.Item
            {...tailLayout}
            style={{
              textAlign: 'center',
              height: writeErr || retouchErr || quota?.dayLeft === 0 ? '90px' : '72px',
              lineHeight: writeErr || retouchErr || quota?.dayLeft === 0 ? '58px' : '72px',
            }}
            className={styles.formFooter}
          >
            <Button
              type="primary"
              onClick={() => {
                edmDataTracker.track('waimao_mail_click_aiWritingemail_generate', {
                  type: 'generate',
                  way: source,
                });
              }}
              htmlType="submit"
              disabled={
                (currentValues.requiredList?.some(i => !currentValues[i]) || isLoading || !!translateLoading || !quota?.dayLeft) &&
                ['sirius', 'ultimate'].includes(productAuthApi.doGetProductVersionId())
              }
            >
              生成邮件内容
            </Button>
          </Form.Item>
        )}
        {(writeErr || retouchErr || quota?.dayLeft === 0) && ['sirius', 'ultimate'].includes(productAuthApi.doGetProductVersionId()) && errorComp()}
      </Form>
    );
  };

  return (
    <Drawer
      bodyStyle={{ padding: '0px' }}
      contentWrapperStyle={{ width: '640px' }}
      title={null}
      closable={false}
      onClose={() => closeSelf()}
      visible={visible}
      getContainer={document.body}
      zIndex={1000}
      className="aiWriteMailDrawer"
    >
      <div className={styles.aiWriteMail}>
        {HeaderComp()}
        <div>
          {type === 'write' && TabsComp()}
          {FormComp()}
          {isLoading && LoadingComp()}
          {type === 'write' && WriteResultComp()}
          {type === 'retouch' && !guardString(getCurrentRetouchText()) && RetouchOriginComp()}
          {type === 'retouch' && guardString(getCurrentRetouchText()) && RetouchResultComp()}
        </div>
      </div>
    </Drawer>
  );
};
