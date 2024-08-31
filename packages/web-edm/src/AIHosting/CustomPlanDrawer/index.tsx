import React, { useState, useEffect, useRef } from 'react';
import style from './index.module.scss';
import { Button, Form, Input, message, Timeline, Select, InputNumber } from 'antd';
import type { Rule } from 'antd/lib/form';
import { getIn18Text, api, apis, AiHostingApi, EmailTemplateModel, HostingPlanModel, HostingMailInfoReqModel, HostingMailInfoModel, ExpandMailInfos } from 'api';
import cloneDeep from 'lodash/cloneDeep';
// import SiriusDrawer from '@web-common/components/UI/SiriusDrawer';
import SiriusDrawer from '@lingxi-common-component/sirius-ui/SiriusDrawer';
import toast from '@web-common/components/UI/Message/SiriusMessage';
// import CheckBox from '@web-common/components/UI/Checkbox';
import CheckBox from '@lingxi-common-component/sirius-ui/Checkbox';
import { ReactComponent as TimelineClock } from '@/images/icons/edm/yingxiao/timeline-clock.svg';
import { ReactComponent as TimelineAdd } from '@/images/icons/edm/yingxiao/timeline-add.svg';
import { ReactComponent as TimelineMail } from '@/images/icons/edm/yingxiao/timeline-mail.svg';
import { ReactComponent as TimelineRemove } from '@/images/icons/edm/yingxiao/timeline-remove.svg';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';

interface CustomPlanDrawerModel {
  visible: boolean;
  closeDrawer: (refresh?: boolean) => void;
  taskId: string;
  hostingPlan: HostingPlanModel | null;
}

interface MailInfoModel {
  templateId?: number;
  emailName?: string;
  emailDesc?: string;
  emailPurpose?: string;
  expandMailInfos?: Array<ExpandMailInfos>;
}

interface planInfosModel extends MailInfoModel {
  index: number;
  lineType: 'normal' | 'interval';
  time?: string;
}

type tPlanInfoKeys = keyof planInfosModel;

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 24 },
};

const getDefaultExpandMailInfos: () => Array<ExpandMailInfos> = () => [
  // {
  //   mailTemplateId: undefined,
  //   emailPurpose: '',
  //   emailName: '',
  //   emailDesc: '',
  //   mailType: 0,
  // },
  {
    mailTemplateId: undefined,
    emailPurpose: '',
    emailName: '',
    emailDesc: '',
    mailType: 1,
  },
];

const defaultPlanInfos: planInfosModel[] = [
  {
    index: 0,
    lineType: 'normal',
    templateId: undefined,
    emailName: '',
    emailDesc: '',
    emailPurpose: '',
  },
  {
    index: 1,
    time: '',
    lineType: 'interval',
  },
  {
    index: 1,
    lineType: 'normal',
    templateId: undefined,
    emailName: '',
    emailDesc: '',
    emailPurpose: '',
    expandMailInfos: [],
  },
];

export const TimeLineIconMap: Record<string, any> = {
  normal: <TimelineMail />,
  interval: <TimelineClock />,
  add: <TimelineAdd />,
  remove: <TimelineRemove style={{ marginRight: '4px' }} />,
};

