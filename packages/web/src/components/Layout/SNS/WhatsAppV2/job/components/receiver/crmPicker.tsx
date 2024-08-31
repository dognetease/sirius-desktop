import React, { useState } from 'react';
import classnames from 'classnames';
import { WhatsAppFileExtractResult, WhatsAppFileExtractStatus, WhatsAppFileExtractIndex } from 'api';
import { L2cCustomerGridModal } from '@lxunit/app-l2c-crm';
import { L2cLeadsGridModal } from '@lxunit/app-l2c-crm';
import { ReactComponent as CustomerIcon } from '@/images/icons/whatsApp/receiver-customer.svg';
import { ReactComponent as LeadIcon } from '@/images/icons/whatsApp/receiver-lead.svg';
import { ReactComponent as ArrowIcon } from '@/images/icons/whatsApp/receiver-arrow.svg';
import { getIn18Text } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import style from './crmPicker.module.scss';
interface CrmPickerProps {
  className?: string;
  extraction: WhatsAppFileExtractResult | null;
  onExtracted: (extractResult: WhatsAppFileExtractResult) => void;
}
const CrmPicker: React.FC<CrmPickerProps> = props => {
  const { className, extraction, onExtracted } = props;
  const [entry, setEntry] = useState<'customer' | 'lead' | null>(null);
  const handleOk = (values: any) => {
    const objectList = values?.company_list || values?.leads_list || [];
    const contactList = objectList.reduce(
      (accumulator: any, object: any) => [
        ...accumulator,
        ...(object.contact_list || [])
          .filter((contact: any) => !!contact?.whats_app)
          .map((contact: any) => ({
            ...contact,
            company_name: object.company_name || '',
            whatsAppStatus: WhatsAppFileExtractStatus.SUCCESS,
          })),
      ],
      []
    );
    if (!contactList.length) {
      Toast.error('所选联系人暂无 WhatsApp，请重新选择');
    } else {
      const whatsAppSet = new Set();
      // 根据 WhatsApp 是否重复修改状态
      contactList.forEach((contact: any) => {
        if (whatsAppSet.has(contact.whats_app)) {
          contact.whatsAppStatus = WhatsAppFileExtractStatus.REPEAT;
        } else {
          whatsAppSet.add(contact.whats_app);
        }
      });
      const result: WhatsAppFileExtractResult = {
        header: ['whatsapp 号码（必填）', '姓名', '公司名称'],
        body: contactList.map((contact: any, index: number) => ({
          rowId: index,
          status: contact.whatsAppStatus,
          content: {
            [WhatsAppFileExtractIndex.WHATSAPP]: contact.whats_app,
            [WhatsAppFileExtractIndex.CONTACT_NAME]: contact.contact_name || '',
            [WhatsAppFileExtractIndex.COMPANY_NAME]: contact.company_name || '',
          },
        })),
      };
      onExtracted(result);
      setEntry(null);
    }
  };
  const handleCancel = () => {
    setEntry(null);
  };
  return (
    <>
      <div className={classnames(style.crmPicker, className)}>
        <div className={style.title}>请根据条件选择群发对象</div>
        <div className={style.entries}>
          <div className={style.entry} onClick={() => setEntry('customer')}>
            <CustomerIcon className={style.icon} />
            <div className={style.name}>{getIn18Text('CONGWODEKEHUZHONGSHAIXUAN')}</div>
            <ArrowIcon className={style.arrow} />
          </div>
          <div className={style.entry} onClick={() => setEntry('lead')}>
            <LeadIcon className={style.icon} />
            <div className={style.name}>{getIn18Text('CONGWODEXIANSUOZHONGSHAIXUAN')}</div>
            <ArrowIcon className={style.arrow} />
          </div>
        </div>
      </div>
      {entry === 'customer' && <L2cCustomerGridModal way="BizWhatsApp" onOk={handleOk} onCancel={handleCancel} />}
      {entry === 'lead' && <L2cLeadsGridModal way="BizWhatsApp" onOk={handleOk} onCancel={handleCancel} />}
    </>
  );
};
export default CrmPicker;
