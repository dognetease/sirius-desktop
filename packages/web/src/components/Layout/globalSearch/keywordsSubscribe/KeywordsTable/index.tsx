import { api, apis, GlobalSearchApi, GlobalSearchSubKeywordType, IGlobalSearchSub } from 'api';
import { Table } from 'antd';
import React, { useContext } from 'react';
import moment from 'moment';
import classNames from 'classnames';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { SubKeyWordContext } from '../subcontext';
import styles from './keywordstable.module.scss';
import GuideToolTip from '../GuideTooltip';
import HscodeDesc from './HscodeDesc';
import { getIn18Text } from 'api';
const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
interface KeywordsTableProps {
  onDisplaySub?(sub: IGlobalSearchSub): void;
  onDel?: (onOk: () => void) => void;
}
export const ProductTypeMap: Map<GlobalSearchSubKeywordType, string> = new Map([
  ['product', getIn18Text('CHANPINMINGCHENG')],
  ['hscode', 'HSCode'],
]);
export default (props: KeywordsTableProps) => {
  const [state, dispatch] = useContext(SubKeyWordContext);
  const handleUpdateSub = async (item: IGlobalSearchSub) => {
    const success = await globalSearchApi.doUpdateSub(item.id);
    if (item.status === 1) {
      const list = state.list.map(e => ({
        ...e,
        status: e.id === item.id ? 2 : e.status,
      }));
      dispatch({
        type: 'LIST_FINISH',
        payload: {
          list,
        },
      });
    }
    success && props.onDisplaySub?.(item);
  };
  const handleDelSub = async (id: number) => {
    props.onDel?.(async () => {
      try {
        await globalSearchApi.doDeleteSub([id]);
        SiriusMessage.success(getIn18Text('GUANJIANCIYITUIDING'));
        dispatch({
          type: 'LIST_REFRESH',
        });
      } catch (error) {}
    });
  };
  return (
    <Table<IGlobalSearchSub>
      className={classNames(styles.table, 'edm-table')}
      loading={state.listLoading}
      columns={[
        {
          title: `${getIn18Text('CHANPINMINGCHENG')}/HSCode`,
          dataIndex: 'value',
          width: 300,
          render: (value, record) => {
            // 状态，0-新建，1-待查阅,2-已阅，-1已经删除
            const needView = record.status === 1;
            return (
              <span className={styles.nameWrapper}>
                <span
                  className={classNames(styles.subName)}
                  onClick={() => {
                    handleUpdateSub(record);
                  }}
                >
                  {value}
                </span>
                {record.type === 'hscode' && <HscodeDesc hscode={value} />}
                {needView && <span className={styles.subNew}>发现新的企业</span>}
              </span>
            );
          },
        },
        {
          title: getIn18Text('DINGYUELEIXING'),
          dataIndex: 'type',
          width: 100,
          render: value => ProductTypeMap.get(value) || '',
        },
        {
          title: getIn18Text('GUOJIA/DEQU'),
          width: 250,
          dataIndex: 'country',
          render: (value: string[] | null) => {
            if (value) {
              return value.join('，');
            }
            return '-';
          },
        },
        {
          title: getIn18Text('SHANGCIGENGXINSHIJIAN'),
          dataIndex: 'watchTime',
          width: 150,
          render: value => moment(value).format('YYYY/M/D'),
        },
        {
          title: getIn18Text('CAOZUO'),
          dataIndex: 'id',
          fixed: 'right',
          width: 140,
          render: (id, sub, index) => {
            const viewDetail = (
              <span
                style={{ color: '#386EE7', cursor: 'pointer', marginRight: 24 }}
                onClick={() => {
                  handleUpdateSub(sub);
                }}
              >
                {getIn18Text('CHAKANXIANGQING')}
              </span>
            );
            return (
              <div id={`gloablsearch-table-option-${index}`}>
                {index === 0 ? (
                  <GuideToolTip
                    storeId="global_search_keyword_sub_detail"
                    title={getIn18Text('DINGYUEWANCHENGHOU\uFF0CNINKECHAKANGAIGUANJIANCIXIADESUOYOUQIYEXINXI')}
                    placement="bottomRight"
                  >
                    {viewDetail}
                  </GuideToolTip>
                ) : (
                  viewDetail
                )}
                <span
                  style={{ color: '#386EE7', cursor: 'pointer' }}
                  onClick={() => {
                    handleDelSub(id);
                  }}
                >
                  {getIn18Text('TUIDING')}
                </span>
              </div>
            );
          },
        },
      ]}
      dataSource={state.list}
      rowKey="id"
      pagination={false}
      scroll={{
        x: 940,
      }}
      rowSelection={{
        selectedRowKeys: state.selectedSubIds,
        onChange: newSelectedRowKeys => {
          dispatch({
            type: 'LIST_SELECTED_CHANGE',
            payload: {
              ids: newSelectedRowKeys as number[],
            },
          });
        },
      }}
    />
  );
};