const rules = {
  emailName: [
    { required: true, message: getIn18Text('QINGTIANXIEYOUJIANLEIXING') },
    { type: 'string', max: 10, message: getIn18Text('ZUIDUOSHURU10GE') },
  ],
  emailPurpose: [
    { required: true, message: getIn18Text('QINGMIAOSHUYOUJIANJUTI') },
    { type: 'string', max: 500, message: getIn18Text('ZUIDUOSHURU500') },
  ],
  time: [{ required: true, message: getIn18Text('QINGSHURUSHIJIANJIANGE') }],
  templateId: [{ required: true, message: getIn18Text('QINGXUANZEYOUJIANLEIXING') }],
  planName: [
    { required: true, message: getIn18Text('QINGSHURUYINGXIAOFANGAN') },
    { type: 'string', max: 20, message: getIn18Text('ZUIDUOSHURU20ZI') },
  ],
  childTemplateId(value?: number) {
    return [
      ({ getFieldValue }: any) => ({
        validator() {
          if (value != null) {
            return Promise.resolve();
          }
          return Promise.reject(new Error(getIn18Text('QINGXUANZEYOUJIANLEIXING')));
        },
      }),
    ];
  },
  childEmailName(value?: string) {
    return [
      ({ getFieldValue }: any) => ({
        validator() {
          if (value) {
            if (value.length > 500) {
              return Promise.reject(new Error(getIn18Text('ZUIDUOSHURU500')));
            }
            return Promise.resolve();
          }
          return Promise.reject(new Error(getIn18Text('QINGTIANXIEYOUJIANLEIXING')));
        },
      }),
    ];
  },
  childEmailPurpose(value?: string) {
    return [
      ({ getFieldValue }: any) => ({
        validator() {
          if (value) {
            if (value.length > 20) {
              return Promise.reject(new Error(getIn18Text('ZUIDUOSHURU20ZI')));
            }
            return Promise.resolve();
          }
          return Promise.reject(new Error(getIn18Text('QINGMIAOSHUYOUJIANJUTI')));
        },
      }),
    ];
  },
};

const { TextArea } = Input;
const UNREMOVECOUNT = 2;
const OPENABLE_STATUS_COUNT = 1;

const aiHostingApi = api.requireLogicalApi(apis.aiHostingApiImpl) as AiHostingApi;

