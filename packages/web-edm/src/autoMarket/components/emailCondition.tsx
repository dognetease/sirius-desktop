import React, { useEffect, useMemo, useState } from 'react';
import { AutoMarketTaskTriggerCondition, AutoMarketTaskDetail, AutoMarketTaskType, AutoMarketTaskObjectContent } from 'api';
import { Button, InputNumber, Form } from 'antd';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { getTransText } from '@/components/util/translate';
import { EmailOpTypeSelect } from './emailOpTypeSelect';
import { ViewEdmContent } from '../../components/viewContent/viewContent';
import style from './emailCondition.module.scss';
import { getIn18Text } from 'api';

interface EmailConditionProps {
  taskDetail: AutoMarketTaskDetail;
  visible: boolean;
  values: AutoMarketTaskTriggerCondition.EMAIL;
  resetValues: AutoMarketTaskTriggerCondition.EMAIL;
  onSave: (values: AutoMarketTaskTriggerCondition.EMAIL) => void;
  onClose: () => void;
}

const EmailCondition: React.FC<EmailConditionProps> = props => {
  const { visible, values, resetValues, onSave, onClose, taskDetail } = props;
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue({ ...values });
  }, [values]);
  const handleReset = () => {
    form.setFieldsValue({ ...resetValues });
  };
  const handleSave = () => {
    form.validateFields().then(values => {
      onSave(values);
    });
  };

  const edmCardInfo = useMemo(() => {
    if (taskDetail?.taskType === AutoMarketTaskType.FIXED_CONTACT) {
      const objectContent = taskDetail?.taskObjectInfo?.objectContent as AutoMarketTaskObjectContent.Edm;
      if (objectContent?.edmEmailId) {
        return {
          edmTaskName: objectContent.edmTaskName,
          edmSendTime: objectContent.edmSendTime,
          edmEmailId: objectContent.edmEmailId,
        };
      }
    }
    return null;
  }, [taskDetail]);

  return (
    <Drawer
      className={style.emailCondition}
      title={getIn18Text('XUANZEPANDUANTIAOJIAN')}
      contentWrapperStyle={{ width: 468 }}
      visible={visible}
      onClose={() => {
        form.setFieldsValue({ ...values });
        onClose();
      }}
      footer={
        <div className={style.emailConditionFooter}>
          <Button onClick={handleReset}>{getIn18Text('ZHONGZHI')}</Button>
          <Button type="primary" onClick={handleSave}>
            {getIn18Text('BAOCUN')}
          </Button>
        </div>
      }
    >
      <div className={style.emailConditionBody}>
        {edmCardInfo ? (
          <div className={style.edmEmail}>
            <div className={style.taskInfo}>
              <div className={style.taskName}>{edmCardInfo.edmTaskName}</div>
              <div>
                {getTransText('FASONGSHIJIAN\uFF1A')}
                {edmCardInfo.edmSendTime}
              </div>
            </div>
            <div className={style.taskOp}>
              <span className={style.linkBtn} onClick={() => setShowPreviewModal(true)}>
                {getIn18Text('CHAKAN')}
              </span>
            </div>
          </div>
        ) : (
          ''
        )}
        <Form className={style.form} form={form} layout="vertical">
          {/* <div className={style.subTitle}>{getIn18Text("CONGGAIRENWUQIDONGSHI\uFF0CKAISHI")}</div> */}
          <Form.Item label={getIn18Text('ANYOUJIANXINGWEI')}>
            <div className={style.emailOperation}>
              <Form.Item noStyle shouldUpdate={() => true}>
                {() => {
                  const opType = form.getFieldValue(['emailOpType']);
                  return (
                    <>
                      {[0, 1].includes(opType) ? null : (
                        <>
                          <Form.Item name="emailOpDays" rules={[{ required: true, message: getIn18Text('QINGSHURUTIANSHU') }]}>
                            <InputNumber precision={0} className={style.emailOpDays} placeholder={getIn18Text('QINGSHURUTIANSHU')} min={1} />
                          </Form.Item>
                          <span className={style.spaceText}>{getIn18Text('TIANHOU')}</span>
                        </>
                      )}

                      <Form.Item name="emailOpType" rules={[{ required: true, message: getIn18Text('QINGXUANZEDONGZUO') }]}>
                        <EmailOpTypeSelect
                          style={{ width: 130 }}
                          onChange={opType => {
                            if (['0', '1'].includes(String(opType))) {
                              form.setFields([{ name: 'emailOpDays', value: '' }]);
                            }
                          }}
                        ></EmailOpTypeSelect>
                      </Form.Item>
                    </>
                  );
                }}
              </Form.Item>
              <span className={style.spaceText}>{getIn18Text('YINGXIAOYOUJIAN')}</span>
            </div>
          </Form.Item>
        </Form>

        <ViewEdmContent visible={showPreviewModal} onCancel={() => setShowPreviewModal(false)} destroyOnClose id={edmCardInfo?.edmEmailId as string} />
      </div>
    </Drawer>
  );
};
export default EmailCondition;
