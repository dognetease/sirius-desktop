import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { Button, Form, Radio, Tooltip } from 'antd';
import moment from 'moment';
import {
  apiHolder,
  apis,
  WhatsAppApi,
  WhatsAppTemplate,
  WhatsAppTemplateV2,
  WhatsAppTemplateParams,
  WhatsAppTemplateParamV2,
  WhatsAppFileExtractResult,
  WhatsAppFileExtractStatus,
  WhatsAppVariable,
  WhatsAppVariableType,
  WhatsAppJobSendType,
  WhatsAppJobSubmitType,
  RequestEditWhatsAppJob,
  RequestEditWhatsAppJobV2,
  WhatsAppJobDetail,
  WhatsAppJobDetailV2,
  WhatsAppFileExtractIndex,
} from 'api';
import { navigate } from '@reach/router';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import Alert from '@web-common/components/UI/Alert/Alert';
import ArrowLeft from '@web-common/components/UI/Icons/svgs/disk/ArrowLeft';
import Receiver, { FilterStatus, ReceiverTab } from './components/receiver/receiver';
import TemplatePicker from '../components/template/templatePicker';
import TemplateParams from '../components/template/templateParams';
import { CronSendModal } from '@web-edm/send/cronSend';
import { timeZoneMap } from '@web-common/utils/constant';
import { orderTemplateParams, getTemplateParams } from '@/components/Layout/SNS/WhatsAppV2/utils';
import { ReactComponent as InfoIconGray } from '@/images/icons/whatsApp/info-circle-gray.svg';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import { getTransText } from '@/components/util/translate';
import style from './jobEdit.module.scss';
import { getIn18Text } from 'api';
import { PhoneSelect } from '../components/phoneSelect/phoneSelect';
import { BusinessPermissionCheck } from '@/components/Layout/SNS/components/BusinessPermissionCheck';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import { EnhanceSelect as Select } from '@web-common/components/UI/Select';
import { EnhanceSelect as Select } from '@lingxi-common-component/sirius-ui/Select';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;
interface JobEditProps {
  qs: Record<string, string>;
}
const JobEdit: React.FC<JobEditProps> = props => {
  const { qs } = props;
  const [extraction, setExtraction] = useState<WhatsAppFileExtractResult | null>(null);
  const [form] = Form.useForm();
  const [template, setTemplate] = useState<WhatsAppTemplateV2 | null>(null);
  const [templatePickerVisible, setTemplatePickerVisible] = useState<boolean>(false);
  const [hasApprovedTemplates, setHasApprovedTemplates] = useState<boolean>(false);
  const [drafting, setDrafting] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [jobDetail, setJobDetail] = useState<WhatsAppJobDetailV2 | null>(null);
  const [cronSendModalVisible, setCronSendModalVisible] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(FilterStatus.Init);

  useEffect(() => {
    if (qs.jobId) {
      whatsAppApi.getJobDetailV2({ jobId: qs.jobId as string }).then(nextJobDetail => {
        nextJobDetail = orderTemplateParams(nextJobDetail);
        setJobDetail(nextJobDetail);
        setExtraction(nextJobDetail.receivers);
        form.setFieldsValue(nextJobDetail);
        if (nextJobDetail.templateId) {
          whatsAppApi
            .getTemplateDetailV2({
              id: nextJobDetail.templateId,
            })
            .then(nextTemplate => {
              setTemplate(nextTemplate);
            });
        }
      });
    }
    if (qs.defaultTemplateId) {
      whatsAppApi
        .getTemplateDetailV2({
          id: qs.defaultTemplateId,
        })
        .then(nextTemplate => {
          form.setFieldsValue({ templateId: qs.defaultTemplateId });
          setTemplate(nextTemplate);
        });
    }
  }, [qs]);
  useEffect(() => {
    if (template) {
      let templateParams;
      if (jobDetail && jobDetail.templateId === template.id) {
        templateParams = jobDetail.templateParams || getTemplateParams(template);
      } else {
        templateParams = getTemplateParams(template);
      }
      form.setFieldsValue({ templateParams });
    }
  }, [template, jobDetail]);
  const handleExtractResultAlert = (data: WhatsAppFileExtractResult) => {
    const totalCount = data.body.length;
    let successCount = 0;
    let repeatCount = 0;
    let invalidCount = 0;
    for (let i = 0; i < data.body.length; i++) {
      const row = data.body[i];
      switch (row.status) {
        case WhatsAppFileExtractStatus.SUCCESS:
          successCount++;
          break;
        case WhatsAppFileExtractStatus.REPEAT:
          repeatCount++;
          break;
        case WhatsAppFileExtractStatus.INVALID:
          invalidCount++;
          break;
      }
    }
    if (totalCount === successCount) return;
    Toast.success({ content: `已成功添加${totalCount - repeatCount}个WhatsApp号码（重复号码已过滤）` });
  };
  // const handleExtractFailedExport = () => alert(getIn18Text("TODO: DAOCHUSHIBAILIEBIAO"));
  const handleReceiverClear = () => {
    if (!extraction) return;
    const nextExtraction = null;
    setExtraction(nextExtraction);
    form.setFieldsValue({ receivers: nextExtraction });
  };
  const handleReceiverRemoveItem = (whatsApp: string) => {
    if (!extraction) return;
    let nextExtraction: WhatsAppFileExtractResult | null = {
      ...extraction,
      body: extraction.body.filter(item => item.content[WhatsAppFileExtractIndex.WHATSAPP] !== whatsApp),
    };
    if (!nextExtraction.body.length) {
      nextExtraction = null;
    }
    setExtraction(nextExtraction);
    form.setFieldsValue({ receivers: nextExtraction });
  };
  const handleReceiverFilterItem = (filterWhatsApp: string[]) => {
    if (!extraction) return;
    const map: Record<string, boolean> = {};
    filterWhatsApp.forEach(whatsapp => {
      map[whatsapp] = true;
    });
    let nextExtraction: WhatsAppFileExtractResult | null = {
      ...extraction,
      body: extraction.body.filter(item => {
        const whatsapp = item.content[WhatsAppFileExtractIndex.WHATSAPP];
        return !map[whatsapp];
      }),
    };
    if (!nextExtraction.body.length) {
      nextExtraction = null;
    }
    setExtraction(nextExtraction);
    form.setFieldsValue({ receivers: nextExtraction });
    if (filterWhatsApp.length === 0) {
      Modal.success({
        width: 400,
        centered: true,
        title: getIn18Text('GUOLVCHENGGONG'),
        content: `已过滤${filterWhatsApp.length}个无效地址`,
        hideCancel: true,
        okText: getIn18Text('ZHIDAOLE'),
        okCancel: true,
        cancelButtonProps: {
          style: { display: 'none' },
        },
      });
    }
  };
  const handleReceiverExtracted = (extractType: ReceiverTab, extractResult: WhatsAppFileExtractResult) => {
    let nextExtraction = null;

    if (!extraction) {
      nextExtraction = {
        ...extractResult,
        body: extractResult.body.filter(row => row.status !== WhatsAppFileExtractStatus.REPEAT),
      };
    } else if (extractType === 'file') {
      nextExtraction = {
        ...extractResult,
        body: extractResult.body.filter(row => row.status !== WhatsAppFileExtractStatus.REPEAT),
      };
    } else if ((['text', 'crm'] as ReceiverTab[]).includes(extractType)) {
      const extractionWhatsAppMap = extraction.body.reduce<Record<string, 1>>((accumulator, item) => {
        const whatsApp = item.content[WhatsAppFileExtractIndex.WHATSAPP];

        return { ...accumulator, [whatsApp]: 1 };
      }, {});

      extractResult.body.map(item => {
        if (item.status === WhatsAppFileExtractStatus.SUCCESS) {
          const whatsApp = item.content[WhatsAppFileExtractIndex.WHATSAPP];

          if (extractionWhatsAppMap[whatsApp]) {
            item.status = WhatsAppFileExtractStatus.REPEAT;
          }
        }
      });

      nextExtraction = {
        ...extraction,
        body: [...extraction.body, ...extractResult.body.filter(row => row.status !== WhatsAppFileExtractStatus.REPEAT)],
      };
    }

    setExtraction(nextExtraction);
    form.setFieldsValue({ receivers: nextExtraction });
    handleExtractResultAlert(extractResult);
  };
  const handleTemplateChange = (nextTemplate: WhatsAppTemplateV2 | null) => {
    if (nextTemplate) {
      setTemplate(nextTemplate);
      form.setFieldsValue({ templateId: nextTemplate.id });
    } else {
      setTemplate(null);
      form.setFieldsValue({ templateId: undefined });
    }
  };
  const handleDraft = () => {
    const values = form.getFieldsValue();
    if (jobDetail && jobDetail.jobId) {
      setDrafting(true);
      return whatsAppApi
        .editJobV2({
          ...values,
          jobId: jobDetail.jobId,
          submit: WhatsAppJobSubmitType.DRAFT,
        })
        .then(() => {
          Toast.success({ content: getIn18Text('BAOCUNCHENGGONG') });
        })
        .finally(() => {
          setDrafting(false);
        });
    } else {
      setDrafting(true);
      return whatsAppApi
        .createJobV2({
          ...values,
          submit: WhatsAppJobSubmitType.DRAFT,
        })
        .then(data => {
          const { jobId } = data;
          setJobDetail({ ...values, jobId });
          Toast.success({ content: getIn18Text('BAOCUNCHENGGONG') });
        })
        .finally(() => {
          setDrafting(false);
        });
    }
  };
  const handleSubmit = (values: RequestEditWhatsAppJobV2) => {
    whatsAppTracker.trackJob('send');
    if (jobDetail && jobDetail.jobId) {
      setSubmitting(true);
      return whatsAppApi
        .editJobV2({
          ...values,
          jobId: jobDetail.jobId,
          submit: WhatsAppJobSubmitType.SUBMIT,
        })
        .then(() => {
          Toast.success({ content: getIn18Text('BAOCUNCHENGGONG') });
          navigate('#sns?page=whatsAppJob');
        })
        .finally(() => {
          setSubmitting(false);
        });
    } else {
      setSubmitting(true);
      return whatsAppApi
        .createJobV2({
          ...values,
          submit: WhatsAppJobSubmitType.SUBMIT,
        })
        .then(() => {
          Toast.success({ content: getIn18Text('BAOCUNCHENGGONG') });
          navigate('#sns?page=whatsAppJob');
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  };
  const handleSendClick = () => {
    if (filterStatus === FilterStatus.Init) {
      return Toast.error({ content: '请先完成过滤号码' });
    }
    return form.submit();
  };
  const receiversValidator = () => {
    if (!extraction || !extraction.body.length) {
      return Promise.reject(getIn18Text('QINGTIANJIACHUDAKEHU'));
    }
    if (extraction.body.some(row => row.status !== WhatsAppFileExtractStatus.SUCCESS)) {
      return Promise.reject(getIn18Text('QINGYICHUCUOWUDECHUDAKEHU'));
    }
    return Promise.resolve();
  };
  useEffect(() => {
    form.setFieldsValue({ receivers: extraction });
  }, [extraction]);
  const handleBack = () => {
    const backHash = decodeURIComponent(qs.fromHash || '#edm?page=whatsAppJob');
    const backHandler = () => navigate(backHash);
    Modal.confirm({
      title: getIn18Text('BAOCUNBINGFANHUI'),
      content: getIn18Text('SHIFOUBAOCUNCAOGAO\uFF1F'),
      okText: getIn18Text('BAOCUNBINGTUICHU'),
      cancelText: getIn18Text('BUBAOCUN'),
      keyboard: false,
      maskClosable: false,
      onOk: () => handleDraft().then(backHandler),
      onCancel: backHandler,
    });
  };
  const handleCronSendOk = (time: string, timeZone: string, sendTimeCountry: string) => {
    const [dateString, timeString] = time.split(' ');
    const date = moment(`${dateString}T${timeString}${timeZone}`);
    const sendTime = date.utcOffset(timeZone).valueOf();
    form.setFieldsValue({
      sendType: WhatsAppJobSendType.CRON_SEND,
      sendTime,
      sendTimeZone: timeZone,
      sendTimeCountry,
    });
    setCronSendModalVisible(false);
    return Promise.resolve(true);
  };
  const handleCronSendCancel = () => {
    if (!form.getFieldValue('sendTime') || !form.getFieldValue('sendTimeZone') || !form.getFieldValue('sendTimeCountry')) {
      form.setFieldsValue({
        sendType: WhatsAppJobSendType.SEND_NOW,
        sendTime: undefined,
        sendTimeZone: undefined,
        sendTimeCountry: undefined,
      });
    }
    setCronSendModalVisible(false);
  };
  return (
    <PermissionCheckPage
      resourceLabel="WHATSAPP"
      accessLabel="OP"
      menu="WHATSAPP_SEND_TASK"
      customContent={
        <div style={{ marginTop: 12 }}>
          <Button onClick={() => navigate('#sns?page=whatsAppJob')}>{getIn18Text('FANHUI')}</Button>
        </div>
      }
    >
      <div className={style.jobEdit}>
        <div className={style.header}>
          <div className={classnames(style.back, 'sirius-no-drag')} onClick={() => !drafting && handleBack()}>
            <ArrowLeft />
            <span className={style.backText}>{getIn18Text('BAOCUNBINGFANHUI')}</span>
          </div>
        </div>
        <div className={style.body}>
          <div className={style.content}>
            <div className={style.title}>{getIn18Text('WhatsApp QUNFARENWU')}</div>
            <Form className={style.form} form={form} layout="vertical" scrollToFirstError={{ behavior: 'smooth' }} onFinish={handleSubmit}>
              <Form.Item label={getIn18Text('RENWUMINGCHENG')} name="jobName" required rules={[{ required: true, message: getIn18Text('QINGSHURURENWUMINGCHENG') }]}>
                <Input placeholder={getIn18Text('QINGSHURURENWUMINGCHENG')} />
              </Form.Item>
              <Form.Item label={getIn18Text('DIANHUAHAOMA')} name="businessPhone" required rules={[{ required: true, message: getIn18Text('QINGXUANZEDIANHUAHAOMA') }]}>
                <PhoneSelect />
              </Form.Item>
              <Form.Item
                className={style.formItemReceiver}
                label={getTransText('BulkObject') || ''}
                name="receivers"
                required
                rules={[{ validator: receiversValidator }]}
                shouldUpdate
              >
                <Receiver
                  className={style.receiver}
                  extraction={extraction}
                  jobId={qs.jobId}
                  onClear={handleReceiverClear}
                  onRemoveItem={handleReceiverRemoveItem}
                  onExtracted={handleReceiverExtracted}
                  onFilter={handleReceiverFilterItem}
                  onFilterStatusChange={status => setFilterStatus(status)}
                />
              </Form.Item>
              <Form.Item
                label={getTransText('MessageTemplate') || ''}
                name="templateId"
                required
                rules={[{ required: true, message: getIn18Text('QINGXUANZEFASONGNEIRONG') }]}
              >
                <Select
                  placeholder={
                    hasApprovedTemplates
                      ? getIn18Text('QINGXUANZEFASONGNEIRONG')
                      : getIn18Text('ZANWUYITONGGUODEXIAOXIMOBAN\uFF0CQINGQIANWANGXIAOXIMOBANCHUCHUANGJIANBINGSHENQINGMOBAN')
                  }
                  open={false}
                  options={template ? [{ label: template.name, value: template.id }] : []}
                  allowClear
                  onClick={() => {
                    setTemplatePickerVisible(true);
                    whatsAppTracker.trackJob('choose_template');
                  }}
                  onClear={() => handleTemplateChange(null)}
                />
              </Form.Item>
              {template && extraction && (
                <Form.Item label={getIn18Text('MOBANBIANLIANGSHEZHI')} required>
                  <TemplateParams className={style.templateParams} form={form} template={template} extraction={extraction} />
                  <div className={classnames(style.warning, style.templateParamsWarning)}>
                    {getIn18Text('ZHU\uFF1AQINGZHENGQUESHEZHIBIANLIANGCANSHU\uFF0CRUOYUYUANSHIMOBANYONGTUBUFU\uFF0CJIANGHUIYOUFENGHAOFENGXIAN')}
                  </div>
                </Form.Item>
              )}
              <Form.Item
                className={style.sendType}
                label={
                  <span>
                    {getIn18Text('QUNFASHIJIAN：')}
                    <Tooltip
                      placement="top"
                      title={getIn18Text(
                        'WEITIGAOSONGDAXIAOLV\uFF0CJIANSHAOGUANFANGFENGHAOFENGXIAN\uFF0CXITONGHUIMONIZHENSHICHANGJING\uFF0CMEI5~20SDESHIJIANFANWEINEIZIDONGSUIJIZUOWEIQUNFAJIANGESHICHANG'
                      )}
                    >
                      <InfoIconGray style={{ marginBottom: -3, marginLeft: 2 }} />
                    </Tooltip>
                  </span>
                }
                name="sendType"
                required
                initialValue={WhatsAppJobSendType.SEND_NOW}
                rules={[{ required: true, message: getIn18Text('QINGXUANZEQUNFASHIJIAN') }]}
              >
                <Radio.Group>
                  <Radio value={WhatsAppJobSendType.SEND_NOW}>{getIn18Text('LIJIFASONG')}</Radio>
                  <Radio value={WhatsAppJobSendType.CRON_SEND} onClick={() => setCronSendModalVisible(true)}>
                    {getIn18Text('DINGSHIFASONG')}
                  </Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item noStyle shouldUpdate>
                {() => {
                  const sendType = form.getFieldValue('sendType');
                  const sendTime = form.getFieldValue('sendTime');
                  const sendTimeZone = form.getFieldValue('sendTimeZone');
                  const sendTimeCountry = form.getFieldValue('sendTimeCountry') || '';
                  return sendType === WhatsAppJobSendType.CRON_SEND ? (
                    <>
                      <Form.Item name="sendTime" noStyle />
                      <Form.Item name="sendTimeZone" noStyle />
                      <Form.Item name="sendTimeCountry" noStyle />
                      {sendTimeZone && sendType && sendTimeZone && (
                        <div className={classnames(style.tip, style.cronSendTip)} onClick={() => setCronSendModalVisible(true)}>
                          {`注：将于${sendTimeCountry}${timeZoneMap[sendTimeZone as keyof typeof timeZoneMap].split('：')[0]} 
                          ${moment(sendTime).utcOffset(sendTimeZone).format('YYYY-MM-DD HH:mm:ss')} 发送`}
                        </div>
                      )}
                    </>
                  ) : null;
                }}
              </Form.Item>
            </Form>
          </div>
        </div>
        <div className={style.footer}>
          <Button loading={drafting} onClick={handleDraft}>
            {getIn18Text('CUNCAOGAO')}
          </Button>
          <Button type="primary" loading={submitting} onClick={handleSendClick}>
            {getIn18Text('FASONG')}
          </Button>
        </div>
        <TemplatePicker
          visible={templatePickerVisible}
          onCancel={() => setTemplatePickerVisible(false)}
          onPick={nextTemplate => {
            handleTemplateChange(nextTemplate);
            setTemplatePickerVisible(false);
          }}
          onInitialized={templates => setHasApprovedTemplates(!!templates.length)}
        />
        <CronSendModal sendModeVisible={false} onSend={handleCronSendOk} visible={cronSendModalVisible} onCancel={handleCronSendCancel} />
      </div>
    </PermissionCheckPage>
  );
};
export default JobEdit;
