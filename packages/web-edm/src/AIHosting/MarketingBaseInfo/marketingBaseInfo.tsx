/*
 * @Author: zhangqingsong
 * @Description: 基础信息页面
 */

import React, { useState, useEffect, useImperativeHandle, useRef } from 'react';
import { Form, FormInstance, Tooltip, InputNumber, Popover } from 'antd';
import lodashGet from 'lodash/get';
import isString from 'lodash/isString';
import moment, { Moment } from 'moment';
import { api, apis, EdmSendBoxApi, getIn18Text, GlobalSearchApi, PositionObj } from 'api';
import update from 'immutability-helper';
import { useAppSelector } from '@web-common/state/createStore';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import SiriusTimePicker from '@web-common/components/UI/TimePicker';
// import SiriusTimePicker from '@lingxi-common-component/sirius-ui/TimePicker';

// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import Cascader from '@web-common/components/UI/Cascader';
import Cascader from '@lingxi-common-component/sirius-ui/Cascader';
import { SenderEmail } from '../../components/SenderEmail/senderEmail';
import { EmailSenderList, Interface } from '../../senderRotate/emailSenderList';
import { BasicInput, IndustryItem } from '../AiHostingEdit/index';
import { ReactComponent as TongyongShuomingXian } from '@web-common/images/newIcon/tongyong_shuoming_xian.svg';
import { useGlobalSearchCountryHook } from '../../../../web/src/components/Layout/globalSearch/hook/globalSearchCountryHook';
import AutoTaskIntroduceImg from '@/images/icons/edm/yingxiao/auto_task_introduce.png';
import { ReactComponent as AutoTaskBall1Icon } from '@/images/icons/edm/yingxiao/auto_task_ball1.svg';
import { ReactComponent as AutoTaskBall2Icon } from '@/images/icons/edm/yingxiao/auto_task_ball2.svg';
import AutoTaskHelpImg from '@/images/icons/edm/yingxiao/auto_task_help.png';
import styles from './marketingBaseInfo.module.scss';
import SiriusSelect from '@web-common/components/UI/SiriusSelect';

const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const systemApi = api.getSystemApi();

// 输入与限制数量组件
const AiHostingInputCount: React.FC<{ total: number; current: number }> = props => {
  const { total, current } = props;
  return (
    <span className={styles.baseInfoInputCount}>
      {current}/{total}
    </span>
  );
};

const DayConf = {
  '1': [1, 2, 3, 4, 5],
  '2': [1, 2, 3, 4, 5, 6, 7],
};

// interface LanguageItem {
//   label: string;
//   languageEng: string;
//   value: string;
// }

interface BaseInfoFormProps {
  form: FormInstance<BasicInput>;
  initialValues?: BasicInput;
  baseInfoChange: (changedValues: Record<string, any>) => void;
  sourceType?: string;
  isAuto?: boolean;
}

