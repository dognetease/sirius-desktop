import React, { useEffect, useState } from 'react';
import { Form, Input } from 'antd';
import { api, apis, FieldItem, FieldOptionItem, FieldSettingApi } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as AddIcon } from '@/images/icons/edm/add.svg';
import { ReactComponent as RemoveIcon } from '@/images/icons/edm/delete.svg';
import style from './fieldSetting.module.scss';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { AlertErrorIcon } from '@web-common/components/UI/Icons/icons';
import classnames from 'classnames';
import { getIn18Text } from 'api';
const fieldSettingApi = api.requireLogicalApi(apis.fieldSettingApiImpl) as FieldSettingApi;
const FormItem = Form.Item;
export interface EditFieldModalProps {
  visible: boolean;
  item?: FieldItem;
  onClose?: () => void;
  onOk?: () => void;
}
export const EditFieldModal: React.FC<EditFieldModalProps> = props => {
  const [form] = Form.useForm<FieldItem>();
  const [options, setOptions] = useState<Partial<FieldOptionItem>[]>([]);
  const [emptyOptions, setEmptyOptions] = useState<FieldOptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { visible, item } = props;
  const rules = {
    optionTitle: [{ required: true, message: getIn18Text('QINGSHURUXUANXIANGMINGCHENG') }],
  };
  useEffect(() => {
    if (item?.dic_items) {
      const notEmpty = item.dic_items.filter(i => i.label !== '');
      const empty = item.dic_items.filter(i => i.label === '');
      setOptions(item.dic_items);
      setEmptyOptions(empty);
      form.setFieldsValue({ dic_items: notEmpty });
    }
  }, [item?.dic_items]);
  const handleOk = () => {
    form.validateFields().then(() => {
      const fields = form.getFieldValue('dic_items');
      const duplicateName = hasDuplicate(fields);
      if (duplicateName) {
        Toast.warn({ content: `选项"${duplicateName}"重复，请修改` });
        return;
      }
      if (fields.length === 0) {
        Toast.warn({ content: `列表内容至少有一个选项` });
      }
      const arr = emptyOptions.concat(fields);
      const data = arr.map((item: Partial<FieldOptionItem>, index: number) => {
        let obj: {
          item_id?: string;
          item_label: string;
          item_weight: number;
        } = {
          item_label: item.label as string,
          item_weight: index,
        };
        if (item.id) {
          obj.item_id = item.id;
        }
        return obj;
      });
      setLoading(true);
      fieldSettingApi
        .updateFieldOptions({
          dic_id: item!.dic_id,
          item_list: data,
        })
        .then(() => {
          // close
          Toast.success({ content: `保存成功` });
          props.onOk && props.onOk();
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };
  const removeOption = (index: number) => {
    const arr = form.getFieldValue('dic_items');
    const optionItem = arr && arr[index];
    if (!optionItem || !optionItem.dic_id) {
      return Promise.resolve(true);
    }
    return new Promise((resolve, reject) => {
      fieldSettingApi
        .checkCanDelete({
          fieldId: item!.id,
          dicItemId: optionItem.id,
        })
        .then(canDelete => {
          if (canDelete) {
            return resolve(true);
          }
          SiriusModal.warning({
            title: getIn18Text('TISHI?'),
            className: 'no-content-confirm',
            icon: <AlertErrorIcon />,
            content: <span>{getIn18Text('GAIXUANXIANGZHICUNZAILISHISHUJU\uFF0CBUKESHANCHU\uFF0CQINGCHULIWANXIANGGUANLISHISHUJUKEYISHANCHU!')}</span>,
            okType: 'danger',
            onOk: () => {
              // 检查
              reject('');
            },
          });
        });
    });
  };
  if (item === undefined) {
    return null;
  }
  return (
    <SiriusModal className={style.editFieldModal} visible={visible} title={getIn18Text('BIANJI')} onCancel={props.onClose} onOk={handleOk} confirmLoading={loading}>
      <Form form={form}>
        <FormItem label={getIn18Text('ZIDUANLEIXING')}>{getIn18Text('DANXUAN')}</FormItem>
        <FormItem label={getIn18Text('ZIDUANMINGCHENG')}>{item.field_label}</FormItem>
        <FormItem label={getIn18Text('TISHIYU')} labelAlign="right">
          {item.prompt}
        </FormItem>
        <Form.List name="dic_items" initialValue={options}>
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map((item, index) => {
                return (
                  <Form.Item
                    label={index === 0 ? getIn18Text('LIEBIAONEIRONG') : ''}
                    required
                    key={item.key}
                    className={classnames(style.marginBottom8, index > 0 ? style.formItemWithoutLabel : '')}
                  >
                    <Form.Item noStyle name={[item.name, 'label']} fieldKey={[item.name, 'label']} rules={rules.optionTitle}>
                      <Input style={{ width: 360 }} placeholder={getIn18Text('QINGSHURU')} maxLength={20} />
                    </Form.Item>
                    <span className={style.dynamicCtrlIcon}>
                      <RemoveIcon onClick={() => removeOption(index).then(() => remove(index))} />
                    </span>
                  </Form.Item>
                );
              })}
              <div className={style.formItemWithoutLabel}>
                <AddIcon onClick={() => add()} />
                <div style={{ position: 'relative', top: -48 }}>
                  <Form.ErrorList errors={errors} />
                </div>
              </div>
            </>
          )}
        </Form.List>
      </Form>
    </SiriusModal>
  );
};
function hasDuplicate(
  arr: Array<{
    label: string;
  }>
) {
  const map: Record<string, number> = {};
  for (let i = 0, len = arr.length; i < len; i++) {
    const k = arr[i].label;
    if (map[k] === 1) {
      return k;
    }
    map[k] = 1;
  }
  return false;
}
