/* eslint-disable react/destructuring-assignment */
import React, { useEffect, useState } from 'react';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { Checkbox } from 'antd';
import style from './style.module.scss';
import { useActions, MailProductActions, useAppSelector } from '@web-common/state/createStore';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';

const CheckboxGroup = Checkbox.Group;

interface ModalProps {
  theme: number;
  fields: any[];
  visible: boolean;
  onClose: () => void;
  container?: string;
}

export const ProductAttrOptions = [
  { value: 'product_name_en', label: getIn18Text('SHANGPINYINGWENMING') },
  { value: 'product_name_cn', label: getIn18Text('SHANGPINZHONGWENMING') },
  { value: 'product_number', label: getIn18Text('SHANGPINBIANHAO') },
  { value: 'moq', label: getIn18Text('QIDINGLIANG') },
  { value: 'color', label: getIn18Text('YANSE') },
  { value: 'price', label: getIn18Text('XIAOSHOUJIA') },
  { value: 'packaging_count', label: getIn18Text('MEIJIANSHULIANG') },
  { value: 'shipping_method', label: getIn18Text('WULIUFANGSHI') },
  { value: 'volume', label: getIn18Text('TIJI') },
  { value: 'gross_weight', label: getIn18Text('DANMAOZHONG') },
  { value: 'net_weight', label: getIn18Text('DANJINGZHONG') },
  { value: 'product_description_en', label: getIn18Text('SHANGPINJIESHAO（YINGWEN') },
];

export const ProductUpdateColumnModal = (props: ModalProps) => {
  // 这个组件在营销和普通邮件的插入商品信息中共用， 所以需要区分一个modal的container
  // const { container } = props;
  const imgColumns = useAppSelector(state => state.mailProductReducer.imgColumns);
  const tableColumns = useAppSelector(state => state.mailProductReducer.tableColumns);

  useEffect(() => {
    setKeys(props.theme === 0 ? imgColumns : tableColumns);
  }, [imgColumns, tableColumns, props.theme]);

  const columns = props.theme === 0 ? imgColumns : tableColumns;
  const [keys, setKeys] = useState<any>(columns);

  const { updateImgColumns, updateTableColumns } = useActions(MailProductActions);

  const onChange = (value: any[]) => {
    if (props.theme === 0 && value.length > 4) {
      toast.error({ content: getIn18Text('ZUIDUOKEXUANZE4GE') });
    } else if (props.theme === 1 && value.length > 8) {
      toast.error({ content: getIn18Text('ZUIDUOKEXUANZE8GE') });
    } else {
      setKeys(value);
    }
  };

  const onOk = () => {
    if (keys.length === 0) {
      toast.error({ content: getIn18Text('QINGXUANZEZIDUAN') });
      return;
    }
    if (props.theme === 0) {
      updateImgColumns(keys);
    } else {
      console.log('addProducts3', keys);
      updateTableColumns(keys);
    }
    props.onClose();
  };
  const onCancel = () => {
    setKeys(props.theme === 0 ? imgColumns : tableColumns);
    props.onClose();
  };

  return (
    <SiriusModal
      title={getIn18Text('XIUGAIZIDUAN')}
      width={545}
      maskClosable={false}
      visible={props.visible}
      className={style.productUpdateColumnModal}
      onCancel={onCancel}
      onOk={onOk}
      // getContainer={container || "#edm-write-root"}
      getContainer={document.body}
      zIndex={9999}
    >
      <div className={style.tip}>
        {props.theme === 0 ? getIn18Text('TUWEN') : getIn18Text('BIAOGE')}
        {getIn18Text('YANGSHIZUIDUOZHICHI')}
        {props.theme === 0 ? 4 : 8}
        {getIn18Text('GEZIDUAN')}
      </div>
      <div className={style.content}>
        <div className={style.title}>{getIn18Text('ZHANSHIZIDUAN：')}</div>
        <CheckboxGroup options={ProductAttrOptions} value={keys} onChange={onChange} />
      </div>
    </SiriusModal>
  );
};
