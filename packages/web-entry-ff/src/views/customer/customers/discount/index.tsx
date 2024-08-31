import React, { useState, useRef, useEffect } from 'react';
import { apiHolder, apis, FFMSApi, FFMSCustomer, FFMSLevelAdmin } from 'api';
import EditOutlined from '@ant-design/icons/EditOutlined';
import { useFFmsPrivileges } from '@web-entry-ff/hooks/useFFmsPrivileges';
import InputNumber from '../../components/inputNumber';
import { _ } from '../../levelAdmin/table';
import style from './style.module.scss';

interface Props {
  customerType: FFMSLevelAdmin.CUSTOMER_TYPE;
  discountType: string;
  accountId: string;
  update: () => void;
  data: FFMSCustomer.TypeItem;
}

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
const Discount: React.FC<Props> = ({ customerType, data, accountId, update, discountType }) => {
  const [discount, setDiscount] = useState<number>(0);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { hasAdminPermission } = useFFmsPrivileges();

  useEffect(() => {
    if (data.advance) {
      setDiscount(Number(data.advance));
    }
  }, [data]);

  const onChangeDiscount = () => {
    // 获取重置后的数值
    const curNum = String(discount).split('.')[0];
    const params = {
      advance: String(curNum),
      customerType,
      customerTypeName: data.customerTypeName,
      customerTypeId: data.customerTypeId,
      accountId,
    };
    ffmsApi.saveFfCustomerType(params).then(() => {
      update();
      setIsEdit(false);
    });
  };
  if (isEdit) {
    return (
      <InputNumber
        defaultValue={discount}
        precision={0}
        ref={inputRef}
        onBlur={onChangeDiscount}
        onPressEnter={onChangeDiscount}
        style={{ padding: '0 5px', width: 180 }}
        onChange={value => setDiscount(value as number)}
      />
    );
  }

  return (
    <>
      <span className={style.discount}>{`${_(discount + '')}${discountType === 'PERCENT' ? '%' : ''}`}</span>
      {(hasAdminPermission || data?.defaultType) && (
        <EditOutlined
          onClick={() => {
            setIsEdit(!isEdit);
            const timer = setTimeout(() => {
              inputRef.current?.focus();
              clearTimeout(timer);
            });
          }}
        />
      )}
    </>
  );
};

export default Discount;
