import React, { useState, useEffect } from 'react';
import style from './index.module.scss';
import classNames from 'classnames';
import Modal from '@/components/Layout/components/Modal/modal';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { TableColumnsType, message } from 'antd';
import { api, apis, GlobalSearchApi, getIn18Text } from 'api';
import { globalSearchDataTracker, GlobalSearchTableEvent } from '../../tracker';
import VirtualTable from '@web-common/components/UI/VirtualTable/VirtualTable';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

interface subscribeCompanyModalProps {
  visible: boolean;
  setVisible: (bl: boolean) => void;
  companyList: Array<{
    name: string;
    country: string;
    companyId: any;
    collectId: any;
  }>;
  mainId: string | number;
  setMergeCompanylist?: (arr: any) => void;
  onChangeCollect?(companyId: string, collectId: number | string | null): void;
}

const domainRowKey = 'companyId';
export const SubscribeCompanyModal: React.FC<subscribeCompanyModalProps> = props => {
  const [isRefresh, setIsRefresh] = useState<boolean>(false);
  const { visible, setVisible, companyList, setMergeCompanylist, mainId, onChangeCollect } = props;
  const mergeDomainHeadercolumns: TableColumnsType<{ name: string; country?: string; companyId: string; collectId: any }> = [
    {
      title: getIn18Text('GONGSIMINGCHENG'),
      dataIndex: 'name',
    },
    {
      title: getIn18Text('GUOJIA/DEQU'),
      dataIndex: 'country',
    },
    {
      title: getIn18Text('CAOZUO'),
      dataIndex: 'companyId',
      render: (value, record) => {
        return (
          <a
            onClick={e => {
              e.stopPropagation();
              changeSubscribe(e, value, record, mainId);
            }}
          >
            {record.collectId > 0 ? getIn18Text('QUXIAODINGYUE') : getIn18Text('DINGYUEGONGSI')}
          </a>
        );
      },
    },
  ];
  const MergeCompanyTable = (list: Array<{ name: string; country?: string; companyId: string; collectId: any }>) => {
    return (
      <>
        <div className={style.virtualTable}>
          <div className={style.virtualTableHeader}>
            <div className={style.virtualTableHeaderIntro}>
              {`该公司与以下${list.length}家公司相关，您可以订阅其中的某个公司，当该公司下出现新的海关记录或联系人信息时，系统将及时通知您。`}
            </div>
          </div>
          <VirtualTable
            rowKey={domainRowKey}
            rowHeight={46}
            columns={mergeDomainHeadercolumns}
            dataSource={list}
            autoSwitchRenderMode={true}
            enableVirtualRenderCount={50}
            scroll={{ y: 368 }}
            // tableLayout={'fixed'}
            pagination={false}
          />
        </div>
      </>
    );
  };
  const changeSubscribe = async (e: any, companyId: string, record: any, mainId: string | number) => {
    const { collectId, name, country } = record;
    console.log(record, 'recordrecordrecord');
    if (collectId > 0) {
      // cancelAnimationFrame;
      await globalSearchApi.doDeleteCollectById({ collectId });
      message.success({
        content: '已取消订阅，系统将不再向您推送该公司动态',
      });
      handleItemCollectId(companyId, null);
      // globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.UnSubscribe);
    } else {
      const prname = companyId === mainId ? undefined : name;
      const prcountry = companyId === mainId ? undefined : country;
      const currentCollectId = await globalSearchApi.doCreateCollectByCompanyId(mainId, prname, prcountry);
      handleItemCollectId(companyId, currentCollectId);
      message.success({
        content: '公司订阅成功，系统将为您及时推送该公司动态',
      });
      // globalSearchDataTracker.trackTableListClick(GlobalSearchTableEvent.Subscribe);
    }
  };
  const handleItemCollectId = (companyId: string, collectId: string | number | null) => {
    const { companyList } = props;
    let arr = companyList.map(item => {
      if (item.companyId === companyId) {
        item.collectId = collectId;
      }
      return item;
    });
    const refresh = JSON.stringify(arr) === JSON.stringify(companyList);
    setIsRefresh(refresh);
    setMergeCompanylist?.(arr);
    // todo
    onChangeCollect?.(companyId, collectId);
  };
  return (
    <Modal
      visible={visible}
      footer={null}
      title={'订阅相关公司'}
      width={480}
      onCancel={e => {
        e.stopPropagation();
        setVisible(isRefresh);
      }}
      bodyStyle={{ padding: '8px 24px' }}
    >
      {MergeCompanyTable(companyList)}
    </Modal>
  );
};
