import { getIn18Text } from 'api';
import React, { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { Drawer } from 'antd';

// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
// import SiriusButton from '@web-common/components/UI/Button';
import SiriusButton from '@lingxi-common-component/sirius-ui/Button';
// import { Radio } from '@web-common/components/UI/Radio';
import Radio from '@lingxi-common-component/sirius-ui/Radio';
import { ReactComponent as DeleteIcon } from '@/images/icons/modal_close_temp.svg';
import type { ColumnsType } from 'antd/lib/table';
import classnames from 'classnames';
import { SubjectAnalysisRes, apiHolder } from 'api';

import styles from './UserInfoDetail.module.scss';
import { WorldMap } from './WorldMap';
import { DeviceMap } from './DeviceMap';
import { TimeMap } from './TimeMap';

const { isMac } = apiHolder.env;
const regionOption = [
  {
    label: getIn18Text('ANDEQUFENBU'),
    value: 0,
  },
  {
    label: getIn18Text('ANSHIJIANFENBU'),
    value: 1,
  },
  {
    label: getIn18Text('ANSHEBEIFENBU'),
    value: 2,
  },
];
const dataOption = [
  {
    label: getIn18Text('DAKAISHU'),
    value: 1,
  },
  {
    label: getIn18Text('HUIFUSHU'),
    value: 0,
  },
];

const TypeLabels: Record<number, string> = {
  0: getIn18Text('HUIFU'),
  1: getIn18Text('DAKAI'),
};

// const columns: ColumnsType = [
//   {
//     title: '地区',
//     key: '1',
//     dataIndex: '1',
//   },
//   {
//     title: '打开人数',
//     key: '2',
//     dataIndex: '2',
//   },
//   {
//     title: '打开次数',
//     key: '3',
//     dataIndex: '3',
//   },
// ];
type TableData = SubjectAnalysisRes['contactInfoAnalysisList'][0]['analysisDetailList'];

const columns = (dataType: number) => [
  {
    title: getIn18Text('DEQU'),
    key: 'desc',
    dataIndex: 'desc',
  },
  {
    title: `${TypeLabels[dataType]}人数`,
    key: 'count',
    dataIndex: 'count',
  },
  {
    title: `${TypeLabels[dataType]}次数`,
    key: 'num',
    dataIndex: 'num',
  },
];

const deviceColumns = (dataType: number) => [
  {
    title: getIn18Text('SHEBEI'),
    key: 'desc',
    dataIndex: 'desc',
  },
  {
    title: `${TypeLabels[dataType]}人数`,
    key: 'count',
    dataIndex: 'count',
  },
  {
    title: `${TypeLabels[dataType]}次数`,
    key: 'num',
    dataIndex: 'num',
  },
];

export const UserInfoDetail: FC<{
  // renderEchart: () => JSX.Element;
  // columns?: ColumnsType;
  data: SubjectAnalysisRes['contactInfoAnalysisList'];
}> = props => {
  const { data } = props;
  const [splitRule, setSplitRule] = useState<number>(0);
  const [dataType, setDataType] = useState(1);
  // const [secondRegion, setSecondRegion] = useState<TableData>([]);
  const [tableData, setTableData] = useState<TableData>([]);
  // 完整的data，需要再查看更多种展示
  const [fullData, setFullData] = useState<TableData>([]);
  // 是否展示全部数据
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    const cur = data.find(item => item.analysisType === splitRule && item.emailOpType === dataType);
    if (cur != null) {
      setTableData(cur.analysisDetailList.slice(0, 6));
      setFullData(cur.analysisDetailList);
    } else {
      setTableData([]);
      setFullData([]);
    }
  }, [splitRule, dataType]);

  // useEffect(() => {
  //   if (tableData[0] && tableData[0].subList) {
  //     setSecondRegion(
  //       tableData[0].subList.map(item => ({
  //         desc: `${tableData[0].desc}--${item.desc}`,
  //         count: item.count,
  //         num: item.num,
  //       }))
  //     );
  //   } else {
  //     setSecondRegion(tableData);
  //   }
  // }, [tableData]);

  // 获取当前表格展示数据，涉及二级地区的转换
  const tableData2SecondData = useCallback(
    (tableData: TableData) => {
      if (splitRule === 0 && tableData[0] && tableData[0].subList) {
        return tableData[0].subList.map(item => ({
          desc: `${tableData[0].desc}-${item.desc}`,
          count: item.count,
          num: item.num,
        }));
      }
      return tableData;
    },
    [splitRule]
  );

  const renderTable = () => (
    <div className={styles.table}>
      <SiriusTable
        scroll={{ y: 330 }}
        columns={splitRule === 2 ? deviceColumns(dataType) : columns(dataType)}
        dataSource={tableData2SecondData(fullData)}
        pagination={false}
      />
      {/* {fullData.length > 6 && (
        <div onClick={() => setShowFull(true)} className={styles.showMore}>
          查看更多
        </div>
      )} */}
    </div>
  );

  const renderContent = useMemo(() => {
    switch (splitRule) {
      case 0:
        return (
          <>
            <div className={styles.echarts}>
              <WorldMap data={tableData} />
            </div>
            {renderTable()}
          </>
        );
      case 1:
        return (
          // todo 需要一个折线图
          <div className={styles.echarts}>
            <TimeMap data={fullData} type={dataType} />
          </div>
        );
      case 2:
        return (
          <>
            <div className={styles.echarts}>
              <DeviceMap data={fullData} />
            </div>
            {renderTable()}
          </>
        );
    }
  }, [tableData, splitRule, fullData]);

  return (
    <div className={styles.wrap}>
      <div className={styles.label}>{getIn18Text('KEHUXINXIFENBU')}</div>
      <div className={styles.header}>
        <Radio.Group className={styles.myRadio} options={dataOption} onChange={e => setDataType(e.target.value)} optionType="button" value={dataType} />
      </div>
      <div className={styles.header2}>
        <div className={styles.right}>
          {regionOption.map(option => (
            <div
              key={option.value}
              onClick={() => setSplitRule(option.value)}
              className={classnames(styles.myRadio, splitRule === option.value ? styles.activeRadio : '')}
            >
              {option.label}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.content}>{renderContent}</div>
      <Drawer
        placement="right"
        width={504}
        headerStyle={{
          display: 'none',
        }}
        visible={showFull}
        onClose={() => setShowFull(false)}
        className={styles.myDrawer}
      >
        <div
          className={styles.drawerWrap}
          style={
            !isMac
              ? {
                  marginTop: 56,
                }
              : {}
          }
        >
          <div className={styles.drawerHeader}>
            <div className={styles.drawerTitle}>
              {getIn18Text('QUANBU')}
              {TypeLabels[dataType]}
            </div>
            <DeleteIcon className={styles.closeIcon} onClick={() => setShowFull(false)} />
          </div>
          <div className={styles.drawerContent}>
            <SiriusTable columns={splitRule === 2 ? deviceColumns(dataType) : columns(dataType)} dataSource={tableData2SecondData(fullData)} pagination={false} />
          </div>
          <div className={styles.drawerFooter}>
            <SiriusButton onClick={() => setShowFull(false)} btnType="primary">
              {getIn18Text('CLOSE_TXT')}
            </SiriusButton>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
