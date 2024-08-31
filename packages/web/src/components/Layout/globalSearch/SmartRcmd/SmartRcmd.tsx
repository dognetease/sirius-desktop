import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import styles from './smartrcmd.module.scss';
import Alert from '@web-common/components/UI/Alert/Alert';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { GlobalSearchApi, SmartRcmdItem, api, apis, getIn18Text, ICompanySubFallItem } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import classnames from 'classnames';
import { Loading } from '@/components/UI/Loading';
import RuleList from './components/RuleList/RuleList';
import RuleFormModal from './components/RuleFormModal/RuleFormModal';
import RcmdCompanyTable from './components/RcmdCompanyTable/RcmdCompanyTable';
import lodashDifferenceBy from 'lodash/differenceBy';
import { globalSearchDataTracker } from '@/components/Layout/globalSearch/tracker';
import useInterCollectData from '../../CustomsData/customs/hooks/useInterCollectData';
import RcmdFilter from './components/RcmdFilter/RcmdFilter';
import { RuleRefProp } from './components/RuleList/RuleList';
import { ConfigActions } from '@web-common/state/reducer';
import { useAppDispatch } from '@web-common/state/createStore';
import qs from 'querystring';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const sysApi = api.getSystemApi();

export interface filterProps {
  filterEdm: boolean;
  filterCustomer: boolean;
}

interface SmartRcmdProps extends React.HTMLAttributes<HTMLDivElement> {}

