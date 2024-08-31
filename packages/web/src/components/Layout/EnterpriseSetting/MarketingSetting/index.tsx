import React, { FC, useState, useEffect } from 'react';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { Switch, InputNumber, message, Input, Button } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import { apiHolder, apis, EdmSendBoxApi, StrategyInfoRes } from 'api';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { getIn18Text } from 'api';
import styles from './MarketingSetting.module.scss';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

type TableData = StrategyInfoRes['edmSendStrategy'];

export const MarketingSetting: FC = () => {
  const [tableData, setTableData] = useState<TableData>();
  const [visible, setVisible] = useState(false);
  const [curItem, setCurItem] = useState<TableData[number]>();
  const [limitValue, setLimitValue] = useState<number>();
  // const [tempValue, setTempValue] = useState<number>();

  const fetchData = async () => {
    try {
      const res = await edmApi.strategyInfo();
      setTableData(res.edmSendStrategy);
    } catch (err: any) {
      message.error(err?.message || err?.msg || '未知原因');
    }
  };

  const setData = async (req: { dayLimit?: number; state?: number; type?: number }) => {
    const { dayLimit, state, type } = req;
    try {
      await edmApi.strategySave({
        edmSendStrategy: [
          {
            dayLimit: dayLimit ?? curItem!.dayLimit,
            state: state ?? curItem!.state,
            type: type ?? curItem!.type,
          },
        ],
      });
      message.success(
        // eslint-disable-next-line no-nested-ternary
        state === 1 ? '开启成功' : state === 0 ? '关闭成功' : '修改成功'
      );
      fetchData();
    } catch (err: any) {
      message.error(err?.message || err?.msg || '未知原因');
    }
  };

  const columns: ColumnsType<TableData[number]> = [
    {
      title: getIn18Text('RENWULEIXING'),
      dataIndex: 'taskName',
      key: 'taskName',
      width: 288,
    },
    {
      title: '描述',
      dataIndex: 'taskDesc',
      key: 'taskDesc',
      width: 442,
    },
    {
      title: '限制',
      dataIndex: 'dayLimit',
      key: 'dayLimit',
    },
    {
      title: getIn18Text('CAOZUO'),
      // dataIndex: '',
      // key: '',
      width: 106,
      render: (item: TableData[number]) => (
        <div className={styles.actionRow}>
          <Button
            type="link"
            className={styles.actionBtn}
            onClick={() => {
              setCurItem({ ...item });
              setVisible(true);
            }}
          >
            {getIn18Text('XIUGAI')}
          </Button>
          <Switch size="small" defaultChecked={item.state === 1} onChange={e => setData({ state: Number(e), dayLimit: item.dayLimit, type: item.type })} />
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (curItem) {
      setLimitValue(curItem.dayLimit);
    }
  }, [curItem]);

  return (
    <PermissionCheckPage resourceLabel="ORG_SETTINGS" accessLabel="EDM_EMAIL_SEND_QUOTA_SETTING" menu="ORG_SETTINGS_EMAIL_SEND_QUOTA_SETTING">
      <div className={styles.wrap}>
        <div className={styles.header}>
          <div className={styles.header1}>邮件营销发件限制</div>
          <div className={styles.header2}>限制每个收件人每天从同一个企业可以收到的邮件数</div>
        </div>
        <div className={styles.table}>
          <SiriusTable dataSource={tableData} columns={columns} pagination={false} />
        </div>
        <SiriusModal
          title={curItem?.taskName || ''}
          width={480}
          visible={visible}
          onCancel={() => setVisible(false)}
          centered
          destroyOnClose
          onOk={() => {
            if (!limitValue) {
              return;
            }
            setData({
              dayLimit: limitValue,
            });
            setVisible(false);
          }}
          okButtonProps={{
            disabled: !limitValue,
          }}
        >
          <div className={styles.modalContent}>
            <div className={styles.label}>限制</div>
            <Input
              required
              style={{
                width: 68,
              }}
              value={limitValue}
              onChange={e => {
                const value = e.target.value;
                if (!value) {
                  setLimitValue(value as any);
                } else if (/^\d+$/.test(value) && +value < 10000 && +value > 0) {
                  setLimitValue(Number(value));
                }
              }}
            />
            <div className={styles.label}>封</div>
          </div>
        </SiriusModal>
      </div>
    </PermissionCheckPage>
  );
};