const MarketingBaseInfo = React.forwardRef((props: BaseInfoFormProps, ref) => {
  const [continentList] = useGlobalSearchCountryHook();
  const { form, baseInfoChange, sourceType, isAuto = false, initialValues } = props;
  const [userName, setUserName] = useState<string>(initialValues?.setting?.sender || '');
  const [replyMail, setReplyMail] = useState<string>(initialValues?.setting?.replyEmail || '');
  // 主营产品
  const [products, setProducts] = useState<string>('');
  // 选中的第一个国家地区
  const [targetCountry, setTargetCountry] = useState<string[][]>([]);
  // 任务名称
  const [taskName, setTaskName] = useState<string>('');
  // 用户是否开始编辑任务名称
  const [taskNameEdited, setTaskNameEdited] = useState<boolean>(false);
  // 缓存标识
  const aiHostingCache = useAppSelector(state => state.aiWriteMailReducer.aiHostingCache);
  // const [companyName, setCompanyName] = useState<string>(innerBasicInput?.req?.company || '');
  // 行业列表
  // const [industryList, setIndustryList] = useState<IndustryItem[]>([]);
  // const [showIndustry, setShowIndustry] = useState<boolean>(false);
  // const [companyIndustry, setCompanyIndustry] = useState<string>('');
  // 语言列表
  // const [languageList, setLanguageList] = useState<LanguageItem[]>([]);

  const [dayRange, setDayRange] = useState<'1' | '2'>('1');
  const [startTime, setStartTime] = useState<Moment>();
  const [endTime, setEndTime] = useState<Moment>();
  const [sendLimit, setSendLimit] = useState(0);

  const [positionList, setPositionList] = useState<PositionObj[]>([]);
  const senderListRef = useRef<Interface>();

  useEffect(() => {
    let rule = initialValues?.ruleInfo;
    if (rule) {
      let range: '1' | '2' = rule.sendingDate.length === DayConf[2].length ? '2' : '1';
      setDayRange(range);
      let start = rule.timeDuration?.from || 10;
      let end = rule.timeDuration?.to || 22;
      setStartTime(moment().set('hour', start).set('minute', 0));
      setEndTime(moment().set('hour', end).set('minute', 0));
      setPositionList(rule.positionInfos);
      let maxSendLimit = (isAuto ? rule.autoMaxSendLimit : rule.manualMaxSendLimit) || 2000;
      setSendLimit(Math.min(rule.sendLimit, maxSendLimit));
    } else {
      setDayRange('1');
      setStartTime(moment().set('hour', 10).set('minute', 0));
      setEndTime(moment().set('hour', 22).set('minute', 0));
      setSendLimit(2000);
    }

    if (aiHostingCache && sourceType !== 'submitConfirm') {
      return;
    }
    if (initialValues) {
      form && form.setFieldsValue(initialValues);
      updateCustomerLocation();
      setUserName(initialValues.setting?.sender || '');
      setReplyMail(initialValues.setting?.replyEmail || '');

      // 如果已经有名称，不走自动生成任务名称回填的逻辑
      if (initialValues?.name) {
        setTaskNameEdited(true);
      } else {
        setProducts(initialValues?.autoRecInfo?.products || '');
      }
      handleCheckReplyEmail(initialValues.setting?.replyEmail || '');
    }
  }, [initialValues]);

  useEffect(() => {
    var historySendLimit = sendLimit;
    let maxSendCount = (isAuto ? initialValues?.ruleInfo?.autoMaxSendLimit : initialValues?.ruleInfo?.manualMaxSendLimit) || 2000;

    if (historySendLimit === 0) {
      historySendLimit = maxSendCount;
    } else {
      historySendLimit = Math.min(historySendLimit, maxSendCount);
    }

    form.setFields([
      {
        name: ['ruleInfo', 'sendLimit'],
        value: historySendLimit,
      },
    ]);
  }, [sendLimit]);

  useEffect(() => {
    form.setFields([
      {
        name: ['ruleInfo', 'positionInfos'],
        value: positionList,
      },
    ]);
  }, [positionList]);

  // 初始获取行业列表
  // useEffect(() => {
  //   getIndustryList();
  //   getLanguageList();
  // }, []);

  useImperativeHandle(ref, () => ({
    handleCheckReplyEmail,
  }));

  // 两个调用方不确定先后顺序，所以在这里统一处理
  const updateCustomerLocation = () => {
    if (!initialValues?.autoRecInfo?.customerLocation || !continentList.length) {
      form.setFields([
        {
          name: ['autoRecInfo', 'customerLocation'],
          value: undefined,
        },
      ]);
      return;
    }
    let location = initialValues?.autoRecInfo?.customerLocation;
    // 将以,分割的国家英文字符串分割成数组
    const locationList = isString(location) ? location.split(',') : Array.isArray(location) ? location.flat() : [];
    const locationArr: string[][] = [];
    continentList.forEach(item => {
      item.countries?.forEach(itm => {
        if (locationList.includes(itm.name) || locationList.includes(itm.nameCn)) {
          locationArr.push([item.continent, itm.name]);
        }
      });
    });
    form.setFields([
      {
        name: ['autoRecInfo', 'customerLocation'],
        value: locationArr,
      },
    ]);
  };

  // 组装行业进行初始化
  // useEffect(() => {
  //   const industry = initialValues?.req?.industry;
  //   if (!industry || !industryList.length) {
  //     return;
  //   }
  //   // 如果有数据回填判断是否在列表中，不在则是之前选择其他后填入的行业
  //   if (industry) {
  //     const otherIndustry = !industryList.some(item => item.value === industry);
  //     const specialIndustry = industry === 'other';
  //     if (otherIndustry) {
  //       form.setFields([
  //         {
  //           name: 'industry',
  //           value: 'other',
  //         },
  //         {
  //           name: 'industry2',
  //           value: industry,
  //         },
  //       ]);
  //     } else {
  //       form.setFields([
  //         {
  //           name: 'industry',
  //           value: industry,
  //         },
  //         {
  //           name: 'industry2',
  //           value: specialIndustry ? industry : undefined,
  //         },
  //       ]);
  //     }
  //     setShowIndustry(specialIndustry ? true : !!otherIndustry);
  //   }
  //   if (form.getFieldValue(['req', 'industry']) === 'other') {
  //     setShowIndustry(true);
  //   }
  // }, industryList);

  // 组装国家地区进行初始化
  useEffect(() => {
    updateCustomerLocation();
  }, [continentList]);

  // 初始的任务名称
  useEffect(() => {
    if ((!products && !targetCountry?.length) || taskNameEdited) {
      return;
    }
    let productName = '';
    let countryName = '';
    if (products) {
      const reg = /[,，]/g;
      const commaList = products.match(reg) || [];
      const firstProduct = commaList.length > 0 ? products.split(commaList[0])[0] : products;
      productName = (firstProduct ? firstProduct.trim() : '') + (commaList.length > 0 ? getIn18Text('DENG') : '') + '|';
    }
    if (targetCountry?.length > 0) {
      const multiple = targetCountry.length > 1;
      const continentListFlat = continentList.map(item => item.countries).flat();
      const zhName = continentListFlat.find(item => item.name === targetCountry[0][1])?.nameCn || '';
      countryName = zhName + (multiple ? getIn18Text('DENG') : '');
    }
    const taskName = `${productName}${countryName || '不限'}`.slice(0, 21) + `-${moment().format('YYYYMMDD')}`;
    form.setFieldsValue({ name: taskName });
    setTaskName(taskName);
  }, [products, targetCountry]);

  // 获取行业列表
  // const getIndustryList = async () => {
  //   const result = await edmApi.getAiIndustryList();
  //   const industries = lodashGet(result, 'industries', []).map(item => ({
  //     value: item.name,
  //     label: item.name,
  //   }));
  //   // 增加其他项
  //   industries.push({
  //     value: 'other',
  //     label: getIn18Text('QITA'),
  //   });
  //   setIndustryList(industries);
  // };

  // 获取语言列表
  // const getLanguageList = async () => {
  //   const { languages } = await edmApi.getGptConfig();
  //   setLanguageList(languages);
  // };

  const formInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, type: string) => {
    switch (type) {
      case 'useName':
        setUserName(e.target.value);
        break;
      case 'replyMail':
        setReplyMail(e.target.value);
        break;
      case 'companyName':
        // setCompanyName(e.target.value);
        break;
      case 'companyIndustry':
        // setCompanyIndustry(e.target.value);
        break;
      case 'products':
        setProducts(e.target.value);
        break;
      case 'taskName':
        setTaskNameEdited(true);
        setTaskName(e.target.value);
        break;
      default:
    }
  };

  // 营销发信规则设置时间
  useEffect(() => {
    if (!startTime || !endTime) {
      return;
    }
    const endHour = endTime.get('hour');
    const startHour = startTime.get('hour');
    if ((endHour - startHour < 4 && endHour - startHour >= 0) || (endHour - startHour < 0 && endHour - startHour + 24 < 4)) {
      form.setFields([
        {
          name: ['ruleInfo', 'timeDuration'],
          errors: ['开始时间与结束时间间隔不能小于4小时'],
        },
      ]);
    } else {
      form.setFields([
        {
          name: ['ruleInfo', 'timeDuration'],
          value: { from: startTime.get('hour'), to: endTime.get('hour') },
          errors: [],
        },
      ]);
    }
  }, [startTime, endTime]);

  useEffect(() => {
    if (dayRange === '1') {
      form.setFields([
        {
          name: ['ruleInfo', 'sendingDate'],
          value: DayConf[1],
        },
      ]);
    }
    if (dayRange === '2') {
      form.setFields([
        {
          name: ['ruleInfo', 'sendingDate'],
          value: DayConf[2],
        },
      ]);
    }
  }, [dayRange]);

  const productValidator = (_, value) => {
    const valueStr = value || '';
    // 最多1000个字符
    if (valueStr.length > 1000) {
      return Promise.reject(new Error('最多输入1000个中文或字母'));
    }
    return Promise.resolve();
  };

  const handleCountry = (valList: string[][]) => {
    setTargetCountry(valList);
  };

  // 校验回复邮箱是否是三方域名绑定的域别名，生成的邮箱别名
  const handleCheckReplyEmail = async (email: string) => {
    if (!email) {
      return false;
    }
    await form.validateFields([['setting', 'replyEmail']]);
    // 基础校验通过，进行三方别名邮箱校验
    const result = await edmApi.checkReplyEmail({ email });
    if (result?.thirdAlias) {
      form.setFields([
        {
          name: ['setting', 'replyEmail'],
          errors: ['此回复邮箱无法正常收到客户回信，建议更换'],
        },
      ]);
      return false;
    }
    return true;
  };

  const sendLimitValidator = (_: any, value: string) => {
    let maxSendLimit = (isAuto ? initialValues?.ruleInfo?.autoMaxSendLimit : initialValues?.ruleInfo?.manualMaxSendLimit) || 2000;

    if (value && +value > 0 && +value <= maxSendLimit) {
      return Promise.resolve();
    }
    return Promise.reject(new Error(`发送上限范围1-${maxSendLimit}`));
  };

  const handleStartTimeChange = (date: Moment) => {
    setStartTime(date);
  };

  const TaskNameComp = () => {
    return (
      <Form.Item label={'任务名称'} name={'name'} rules={[{ required: true, message: getIn18Text('QINGSHURURENWUMINGCHENG') }]}>
        <Input
          maxLength={30}
          placeholder={getIn18Text('QINGSHURURENWUMINGCHENG')}
          onChange={e => formInputChange(e, 'taskName')}
          suffix={<AiHostingInputCount total={30} current={taskName.length} />}
        />
      </Form.Item>
    );
  };

  const TaskSendTimeComp = () => {
    return (
      <>
        <Form.Item
          label={
            <span className={styles.baseInfoLabel}>
              发送时间
              <span className={styles.baseInfoLabelDesc}>(系统会自动在设置的发送时间内，完成每日营销发送)</span>
            </span>
          }
          name={['ruleInfo', 'timeDuration']}
        >
          <div className={styles.timePick}>
            <SiriusSelect
              size="middle"
              wrapClass={styles.select}
              style={{ width: '100%', height: 32 }}
              value={dayRange}
              defaultValue={dayRange}
              onChange={setDayRange}
              options={[
                {
                  value: '1',
                  label: '工作日',
                },
                {
                  value: '2',
                  label: '全周',
                },
              ]}
            />
            <Form.Item noStyle name={['ruleInfo', 'sendingDate']} />
            <SiriusTimePicker value={startTime} onChange={(date: Moment) => handleStartTimeChange(date)} timeIntervals={60} />
            <div className={styles.splitLine}></div>
            <div className={styles.myPicker}>
              <SiriusTimePicker value={endTime} onChange={(date: Moment) => setEndTime(date)} timeIntervals={60} />
            </div>
          </div>
        </Form.Item>
        <span className={styles.baseInfoTip}>{'北京时间东八区'}</span>
      </>
    );
  };

  const TaskSendLimitComp = () => {
    let maxSendLimit = (isAuto ? initialValues?.ruleInfo?.autoMaxSendLimit : initialValues?.ruleInfo?.manualMaxSendLimit) || 2000;
    return (
      <>
        <Form.Item
          label={
            <span className={styles.baseInfoLabel}>
              单日发送上限
              <span className={styles.baseInfoLabelDesc}>(系统自动给符合条件的联系人发信，优先发送新增联系人)</span>
            </span>
          }
        >
          <div className={styles.sendLimit}>
            <Form.Item noStyle name={['ruleInfo', 'sendLimit']} rules={[{ validator: sendLimitValidator }, { required: true, message: '请输入单日发送上限' }]}>
              <InputNumber style={{ width: ' 100%' }} />
            </Form.Item>
            <span className={styles.number}>{`(1-${maxSendLimit})`}</span>
          </div>
        </Form.Item>
      </>
    );
  };

  const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    background: 'white',
    ...draggableStyle,
  });

  const onDragEnd = result => {
    if (!result.destination) {
      return;
    }
    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    const items = update(positionList, {
      $splice: [
        [startIndex, 1],
        [endIndex, 0, positionList[startIndex]],
      ],
    });
    setPositionList(items);
  };

  const handleSenderChange = () => {
    const senderList = senderListRef.current?.getSenderList() || [];
    const senderListParam = senderList.map(item => ({ email: item.email, accType: item.type }));
    form.setFieldsValue({
      senderEmails: senderListParam,
    });
  };

  const TaskPriorityComp = () => {
    return (
      <Form.Item
        name={['ruleInfo', 'positionInfos']}
        label={
          <span className={styles.baseInfoLabel}>
            修改职位优先级
            <span className={styles.baseInfoLabelDesc}>(优先给排序靠前的联系人发送)</span>
          </span>
        }
      >
        <div className={styles.priorityList}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable-1" type="PERSON" direction="horizontal">
              {(provided, snapshotDrop) => (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} ref={provided.innerRef} {...provided.droppableProps}>
                  {positionList.map((item, index) => (
                    <Draggable draggableId={item.positionType + ''} index={index} key={item.positionType}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.dragHandleProps}
                          {...provided.draggableProps}
                          style={{ ...getItemStyle(snapshot.isDragging, provided.draggableProps.style), cursor: 'all-scroll' }}
                        >
                          <div key={item.positionType} className={styles.priorityItem}>
                            {item.positionName}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {snapshotDrop.isDraggingOver && <div style={{ height: '36px' }}></div>}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </Form.Item>
    );
  };

  // 任务设置
  const TaskSettingComp = () => {
    return (
      <div className={styles.baseInfoItem}>
        <p className={styles.baseInfoTitle}>{'任务设置'}</p>
        <div className={styles.baseInfoFlex}>
          <div className={styles.formLeft}>
            {TaskNameComp()}
            {TaskSendTimeComp()}
          </div>
          <div className={styles.formRight}>
            {TaskSendLimitComp()}
            {TaskPriorityComp()}
          </div>
        </div>
      </div>
    );
  };

  // 信息设置
  const TaskBasicInfoComp = () => {
    return (
      <div className={styles.baseInfoItem}>
        <p className={styles.baseInfoTitle}>
          {'发件设置'}
          {/* <span className={styles.baseInfoDesc}>{getIn18Text('XINXITIANXIEYUEJINGZHUN')}</span> */}
        </p>
        <div className={styles.baseInfoFlex}>
          <div className={styles.formLeft}>
            <Form.Item
              label={getIn18Text('FAJIANRENNICHENG')}
              name={['setting', 'sender']}
              rules={[{ required: true, message: getIn18Text('QINGSHURUFAJIANRENNICHENG') }]}
            >
              <Input
                maxLength={200}
                placeholder={getIn18Text('QINGSHURUYOUJIANSONGDA')}
                onChange={e => formInputChange(e, 'useName')}
                suffix={<AiHostingInputCount total={200} current={userName.length} />}
              />
            </Form.Item>
            {/* <SenderEmail form={form} /> */}
            <Form.Item
              className={styles.formSender}
              label={'发件地址选择'}
              name={'senderEmails'}
              rules={[{ required: false, message: getIn18Text('QINGSHURUFAJIANDEZHI') }]}
            >
              <EmailSenderList
                ref={senderListRef}
                source="aiHosting"
                recentEmails={initialValues?.senderEmails?.map(item => item.email) || []}
                preCheckList={initialValues?.senderEmails?.map(item => item.email) || []}
                valueChanged={handleSenderChange}
              />
            </Form.Item>
          </div>
          <div className={styles.formRight}>
            <Form.Item
              label={getIn18Text('HUIFUYOUXIANG')}
              name={['setting', 'replyEmail']}
              rules={[
                { required: true, message: getIn18Text('QINGSHURUHUIFUYOUXIANG') },
                { type: 'email', message: getIn18Text('YOUXIANGGESHIBUZHENGQUE') },
              ]}
            >
              <Input
                maxLength={200}
                placeholder={getIn18Text('QINGSHURUSHOUJIANRENHUI')}
                onChange={e => formInputChange(e, 'replyMail')}
                suffix={<AiHostingInputCount total={200} current={replyMail.length} />}
                onBlur={e => handleCheckReplyEmail(e?.target?.value || '')}
              />
            </Form.Item>
          </div>
        </div>
      </div>
    );
  };

  const FillHelpComp = () => (
    <div className={styles.baseInfoItem}>
      <p className={styles.baseInfoTitle}>
        {getIn18Text('MUBIAOKEHUWAJUESHE')}
        <Popover
          placement="bottomRight"
          getPopupContainer={node => node.parentElement!}
          title={
            <div className={styles.baseInfoPopover}>
              <img className={styles.popoverImage} src={AutoTaskHelpImg} alt="自动获客任务帮助说明" />
              <p className={styles.popoverDesc}>设置搜索目标客户的条件，系统会根据条件自动推荐客户</p>
              <div className={styles.popoverList}>
                <p className={styles.popoverItem}>
                  <span>
                    公司主营产品：<span className={styles.popoverItemDesc}>即您的公司所售卖的产品名称</span>
                  </span>
                </p>
                <p className={styles.popoverItem}>
                  <span>
                    目标客户主营产品：<span className={styles.popoverItemDesc}>即您想要搜索的目标客户，他们售卖的产品名称</span>
                  </span>
                </p>
                <p className={styles.popoverItem}>
                  <span>
                    目标客户所在国家地区：<span className={styles.popoverItemDesc}>您想要找哪个国家的客户</span>
                  </span>
                </p>
              </div>
            </div>
          }
        >
          <span className={styles.fillHelp}>填写帮助</span>
        </Popover>
      </p>
      <div className={styles.baseInfoFlex}>
        <div className={styles.formLeft}>
          <Form.Item
            label={getIn18Text('GONGSIZHUYINGCHANPIN')}
            name={['autoRecInfo', 'products']}
            rules={[{ required: true, message: getIn18Text('QINGSHURUXUYAOZHUIZONGDECHANPINMINGCHENG') }, { validator: productValidator }]}
          >
            <Input placeholder={getIn18Text('QINGSHURUXUYAOZHUIZONGDECHANPINMINGCHENG')} onChange={e => formInputChange(e, 'products')} />
          </Form.Item>
          <span className={styles.baseInfoTip}>{getIn18Text('DUOGECHANPINMINGCHENGYONG')}</span>

          <Form.Item label={getIn18Text('MUBIAOKEHUSUOZAIGUO')} name={['autoRecInfo', 'customerLocation']}>
            <Cascader
              className={styles.placeholderLight}
              showSearch
              showCheckedStrategy="SHOW_CHILD"
              allowClear
              multiple
              maxTagCount="responsive"
              placeholder={getIn18Text('BUXIAN')}
              onChange={val => handleCountry(val)}
              options={continentList.map(e => ({
                label: e.continentCn,
                value: e.continent,
                children: e.countries.map(d => ({
                  label: `${d.nameCn}-${d.name}`,
                  value: d.name,
                })),
              }))}
            />
          </Form.Item>
        </div>
        <div className={styles.formRight}>
          <Form.Item
            label={
              <span className={styles.baseInfoLabel}>
                {getIn18Text('MUBIAOKEHUZHUYINGCHAN')}
                <Tooltip title={getIn18Text('NINXIANGYAOYINGXIAODEMU')}>
                  <TongyongShuomingXian />
                </Tooltip>
              </span>
            }
            name={['autoRecInfo', 'customerProducts']}
            rules={[{ validator: productValidator }]}
          >
            <Input placeholder={getIn18Text('QINGSHURUXUYAOZHUIZONGDECHANPINMINGCHENG')} />
          </Form.Item>
          <span className={styles.baseInfoTip}>{getIn18Text('DUOGECHANPINMINGCHENGYONG')}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.marketingBaseInfo}>
      {isAuto ? (
        <div className={styles.autoImage}>
          <div className={styles.autoImageLeft}>
            <span className={styles.autoImageTitle}>全自动获客营销</span>
            <div className={styles.autoImageDesc}>
              <span className={styles.autoImageItem}>海量数据自动挖掘</span>
              <span className={styles.autoImageItem}>高触达多轮营销</span>
              <span className={styles.autoImageItem}>直接获取有效回复</span>
            </div>
          </div>
          <AutoTaskBall1Icon className={styles.autoImageIcon1} />
          <AutoTaskBall2Icon className={styles.autoImageIcon2} />
          <img className={styles.autoImageRight} src={AutoTaskIntroduceImg} alt="自动获客任务介绍" />
        </div>
      ) : (
        <></>
      )}
      <Form onValuesChange={baseInfoChange} form={form} colon={false} name="aiHostingForm" layout="vertical" initialValues={initialValues}>
        {isAuto && FillHelpComp()}
        {TaskBasicInfoComp()}
        {TaskSettingComp()}
      </Form>
    </div>
  );
});

export default MarketingBaseInfo;
