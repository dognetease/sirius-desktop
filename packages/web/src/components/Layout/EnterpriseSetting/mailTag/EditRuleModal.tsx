import React, { useEffect, useMemo, useState } from 'react';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { Form, Input } from 'antd';
import { ConditionSelector } from './conditionSelector';
import { LabelColorSelector } from '../../Customer/components/labelColorSelector/selector';
import { api, apis, CustomerApi, EdmMailRule, EdmMailRuleCondition, EdmMailTag, MailClassifyRuleConditionNormal } from 'api';
import style from './index.module.scss';
import { getIn18Text } from 'api';
const customerApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
interface EditRuleModalProps {
  visible: boolean;
  item?: EdmMailRule;
  onClose?: () => void;
  onOk?: () => void;
}
export const EditRuleModal = (props: EditRuleModalProps) => {
  const { visible, item } = props;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [conditionData, setConditionData] = useState<EdmMailRuleCondition[]>([]);
  useEffect(() => {
    const label = item?.labels ? item.labels[0] : null;
    form.setFieldsValue({
      name: label ? label.name : undefined,
      color: label ? colorIdToString[label.color] : undefined,
    });
    setConditionData(item?.condictions || []);
  }, [item]);
  const handleOk = () => {
    form.validateFields().then(async values => {
      setLoading(true);
      const conditions = values.condictions.map((item: MailClassifyRuleConditionNormal) => {
        if (item.operand instanceof Array) {
          return {
            ...item,
            flagOperatorOr: values.operator === 'or',
            operand: item.operand.map(itm => {
              return itm.trim();
            }),
          };
        }
        return { ...item };
      });
      const tag: Partial<EdmMailTag> = {
        name: values.name,
        color: colorMap[values.color] || '10',
      };
      let params: Partial<EdmMailRule> = {
        condictions: conditions,
        actions: [
          {
            type: 'tags',
            value: [values.name],
          },
        ],
        continue: true,
        disabled: false,
        history_flag: true,
        name: getIn18Text('WAIMAOGUIZE') + moment().format('YYYY-MM-DD HH:mm:dd'),
      };
      if (item) {
        // 编辑
        if (item.labels?.length) {
          tag.label_id = item.labels[0].label_id;
        }
        params = {
          ...item,
          condictions: conditions,
          actions: [
            {
              type: 'tags',
              value: [values.name],
            },
          ],
        };
      }
      try {
        if (item) {
          await customerApi.updateMailTag(tag as EdmMailTag);
          await customerApi.updateRule(params as EdmMailRule);
        } else {
          await customerApi.addMailTag(tag as any);
          await customerApi.addRule(params);
        }
        props.onOk && props.onOk();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });
  };
  const title = useMemo(() => {
    if (!!item) {
      return getIn18Text('BIANJIYOUJIANBIAOQIAN');
    }
    return getIn18Text('XINJIANYOUJIANBIAOQIAN');
  }, [!!item]);
  return (
    <SiriusModal visible={visible} width={920} title={title} onCancel={props.onClose} onOk={handleOk} confirmLoading={loading} className={style.editRuleModal}>
      <Form form={form}>
        <Form.Item label={getIn18Text('BIAOQIANMINGCHENG')} name="name" rules={[{ required: true }]}>
          <Input type="text" placeholder={getIn18Text('QINGSHURUBIAOQIANMINGCHENG')} maxLength={20} />
        </Form.Item>
        <Form.Item label={getIn18Text('BIAOQIANYANSE')} name="color" rules={[{ required: true }]}>
          <LabelColorSelector className={style.colorSelector} />
        </Form.Item>
        <ConditionSelector form={form} rules={conditionData} operator={conditionData?.some(item => item?.flagOperatorOr) ? 'or' : 'and'} />
      </Form>
    </SiriusModal>
  );
};
const colorMap: Record<string, string> = {
  '#6BA9FF': '8',
  '#70CCAB': '10',
  '#AA90F4': '12',
  '#F7A87C': '2',
  '#F77C7C': '0',
  '#A8AAAD': '13',
};
const colorIdToString: Record<string, string> = {
  0: '#F77C7C',
  1: '#70CCAB',
  2: '#F7A87C',
  3: '#6BA9FF',
  4: '#F77C7C',
  5: '#F77C7C',
  7: '#F7A87C',
  8: '#6BA9FF',
  9: '#AA90F4',
  10: '#70CCAB',
  11: '#F7A87C',
  12: '#AA90F4',
  13: '#A8AAAD',
  14: '#A8AAAD',
  15: '#70CCAB',
  16: '#F7A87C',
  17: '#F77C7C',
  18: '#A8AAAD',
  19: '#A8AAAD',
};
