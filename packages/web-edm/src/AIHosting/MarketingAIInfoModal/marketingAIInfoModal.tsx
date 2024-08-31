import React, { useState, useEffect } from 'react';
import style from './marketingAIInfoModal.module.scss';
import { Modal, FormInstance, Form } from 'antd';
import { ReactComponent as CloseIcon } from '@/images/icons/edm/yingxiao/close-icon-20px.svg';
import { api, apis, EdmSendBoxApi, getIn18Text, HostingContentReq, HostingPlanModel, MailSelectType } from 'api';
import lodashGet from 'lodash/get';
import { BasicInput, IndustryItem } from '../AiHostingEdit/index';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import { EnhanceSelect, InSingleOption, InMultiOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { Radio } from '@web-common/components/UI/Radio';
import Radio from '@lingxi-common-component/sirius-ui/Radio';
import cloneDeep from 'lodash/cloneDeep';

const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

// 输入与限制数量组件
const AiHostingInputCount: React.FC<{ total: number; current: number }> = props => {
  const { total, current } = props;
  return (
    <span className={style.baseInfoInputCount}>
      {current}/{total}
    </span>
  );
};

interface MarketingAIInfoModalProps {
  initialValues?: BasicInput;
  plan?: HostingPlanModel;

  showMarketingAIInfoModal?: boolean;
  setShowMarketingAIInfoModal?: (value: boolean) => void;

  clickCreatedEmail?: (input: BasicInput, type: 'all' | 'part') => void;
  clickCancel?: () => void;
}

interface LanguageItem {
  label: string;
  languageEng: string;
  value: string;
}

export const MarketingAIInfoModal: React.FC<MarketingAIInfoModalProps> = props => {
  const { initialValues, plan, showMarketingAIInfoModal, setShowMarketingAIInfoModal, clickCancel, clickCreatedEmail } = props;

  const [form] = Form.useForm<BasicInput>();

  // 行业列表
  const [industryList, setIndustryList] = useState<IndustryItem[]>([]);
  // 其他行业名称
  const [companyIndustry, setCompanyIndustry] = useState<string>('');
  // 公司名称
  const [companyName, setCompanyName] = useState<string>('');
  // 是否选择所属行业中的其他
  const [showIndustry, setShowIndustry] = useState<boolean>(false);

  // 语言列表
  const [languageList, setLanguageList] = useState<LanguageItem[]>([]);

  // emailType:0选中全部邮件 emailType:1选中部分邮件
  const [emailType, setEmailType] = useState<number>(0);
  // 部门邮件选择项
  const [roundInfo, setRoundInfo] = useState<MailSelectType[]>([]);

  // 初始获取行业列表
  useEffect(() => {
    getIndustryList();
    getLanguageList();
  }, []);

  useEffect(() => {
    let roundInfo: MailSelectType[] = [];

    plan?.mailInfos.forEach((i, index) => {
      let t: MailSelectType = {
        round: index + 1,
        mailType: 0,
        name: i.emailName,
      };
      roundInfo.push(t);
      if ((i.expandMailInfos?.length || 0) > 0) {
        let t1: MailSelectType = {
          round: index + 1,
          mailType: 1,
          name: i.expandMailInfos![0].emailName || '',
        };
        roundInfo.push(t1);
      }
    });
    setRoundInfo(roundInfo);
  }, [plan]);

  // 获取行业列表
  const getIndustryList = async () => {
    const result = await edmApi.getAiIndustryList();
    const industries = lodashGet(result, 'industries', []).map(item => ({
      value: item.name,
      label: item.name,
    }));
    // 增加其他项
    industries.push({
      value: 'other',
      label: getIn18Text('QITA'),
    });
    setIndustryList(industries);
  };

  // 获取语言列表
  const getLanguageList = async () => {
    const { languages } = await edmApi.getGptConfig();
    setLanguageList(languages);
  };

  useEffect(() => {
    // 如果有数据回填判断是否在列表中，不在则是之前选择其他后填入的行业
    const industry = initialValues?.req?.industry;
    if (industry) {
      const otherIndustry = !industryList.some(item => item.value === industry);
      const beforeReq = form.getFieldValue('req');
      const latestReq = { ...beforeReq };
      const specialIndustry = industry === 'other';
      if (otherIndustry) {
        latestReq.industry = 'other';
        latestReq.industry2 = industry;
      } else {
        latestReq.industry = industry;
        latestReq.industry2 = specialIndustry ? industry : undefined;
      }
      form.setFieldsValue({ req: latestReq });
      setShowIndustry(specialIndustry ? true : !!otherIndustry);
    }
    if (form.getFieldValue(['req', 'industry']) === 'other') {
      setShowIndustry(true);
    }
  }, [initialValues, industryList]);

  const formInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, type: string) => {
    switch (type) {
      case 'companyIndustry':
        setCompanyIndustry(e.target.value);
        break;
      case 'companyName':
        setCompanyName(e.target.value);
        break;
      default:
    }
  };

  const handleIndustryChange = (value: string) => {
    setShowIndustry(value === 'other');
  };

  function close() {
    setShowMarketingAIInfoModal && setShowMarketingAIInfoModal(false);
  }

  function cancel() {
    clickCancel && clickCancel();
    close();
  }

  const clickCreateEmail = async () => {
    try {
      // 表单验证通过，可以在这里执行提交操作
      await form.validateFields().then(item => {
        const emails = item.req?.selectEmails || [];
        let selects = emails.map(i => {
          let index = parseInt(i);
          let select: MailSelectType = roundInfo[index];
          return select;
        });
        // 行业接口只用一个字段表示，如果选的是其他则值为输入的其他行业名称
        let industry = undefined;
        if (item?.req?.industry) {
          const industry1 = lodashGet(item, 'req.industry', '');
          const industry2 = lodashGet(item, 'req.industry2', '');
          industry = industry1 === 'other' ? industry2 : industry1;
        }
        let temp: BasicInput = {
          req: {
            first: true,
            industry,
            language: item.req?.language,
            company: item.req?.company,
            companyIntro: item.req?.companyIntro,
            productIntros: item.req?.productIntros,
            planInfos: [{ mailSelects: selects }],
          },
        };
        if (emailType !== 1 && temp.req) {
          temp.req.planInfos = undefined;
        }
        clickCreatedEmail && clickCreatedEmail(temp, emailType === 0 ? 'all' : 'part');
      });

      close();
    } catch (error) {
      // 表单验证不通过，可以在这里显示错误信息
      console.error(error);
    }
  };

  function footerComp() {
    return (
      <div className={style.footer}>
        <Button className={style.sure} size="default" btnType={'primary'} onClick={clickCreateEmail}>
          生成邮件
        </Button>
        <Button className="cancel" size="default" btnType={'minorLine'} onClick={cancel}>
          取消
        </Button>
      </div>
    );
  }

  function changeSelect(value: string[]) {
    if (value.length) {
      setEmailType(1);
    }
  }

  function changeRadio(e) {
    const newEmailType = e.target.value;
    setEmailType(newEmailType);
    if (newEmailType === 0) {
      const data = form.getFieldsValue();
      data.req = {
        first: true,
        industry: data.req?.industry,
        language: data.req?.language,
        company: data.req?.company,
        companyIntro: data.req?.companyIntro,
        productIntros: data.req?.productIntros,
        planInfos: [{ mailSelects: [] }],
        selectEmails: [],
      };
      form.setFieldsValue(data);
    }
  }
  return (
    <>
      <Modal
        title=""
        width={480}
        visible={showMarketingAIInfoModal}
        onCancel={() => {
          setShowMarketingAIInfoModal && setShowMarketingAIInfoModal(false);
        }}
        closeIcon={null}
        className={style.customModal}
        footer={footerComp()}
        maskClosable={false}
        getContainer={() => document.body}
      >
        <div className={style.wrap}>
          <div className={style.close} onClick={close}>
            <CloseIcon />
          </div>
          <div className={style.header}>
            <span className={style.headerTitle}>AI写信</span>
          </div>
          <div className={style.content}>
            <div className={style.contentInset}>
              <span className={style.contentTips}>请填写邮件内包含的基础信息，内容填写越详细，邮件质量越好</span>
              <Form form={form} colon={false} name="aiHostingForm" layout="vertical" initialValues={initialValues}>
                <Form.Item
                  label={getIn18Text('SUOSHUXINGYE')}
                  name={['req', 'industry']}
                  rules={[{ required: true, message: getIn18Text('QINGXUANZESUOSHUXINGYE1010') }]}
                >
                  <EnhanceSelect
                    showSearch
                    filterOption={(input, option) => ((option?.label ?? '') as string).includes(input)}
                    placeholder={getIn18Text('QINGXUANZESUOSHUXINGYE')}
                    options={industryList}
                    onChange={handleIndustryChange}
                  >
                    {industryList.map(i => (
                      <InSingleOption value={i.value}>{i.label}</InSingleOption>
                    ))}
                  </EnhanceSelect>
                </Form.Item>
                {showIndustry ? (
                  <Form.Item name={['req', 'industry2']} rules={[{ required: true, message: getIn18Text('QINGSHURUQITAXINGYE') }]}>
                    <Input
                      maxLength={10}
                      placeholder={getIn18Text('QINGSHURUQITAXINGYE')}
                      onChange={e => formInputChange(e, 'companyIndustry')}
                      suffix={<AiHostingInputCount total={10} current={companyIndustry.length} />}
                    />
                  </Form.Item>
                ) : (
                  <></>
                )}
                <Form.Item label={getIn18Text('GONGSIMINGCHENG')} name={['req', 'company']} rules={[{ required: true, message: getIn18Text('QINGSHURUGONGSIMC') }]}>
                  <Input
                    maxLength={200}
                    placeholder={getIn18Text('QINGSHURUNINDEGONGSI')}
                    onChange={e => formInputChange(e, 'companyName')}
                    suffix={<AiHostingInputCount total={200} current={companyName.length} />}
                  />
                </Form.Item>
                <Form.Item label={getIn18Text('YOUJIANSHIYONGYUYAN')} name={['req', 'language']}>
                  <EnhanceSelect placeholder={getIn18Text('QINGXUANZE')}>
                    {languageList.map(i => (
                      <InSingleOption value={i.value}>{i.label}</InSingleOption>
                    ))}
                  </EnhanceSelect>
                </Form.Item>
                <Form.Item
                  label={getIn18Text('GONGSIJIESHAO')}
                  name={['req', 'companyIntro']}
                  // rules={[{ pattern: new RegExp(/^[\u4e00-\u9fa5a-zA-Z0-9]+$/), message: '请输入中英文数字' }]}
                >
                  <Input.TextArea showCount maxLength={500} autoSize={{ minRows: 3, maxRows: 6 }} placeholder={getIn18Text('QINGJIANDANJIESHAONINDE')} />
                </Form.Item>
                <Form.Item
                  label={getIn18Text('SHANGPINJIESHAO1')}
                  name={['req', 'productIntros', 0]}
                  // rules={[{ pattern: new RegExp(/^[\u4e00-\u9fa5a-zA-Z0-9]+$/), message: '请输入中英文数字' }]}
                >
                  <Input.TextArea showCount maxLength={500} autoSize={{ minRows: 3, maxRows: 6 }} placeholder={getIn18Text('QINGMIAOSHUNINDEZHUYING')} />
                </Form.Item>
                <Form.Item
                  label={getIn18Text('SHANGPINJIESHAO2')}
                  name={['req', 'productIntros', 1]}
                  // rules={[{ pattern: new RegExp(/^[\u4e00-\u9fa5a-zA-Z0-9]+$/), message: '请输入中英文数字' }]}
                >
                  <Input.TextArea
                    showCount
                    maxLength={500}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder="可以介绍另一款商品，用于二轮及以后邮件内容，与商品介绍1交替介绍不商品吸引客户回信"
                  />
                </Form.Item>
                <div className={style.targetEmail}>
                  <span className={style.targetEmailTitle}>需要AI写信的邮件</span>
                  <div className={style.targetEmailContent}>
                    <Radio.Group className={style.radio} size="large" onChange={changeRadio} value={emailType}>
                      <Radio value={0}>全部邮件</Radio>
                      <Radio value={1}>部分邮件</Radio>
                    </Radio.Group>
                    <Form.Item
                      name={['req', 'selectEmails']}
                      style={{ flexGrow: 1, height: 32, marginBottom: '0px' }}
                      rules={[{ required: emailType === 1 ? true : false, message: '请选择邮件' }]}
                    >
                      <EnhanceSelect maxTagCount={'responsive'} mode="multiple" placeholder={'请选择邮件'} onChange={changeSelect} style={{ flexGrow: 1, height: 32 }}>
                        {roundInfo.map((i, index) => {
                          return <InMultiOption value={index}>{`第${i.round}轮-${i.name}`}</InMultiOption>;
                        })}
                      </EnhanceSelect>
                    </Form.Item>
                  </div>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
