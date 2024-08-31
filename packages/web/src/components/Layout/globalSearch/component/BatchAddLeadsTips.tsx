import React, { FC, useMemo } from 'react';
import { UserQuotaItem } from 'api';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import ReactDOM from 'react-dom';
import { getLimitNumRemain } from '../../CustomsData/customs/utils';

interface Props {
  visible: boolean;
  onClose: () => void;
  onOk: () => void;
  userQuota: UserQuotaItem | null;
  selectedRows: Array<{
    referId?: string | null;
    excavateCnCompanyStatus?: number | null;
  }>;
}

export const BatchAddLeadsTips: FC<Props> = props => {
  const { visible, onOk, onClose, userQuota, selectedRows } = props;
  const addLeadsTipsTitle = useMemo(() => {
    if (!userQuota) return '';
    const validList = selectedRows.filter(item => !item.referId);
    const canExcavatList = validList.filter(item => item.excavateCnCompanyStatus === 0);
    const missNum = canExcavatList.length - getLimitNumRemain(userQuota);
    if (missNum <= 0) return '';
    return `共${validList.length}条有效数据需录入线索，因当前国内企业查询额度不足，其中${canExcavatList.length}条无法补充国内工商信息`;
  }, [selectedRows, userQuota]);
  return (
    <SiriusModal visible={visible} title="批量录入线索" closable={false} okText="继续全部录入" cancelText="暂不录入" width={476} onCancel={onClose} onOk={onOk}>
      {addLeadsTipsTitle}
    </SiriusModal>
  );
};

export const showBatchAddLeadsTips = (props: Omit<Props, 'visible' | 'onClose'>) => {
  const { onOk, userQuota, selectedRows } = props;
  const container = document.createElement('div');
  document.body.appendChild(container);

  const closeHandler = () => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  };
  const okHandler = () => {
    onOk();
    closeHandler();
  };
  ReactDOM.render(<BatchAddLeadsTips visible onClose={closeHandler} onOk={okHandler} userQuota={userQuota} selectedRows={selectedRows} />, container);
};
