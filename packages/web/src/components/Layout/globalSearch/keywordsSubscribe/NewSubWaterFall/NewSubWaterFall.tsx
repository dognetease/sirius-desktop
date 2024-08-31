import { GlobalSearchApi, ICompanySubFallItem, api, apis, getIn18Text } from 'api';
import React, { useContext, useEffect, useState } from 'react';
import { SubKeyWordContext } from '../subcontext';
import { Empty } from 'antd';
import styles from './newsubwaterfall.module.scss';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import WaterFall from './WaterFall';
import { Loading } from '@/components/UI/Loading';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
export const WATER_FALL_PAGE_SIZE = 10;

interface NewSubWaterFallProps {
  onOpenRules?(): void;
  onChangeTitleOp?(visible: boolean): void;
}

const NewSubWaterFall: React.FC<NewSubWaterFallProps> = ({ onOpenRules, onChangeTitleOp }) => {
  const [waterFallList, setWaterFallList] = useState<ICompanySubFallItem[]>([]);
  const [currentLoaded, setCurrentLoaded] = useState<ICompanySubFallItem[] | null>(null);
  const [ignored, setIgnored] = useState<Set<string>>(new Set());
  const [hiddened, setHiddened] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);

  const handleRecordSuccess = (id: string) => {
    const next = new Set(hiddened);
    next.add(id);
    setHiddened(next);
    globalSearchApi.doIgnoreCompanySub({
      idList: [id],
      type: 1,
    });
  };
  const handleToggleIgnore = async (params: { id: string; ignore: boolean }) => {
    const { ignore, id } = params;
    const next = new Set(ignored);
    if (!ignore) {
      next.add(id);
      globalSearchApi.doIgnoreCompanySub({
        idList: [id],
        type: 0,
      });
    } else {
      globalSearchApi.doRemoveIgnoreCompanySub({
        idList: [id],
      });
      next.delete(id);
    }
    setIgnored(next);
  };

  useEffect(() => {
    onChangeTitleOp?.(waterFallList.length > 0);
    return () => {
      onChangeTitleOp?.(false);
    };
  }, [waterFallList.length]);

  useEffect(() => {
    setLoading(true);
    globalSearchApi
      .doGetSubCompanyFallList({
        size: WATER_FALL_PAGE_SIZE,
      })
      .then(res => {
        if (res.length > 0) {
          setWaterFallList(prev => {
            return prev.concat(res);
          });
        }
        setCurrentLoaded(res);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const loadMore = () => {
    if (loading) {
      return;
    }
    const nextOrder = waterFallList.findLast(fall => !ignored.has(fall.id) && !hiddened.has(fall.id))?.order;
    setLoading(true);
    globalSearchApi
      .doGetSubCompanyFallList({
        size: WATER_FALL_PAGE_SIZE,
        startOrder: nextOrder,
      })
      .then(res => {
        if (res.length > 0) {
          setWaterFallList(prev => {
            return prev.concat(res);
          });
        }
        setCurrentLoaded(res);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  if (waterFallList.length > 0) {
    return (
      <WaterFall
        ignoredSet={ignored}
        currentLoaded={currentLoaded}
        loading={loading}
        onToggleIgnore={handleToggleIgnore}
        onRecordSuccess={handleRecordSuccess}
        list={waterFallList}
        loadMore={loadMore}
      />
    );
  }
  if (loading) {
    return (
      <div className={styles.emptyContainer}>
        <Loading />
      </div>
    );
  }
  return (
    <div className={styles.emptyContainer}>
      <Empty
        description={
          <div>
            <h1 className={styles.title}>产品订阅已经开启</h1>
            <p className={styles.subTitle}>
              {getIn18Text('XITONGZHENGZAIWEININZAIQUANWANGFANWEINEISOUSUOQIANZAIKEHU')}，{getIn18Text('QINGGUANZHUYOUJIANTIXING')}
            </p>
          </div>
        }
        className={styles.empty}
        image={<div className={styles.image}></div>}
      >
        <Button btnType="primary" onClick={onOpenRules}>
          管理订阅规则
        </Button>
      </Empty>
    </div>
  );
};

export default NewSubWaterFall;