export const CustomPlanDrawer = React.forwardRef((props: CustomPlanDrawerModel, ref) => {
  const [form] = Form.useForm();
  const { visible, closeDrawer, taskId, hostingPlan } = props;
  const [planInfos, setPlanInfos] = useState<planInfosModel[]>(cloneDeep(defaultPlanInfos));

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateModel[]>([]);
  const templateObjRef = useRef<Map<number, EmailTemplateModel>>(new Map());

  const changeInfoByKey = (cInfo: planInfosModel, value: string | number, key: tPlanInfoKeys) => {
    const { index, lineType } = cInfo;
    const nInfo = planInfos.map(info => {
      if (index === info.index && info.lineType === lineType && info.hasOwnProperty(key)) {
        info[key] = value;
        if (key === 'templateId') {
          info.emailName = value === 0 ? '' : templateObjRef.current.get(value as number)?.emailName;
          info.emailDesc = value === 0 ? '' : templateObjRef.current.get(value as number)?.emailDesc;
        }
      }
      return info;
    });
    setPlanInfos(nInfo);
  };

  const changeChildInfoByKey = (info: ExpandMailInfos, value: string | number, key: keyof ExpandMailInfos) => {
    info[key] = value;
    if (key === 'mailTemplateId') {
      info.emailName = value === 0 ? '' : templateObjRef.current.get(value as number)?.emailName || '';
      info.emailDesc = value === 0 ? '' : templateObjRef.current.get(value as number)?.emailDesc || '';
    }
    setPlanInfos([...planInfos]);
  };

  const getConfigByIndex = (index: number, needExpand?: boolean): planInfosModel[] => {
    const expandMailInfos = needExpand ? { expandMailInfos: getDefaultExpandMailInfos() } : {};

    return [
      {
        index: index,
        time: '',
        lineType: 'interval',
      },
      {
        index: index,
        lineType: 'normal',
        templateId: undefined,
        emailName: '',
        emailDesc: '',
        emailPurpose: '',
        ...expandMailInfos,
      },
    ];
  };

  const getTaskCount = () => {
    let taskCount = 0;
    planInfos.forEach(info => {
      if (info.lineType === 'normal') {
        taskCount++;
        taskCount += info.expandMailInfos?.length || 0;
      }
    });
    return taskCount;
  };

  const addPlan = () => {
    // 总任务不能超过20个，包含 expandMailInfos 任务
    let taskCount = getTaskCount();
    const lastIndex = planInfos[planInfos.length - 1].index;
    if (taskCount >= 20) {
      toast.error({
        content: getIn18Text('ZUIDALUNCIWEI20'),
      });
      return;
    }
    let nPlanInfos: planInfosModel[];
    // if (taskCount === 19) {
    //   nPlanInfos = planInfos.concat(getConfigByIndex(lastIndex + 1));
    // } else {
    //   nPlanInfos = planInfos.concat(getConfigByIndex(lastIndex + 1, true));
    // }
    nPlanInfos = planInfos.concat(getConfigByIndex(lastIndex + 1));
    setPlanInfos(nPlanInfos);
  };

  const removePlan = (index: number) => {
    const nPlanInfos: planInfosModel[] = [];
    planInfos.forEach(plan => {
      if (plan.index !== index) {
        if (plan.index > index) {
          --plan.index;
        }
        nPlanInfos.push(plan);
      }
    });
    toast.success({ content: getIn18Text('YISHANCHU') });
    setPlanInfos(nPlanInfos);
  };

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { value } = e.target;
    if (value.length > 20) {
      message.error({
        content: getIn18Text('FANGANMINGCHENGBUDECHAO'),
      });
      value = value.slice(0, 20);
    }
    form.setFieldsValue({ planName: value });
  };

  const getEmailTemplates = () => {
    aiHostingApi.getAiHostingPlanEmailTemplates().then(res => {
      const { emailTemplates } = res;
      if (emailTemplates && emailTemplates.length > 0) {
        setEmailTemplates(emailTemplates);
        let tempObj = new Map();
        emailTemplates.forEach(item => {
          tempObj.set(item.templateId, item);
        });
        templateObjRef.current = tempObj;
      }
    });
  };

  const getTimeAndInfos = () => {
    const timeInterval: number[] = [];
    const mailInfos: HostingMailInfoReqModel[] = [];
    planInfos.forEach(info => {
      if (info.lineType === 'interval') {
        timeInterval.push(Number(info.time));
      } else {
        mailInfos.push({
          mailTemplateId: info.templateId as number,
          emailName: info.emailName || '',
          emailDesc: info.emailDesc || '',
          emailPurpose: info.emailPurpose || '',
          expandMailInfos: info.expandMailInfos || [],
        });
      }
    });
    return { timeInterval, mailInfos };
  };

  const getHostingPlanInfoByKey = (key: number) => {
    if (!!hostingPlan) {
      const info = hostingPlan.mailInfos[key];
      return {
        templateId: info.mailTemplateId,
        emailName: info.emailName,
        emailDesc: info.emailDesc,
        emailPurpose: info.emailPurpose,
        // 深拷贝一下
        expandMailInfos: cloneDeep(info.expandMailInfos),
      };
    }
    return {};
  };

  const handleHostingPlan = () => {
    if (hostingPlan) {
      form.setFieldsValue({ planName: hostingPlan.planName });
      const firstInfo = getHostingPlanInfoByKey(0);
      const timeInterval = hostingPlan.rule.timeInterval;
      let tPlanInfos: planInfosModel[] = [
        {
          index: 0,
          lineType: 'normal',
          ...firstInfo,
        },
      ];
      for (let i = 1; i < hostingPlan.mailInfos.length; i++) {
        const curInfo = getHostingPlanInfoByKey(i);
        const interval: planInfosModel = {
          index: i,
          time: String(timeInterval[i - 1]),
          lineType: 'interval',
        };
        const normal: planInfosModel = {
          index: i,
          lineType: 'normal',
          ...curInfo,
        };
        tPlanInfos = tPlanInfos.concat([interval, normal]);
      }
      setPlanInfos(tPlanInfos);
    }
  };

  // 获取全部参数
  const configParams = () => {
    const nPlanName = form.getFieldValue('planName');
    const { timeInterval, mailInfos } = getTimeAndInfos();
    return {
      taskId: taskId || '',
      planInfo: {
        planId: hostingPlan?.planId || '',
        planName: nPlanName || '',
        planTags: [
          {
            tagName: getIn18Text('ZIDINGYIFANGAN'), //本期写死即可
          },
        ],
        rule: {
          timeInterval: timeInterval,
          timeUnit: 1, //本期定值，代表时间单位：天
          timeBetweenLoops: 30, //本期定值，循环周期间隔
        },
        mailInfos: mailInfos,
      },
    };
  };

  const onSubmit = () => {
    form.setFieldsValue({ planName: form.getFieldValue('planName')?.trim() || '' });
    form
      .validateFields()
      .then(async values => {
        console.log('onSubmit======succ', values);
        const params = configParams();
        const res = await aiHostingApi.saveAiHostingPlan(params);
        console.log('onSubmit==========', params, res);
        if (res && !!res.planId) {
          toast.success({ content: !!hostingPlan ? getIn18Text('XIUGAICHENGGONG！') : getIn18Text('XINZENGCHENGGONG') });
          closeDrawer(true);
          return;
        }
        toast.error({ content: !!hostingPlan ? getIn18Text('XIUGAISHIBAI！') : getIn18Text('XINZENGSHIBAI') });
      })
      .catch(err => {
        console.log('onSubmit======', err);
      });
  };

  const renderFooter = () => {
    return (
      <div className={style.footer}>
        <Button
          onClick={() => {
            closeDrawer();
          }}
          style={{ marginRight: '16px' }}
        >
          {getIn18Text('setting_system_switch_cancel')}
        </Button>
        <Button type="primary" onClick={onSubmit}>
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    );
  };

  const renderOtherComp = (cInfo: planInfosModel, name: number) => {
    return (
      <div className={style.otherComp}>
        <Form.Item label="" name={[name, 'emailName']} rules={rules.emailName}>
          <Input
            className={style.input}
            placeholder={getIn18Text('QINGTIANXIEYOUJIANLEIXING')}
            value={cInfo.emailName}
            onChange={e => changeInfoByKey(cInfo, e.target.value, 'emailName')}
          />
        </Form.Item>
        <Form.Item label="" name={[name, 'emailPurpose']} rules={rules.emailPurpose}>
          <TextArea
            className={style.input}
            showCount
            placeholder={getIn18Text('QINGMIAOSHUYOUJIANDEJU')}
            value={cInfo.emailPurpose}
            maxLength={500}
            onChange={e => changeInfoByKey(cInfo, e.target.value, 'emailPurpose')}
          />
        </Form.Item>
      </div>
    );
  };

  // 二级信息
  const renderChildOtherComp = (cInfo: ExpandMailInfos, name: number) => {
    return (
      <div className={style.otherComp}>
        <Form.Item label="" name="" rules={rules.childEmailName(cInfo.emailName)}>
          <div>
            <Input
              className={style.input}
              placeholder={getIn18Text('QINGTIANXIEYOUJIANLEIXING')}
              value={cInfo.emailName}
              onChange={e => changeChildInfoByKey(cInfo, e.target.value, 'emailName')}
            />
          </div>
        </Form.Item>
        <Form.Item label="" name="" rules={rules.childEmailPurpose(cInfo.emailPurpose)}>
          <div>
            <TextArea
              className={style.input}
              showCount
              placeholder={getIn18Text('QINGMIAOSHUYOUJIANDEJU')}
              value={cInfo.emailPurpose}
              maxLength={500}
              onChange={e => changeChildInfoByKey(cInfo, e.target.value, 'emailPurpose')}
            />
          </div>
        </Form.Item>
      </div>
    );
  };

  const renderTitleComp = (info: planInfosModel, name: number) => {
    return (
      <div>
        {info.lineType === 'normal' ? (
          <div className={style.title}>
            {`第${info.index + 1}轮邮件`}
            <div className={style.titleRight}>
              {info.index >= OPENABLE_STATUS_COUNT && (
                <CheckBox
                  checked={!!info.expandMailInfos?.length}
                  onChange={checked => {
                    let taskCount = getTaskCount();
                    if (taskCount >= 20 && checked.target.checked) {
                      toast.error({
                        content: getIn18Text('ZUIDALUNCIWEI20'),
                      });
                      return;
                    }
                    info.expandMailInfos = checked.target.checked ? getDefaultExpandMailInfos() : [];
                    setPlanInfos([...planInfos]);
                  }}
                >
                  按打开状态发信
                </CheckBox>
              )}
              {info.index >= UNREMOVECOUNT && (planInfos.length - 1) / 2 === info.index && (
                <span
                  className={style.remove}
                  onClick={() => {
                    removePlan(info.index);
                  }}
                >
                  {TimeLineIconMap['remove']}
                  <span>{getIn18Text('SHANCHU')}</span>
                </span>
              )}{' '}
            </div>
          </div>
        ) : (
          <div className={style.time}>
            <span className={style.timeText}>{getIn18Text('SHIJIANJIANGE')}</span>
            <Form.Item label="" name={[name, 'time']} rules={rules.time}>
              <InputNumber
                precision={0}
                min={'1'}
                max={'365'}
                className={style.timeInput}
                placeholder={getIn18Text('QINGSHURU')}
                value={info.time || ''}
                onChange={value => changeInfoByKey(info, value, 'time')}
              />{' '}
            </Form.Item>
            <span className={style.timeText}>{getIn18Text('TIANYISHANG')}</span>
          </div>
        )}
      </div>
    );
  };

  const renderContentComp = (info: planInfosModel, name: number) => {
    const renderFormItem = (mailType: number, childInfo?: ExpandMailInfos) => {
      if (mailType === 1 && childInfo) {
        return (
          <React.Fragment key={mailType}>
            <div
              style={{
                marginTop: 8,
              }}
            >
              第{info.index}轮打开未回复
            </div>
            <Form.Item label="" name="" rules={rules.childTemplateId(childInfo.mailTemplateId)}>
              <div>
                <EnhanceSelect
                  key={mailType}
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  value={childInfo.mailTemplateId}
                  onChange={value => changeChildInfoByKey(childInfo, value, 'mailTemplateId')}
                  placeholder={getIn18Text('QINGXUANZEYOUJIANLEIXING')}
                >
                  {emailTemplates.map(item => (
                    <InSingleOption key={item.templateId} value={item.templateId}>
                      {item.templateDesc}
                    </InSingleOption>
                  ))}
                </EnhanceSelect>
              </div>
            </Form.Item>
            {typeof childInfo.mailTemplateId === 'number' &&
              (childInfo.mailTemplateId === 0 ? (
                renderChildOtherComp(childInfo, name)
              ) : (
                <div className={style.purpose}>{templateObjRef.current.get(childInfo.mailTemplateId)?.emailDesc || info.emailDesc || ''}</div>
              ))}
          </React.Fragment>
        );
      }

      return (
        <React.Fragment key={mailType}>
          <div>第{info.index}轮未打开</div>
          <Form.Item label="" name={[name, 'templateId']} rules={rules.templateId}>
            <EnhanceSelect
              key={mailType}
              getPopupContainer={triggerNode => triggerNode.parentNode}
              value={info.templateId}
              onChange={value => changeInfoByKey(info, value, 'templateId')}
              placeholder={getIn18Text('QINGXUANZEYOUJIANLEIXING')}
            >
              {emailTemplates.map(item => (
                <InSingleOption key={item.templateId} value={item.templateId}>
                  {item.templateDesc}
                </InSingleOption>
              ))}
            </EnhanceSelect>
          </Form.Item>
          {typeof info.templateId === 'number' &&
            (info.templateId === 0 ? (
              renderOtherComp(info, name)
            ) : (
              <div className={style.purpose}>{templateObjRef.current.get(info.templateId)?.emailDesc || info.emailDesc || ''}</div>
            ))}
        </React.Fragment>
      );
    };

    if (info.expandMailInfos?.length) {
      return (
        <div className={style.container}>
          {renderFormItem(0)}
          {renderFormItem(1, info.expandMailInfos[0])}
        </div>
      );
    }
    return (
      <div className={style.container}>
        <Form.Item label="" name={[name, 'templateId']} rules={rules.templateId}>
          <EnhanceSelect
            getPopupContainer={triggerNode => triggerNode.parentNode}
            value={info.templateId}
            onChange={value => changeInfoByKey(info, value, 'templateId')}
            placeholder={getIn18Text('QINGXUANZEYOUJIANLEIXING')}
          >
            {emailTemplates.map(item => (
              <InSingleOption key={item.templateId} value={item.templateId}>
                {item.templateDesc}
              </InSingleOption>
            ))}
          </EnhanceSelect>
        </Form.Item>
        {typeof info.templateId === 'number' &&
          (info.templateId === 0 ? (
            renderOtherComp(info, name)
          ) : (
            <div className={style.purpose}>{templateObjRef.current.get(info.templateId)?.emailDesc || info.emailDesc || ''}</div>
          ))}
      </div>
    );
  };

  const renderTimeLineFormComp = () => {
    return (
      <Form.Item label={getIn18Text('YINGXIAOFANGANXIANGQING')}>
        <Form.List name="fPlanInfos">
          {fields => (
            <Timeline className={style.timeline}>
              {fields.map(({ key, name }) => {
                const info = planInfos[key];
                if (!info) return;
                return (
                  <Timeline.Item dot={TimeLineIconMap[info?.lineType]} className={`${info?.lineType === 'interval' ? style.interval : style.normal}`}>
                    {renderTitleComp(info, name)}
                    <div>{info.lineType === 'normal' && renderContentComp(info, name)}</div>
                  </Timeline.Item>
                );
              })}
              {
                <Timeline.Item className={style.timelineAdd} dot={<span onClick={addPlan}>{TimeLineIconMap['add']}</span>}>
                  <span onClick={addPlan}>{getIn18Text('TIANJIAYINGXIAOYOUJIAN')}</span>
                </Timeline.Item>
              }
            </Timeline>
          )}
        </Form.List>
      </Form.Item>
    );
  };

  useEffect(() => {
    visible && getEmailTemplates();
  }, [visible]);

  // 初始化的数据，由外界传入
  useEffect(() => {
    handleHostingPlan();
  }, [hostingPlan]);

  // 初始化数据
  useEffect(() => {
    form.setFieldsValue({ fPlanInfos: planInfos });
  }, [planInfos]);

  return (
    <SiriusDrawer
      style={{ transform: 'translateX(0px)' }}
      className={style.customPlanDrawer}
      visible={visible}
      title={getIn18Text('ZIDINGYIYINGXIAOFANGAN')}
      destroyOnClose={false}
      closable={true}
      width={504}
      footer={renderFooter()}
      maskStyle={{ background: '#ffffff00' }}
      onClose={() => {
        closeDrawer();
      }}
    >
      <>
        <Form {...layout} form={form} layout="vertical">
          <Form.Item name="planName" label={getIn18Text('YINGXIAOFANGANMINGCHENG')} rules={rules.planName}>
            <Input
              placeholder={getIn18Text('QINGSHURUNEIRONG')}
              onChange={onNameChange}
              onBlur={e => {
                form.setFieldsValue({ planName: e.target.value.trim() });
              }}
            />
          </Form.Item>
          {renderTimeLineFormComp()}
        </Form>
      </>
    </SiriusDrawer>
  );
});
