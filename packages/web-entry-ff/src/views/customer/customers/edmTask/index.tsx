import React, { useState, useEffect, useCallback } from 'react';
import { ModalProps } from 'antd';
import { apiHolder, apis, EdmSendBoxApi, ResponseSendOperate, getIn18Text } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import style from './style.module.scss';

interface Props extends ModalProps {
  edmEmailId?: string;
  contactEmail: string;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
export const EdmTaskModal: React.FC<Props> = props => {
  const { edmEmailId, contactEmail, ...restProps } = props;
  const [list, setList] = useState<ResponseSendOperate['sendInfoList']>([]);

  const fetchList = useCallback(async () => {
    if (!contactEmail || !edmEmailId) {
      setList([]);
      return;
    }

    const res = await edmApi.getSendOperateList({ contactEmail, edmEmailId });
    setList(res?.sendInfoList || []);
  }, [edmEmailId, contactEmail]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <Modal className={style.taskModal} title={getIn18Text('FAJIANLIEBIAO')} okButtonProps={{ hidden: true }} {...restProps}>
      <Table
        columns={[
          {
            title: getIn18Text('RENWUZHUTI'),
            dataIndex: 'edmSubject',
            width: '130px',
          },
          {
            title: getIn18Text('YOUJIANZHUTI'),
            dataIndex: 'emailSubject',
            showSorterTooltip: true,
            width: '200px',
          },
          {
            title: getIn18Text('FAJIANFASONGSHIJIAN'),
            dataIndex: 'sendAt',
            width: '130px',
          },
        ]}
        pagination={false}
        dataSource={list}
        scroll={{ y: 400 }}
      />
    </Modal>
  );
};