const SmartRcmd: React.FC<SmartRcmdProps> = ({ className, ...rest }) => {
  const [rulesList, setRulesList] = useState<SmartRcmdItem[]>([]);
  const [listLoading, setListLoading] = useState<boolean>(true);
  const [formModalState, setFormModalState] = useState<{
    visible: boolean;
    item?: SmartRcmdItem;
  }>({
    visible: false,
  });
  const [selectedItem, setSelectedItem] = useState<SmartRcmdItem | null | undefined>(null);

  const [collectDataList, setCollectDataList] = useState<{
    keyword: string;
    data: {
      name: string;
      country: string;
      id?: string | number;
      companyId?: string | number;
    }[];
  }>({
    keyword: '',
    data: [],
  });

  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [filterParams, setFilterParams] = useState<filterProps>({
    filterEdm: false,
    filterCustomer: false,
  });
  const [tableList, setTableList] = useState<ICompanySubFallItem[]>([]);
  const childRef = useRef<RuleRefProp>(null);
  const [updata] = useInterCollectData({
    data: collectDataList.data,
    keywords: collectDataList.keyword,
    origin: '智能推荐',
    module: 'wmData',
    pageKeywords: 'smartrcmd',
  });

  useEffect(() => {
    setCollectDataList(prv => {
      return {
        keyword: '',
        data: [],
      };
    });
  }, [updata]);

  const handleConfirmDelSub = (item: SmartRcmdItem) => {
    Alert.destroyAll();
    Alert.warn({
      title: '确认删除推荐规则吗？',
      content: (
        <>
          <div style={{ marginBottom: 8 }}>删除推荐规则后，相关企业数据更新时将不再发送通知。</div>
          {item.extPlanId && <div>关联的自动获客任务仍会自动发信，如需删除，请前往「客户开发」删除自动化任务。</div>}
        </>
      ),
      okText: '确定',
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        handleDelSub(item);
      },
      okCancel: true,
    });
  };
  const handleDelSub = async (item: SmartRcmdItem) => {
    try {
      await globalSearchApi.doDeleteSmartRcmd([item.id]);
      SiriusMessage.success('删除成功');
      // if (item.id === selectedItem?.id) {
      //   setSelectedItem(null);
      // }
      updateRuleList(undefined, item.id === selectedItem?.id);
    } catch (error) {}
  };
  const updateRuleList = useCallback(
    (
      parmas: {
        page: number;
        size: number;
      } = { page: 0, size: 50 },
      selectNew?: boolean,
      id?: number,
      ruleId?: number
    ) => {
      setListLoading(true);
      globalSearchApi
        .doGetSmartRcmdList(parmas)
        .then(res => {
          const { content } = res;
          let nextSelectedItem: SmartRcmdItem | null = null;
          setRulesList(prev => {
            if (content.length > prev.length) {
              nextSelectedItem = lodashDifferenceBy(content, prev, 'id')[0];
            } else {
              nextSelectedItem = content[0];
            }
            return content;
          });
          if (ruleId && content.some(item => item.id === ruleId)) {
            setSelectedItem(content.find(item => item.id === ruleId));
            return;
          }
          if (selectNew) {
            setSelectedItem(nextSelectedItem);
            return;
          }
          if (id) {
            setSelectedItem(content.find(item => item.id === id));
          }
        })
        .finally(() => {
          setListLoading(false);
        });
    },
    []
  );

  const handleCloseFormModal = () => {
    setFormModalState({
      visible: false,
    });
  };
  const handleFormModalOk = () => {
    updateRuleList(undefined, !formModalState.item, selectedItem?.id === formModalState?.item?.id ? formModalState?.item?.id : undefined);
    handleCloseFormModal();
  };

  const locationHash = location.hash;

  const [ruleId] = useMemo(() => {
    const moduleName = locationHash.substring(1).split('?')[0];
    if (!['smartrcmd', 'wmData'].includes(moduleName)) {
      return [''];
    }
    const params = qs.parse(locationHash.split('?')[1]);
    if (params.ruleId && typeof params.ruleId === 'string') {
      return [params.ruleId];
    }
    return [''];
  }, [locationHash]);

  useEffect(() => {
    if (collectDataList.data.length > 0 && tableLoading) {
      globalSearchDataTracker.trackCollectData({
        info: collectDataList.data,
        keywords: collectDataList.keyword,
        count: collectDataList.data.length,
        origin: '智能推荐',
      });
      setCollectDataList(prv => {
        return {
          keyword: '',
          data: [],
        };
      });
    } else {
      // loading完成重置数据
      setCollectDataList(prv => {
        return {
          keyword: '',
          data: [],
        };
      });
    }
  }, [tableLoading]);
  const dispatch = useAppDispatch();
  const onPlayVideo = (params: { videoId: string; source: string; scene: string }) => {
    const { videoId, source, scene } = params;
    dispatch(ConfigActions.showVideoDrawer({ videoId: videoId, source, scene }));
  };
  const renderBody = () => {
    if (rulesList.length === 0) {
      if (listLoading) {
        return (
          <div className={styles.introContainer}>
            <Loading />
          </div>
        );
      }
      return (
        <div className={styles.introContainer}>
          <div className={styles.intro}>
            <h1>{getIn18Text('ZHINENGTUIJIAN')}</h1>
            <h2>{getIn18Text('DINGZHIHUATUIJIAN')}</h2>
            <p>{getIn18Text('GENJUNINDEHUOKEXUQIUDINGYUECHANPINGUANJIANCI,XITONGHUIGENJUDINGYUENEIRONGHESOUSUOLISHIWEININTUIJIANKEHU')}</p>
            <h2>{getIn18Text('ZIDONGWAJUEKEHU')}</h2>
            <p>{getIn18Text('SHUJUSHISHIGENGXIN,GENJUNINDEXIHAOJINXINGZHENBIE,ZIDONGBANGNINXUNZHAOHAILIANGQIANZAIKEHU')}</p>
            <h2>{getIn18Text('ZIDONGYOUHUAKEHU')}</h2>
            <p>{getIn18Text('WOMENJIANGGENJUNINDEFANKUIJINXINGYOUHUA,XITONGHUITUIJIANGENGDUOFUHENINXINXIDEKEHU')}</p>
            <Button
              btnType="primary"
              onClick={() => {
                setFormModalState({
                  visible: true,
                });
              }}
            >
              {getIn18Text('CHUANGJIANTUIJIANGUIZE')}
            </Button>
          </div>
          <div className={styles.introImg} onClick={() => onPlayVideo({ videoId: 'V8', source: 'kehufaxian', scene: 'kehufaxian_6' })}></div>
        </div>
      );
    }
    return (
      <>
        <RuleList
          list={rulesList}
          onSelected={data => {
            setSelectedItem(data);
            setRulesList(prev =>
              prev.map(it => ({
                ...it,
                status: data.id === it.id ? 2 : it.status,
              }))
            );
          }}
          selectedItem={selectedItem}
          onUpdateList={updateRuleList}
          onDelete={handleConfirmDelSub}
          onCreate={() => {
            setFormModalState({
              visible: true,
            });
          }}
          onUpdate={item => {
            setFormModalState({
              visible: true,
              item,
            });
          }}
          tableList={tableList}
          ref={childRef}
        />
        <RcmdFilter filterParams={filterParams} setFilterParams={setFilterParams} ruleID={selectedItem?.id} keyword={selectedItem?.value} />
        <RcmdCompanyTable
          selectedItem={selectedItem}
          key={selectedItem?.id}
          selectedId={selectedItem?.id}
          filterParams={filterParams}
          setCollectDataList={(record, keyword) => {
            if (!collectDataList.data.some(item => item.id === record.id)) {
              setCollectDataList(prv => {
                return {
                  ...prv,
                  keyword: keyword ?? '',
                  data: [
                    ...prv.data,
                    {
                      name: record.name,
                      country: record.country,
                      id: record.id,
                      companyId: record.companyId,
                    },
                  ],
                };
              });
            }
          }}
          tableLoadingStatus={setTableLoading}
          setTableList={setTableList}
        />
      </>
    );
  };

  useEffect(() => {
    updateRuleList(undefined, true, undefined, Number(ruleId));
  }, [ruleId]);

  useEffect(() => {
    //  ruleList 存在 dom元素才存在
    if (ruleId && rulesList.length > 0) {
      childRef.current?.handleExpand(true);
    }
  }, [rulesList, ruleId]);

  return (
    <div className={classnames(styles.container, className)} {...rest}>
      {rulesList.length === 0 && (
        <div className={styles.titleWrapper}>
          <span className={styles.title}>{getIn18Text('ZHINENGTUIJIAN')}</span>
        </div>
      )}
      {renderBody()}
      {formModalState.visible && <RuleFormModal {...formModalState} onOk={handleFormModalOk} onCancel={handleCloseFormModal} />}
    </div>
  );
};

export default SmartRcmd;
