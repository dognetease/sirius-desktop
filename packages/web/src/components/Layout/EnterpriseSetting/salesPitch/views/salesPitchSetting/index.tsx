import React, { useState, useMemo } from 'react';
import classNames from 'classnames';
import { Button, Spin } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { DragDropContext, DragStart, DropResult } from 'react-beautiful-dnd';
import { SalesPitchModel, SalesPitchStages } from 'api';

import { useAppDispatch } from '@web-common/state/createStore';
import { SalesPitchThunks } from '@web-common/state/reducer/salesPitchReducer/thunk';
import { SALES_PITCH_STAGE_CONFIG_LIST } from '@web-common/state/reducer/salesPitchReducer/config';
import { ReactComponent as CloseIcon } from '../../images/close.svg';
import {
  recordDragList,
  getFromIndexWhenHideEnterprise,
  getToIndexWhenHideEnterprise,
  salesPitchManageTrack,
  CARD_CONFIG,
} from '@/components/Layout/EnterpriseSetting/salesPitch/utils/util';
import style from './index.module.scss';
import DragList from '@/components/Layout/EnterpriseSetting/salesPitch/components/salesPitchBoardList';
import SalesPitchConfigCheckbox from '@/components/Layout/EnterpriseSetting/salesPitch/components/salesPitchConfig';
import SalesPitchSearch from '@/components/Layout/EnterpriseSetting/salesPitch/components/salesPitchSearch';
import useState2ReduxMock from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useState2ReduxMock';
import { SalesPitchPageProps } from '@/components/Layout/EnterpriseSetting/salesPitch/types';
import useSalesPitchData from '@/components/Layout/EnterpriseSetting/salesPitch/utils/useSalesPitchData';
import { getIn18Text } from 'api';

const SalesPitchSettingPage: React.FC<SalesPitchPageProps> = props => {
  const { scene = 'settingBoard' } = props;
  const dispatch = useAppDispatch();

  const [, setWritePageOuterDrawerVisible] = useState2ReduxMock('writePageOuterDrawerVisible');
  const [, setEdmTemplateOuterDrawerVisible] = useState2ReduxMock('edmTemplateOuterDrawerVisible');
  const [, setEdmMailOuterDrawerVisible] = useState2ReduxMock('edmMailOuterDrawerVisible');

  const [isLoading] = useState2ReduxMock('isLoading');
  const [isFetchFailed] = useState2ReduxMock('isFetchFailed');

  const [searchInput] = useState2ReduxMock('searchInput');
  const isSearching = useMemo(() => !!searchInput, [searchInput]);

  const [config] = useState2ReduxMock('config');

  const [dataMap, setDataMap] = useState2ReduxMock('dataMap');

  const [salesPitchDataMap] = useSalesPitchData();
  const hasData = (Object.keys(salesPitchDataMap) as SalesPitchStages[]).some(v => salesPitchDataMap[v].length > 0);

  const [draggingColumnId, setDraggingColumnId] = useState('');

  // 抽屉数据
  const [, setDrawerType] = useState2ReduxMock('drawerType');
  const [, setActiveScene] = useState2ReduxMock('activeScene');
  const [, setDrawerVisible] = useState2ReduxMock('drawerVisible');
  const [, setDrawerDataId] = useState2ReduxMock('drawerDataId');
  const [, setSelectedStageId] = useState2ReduxMock('selectedStageId');

  const onDragEnd = async (result: DropResult) => {
    // 设置当前正在拖拽的stageId，用来传递给 card 组件，控制拖拽时悬浮到别的卡片上，不出现卡片的工具条，一个小的优化
    setDraggingColumnId('');
    const { source, destination } = result;
    // 拖拽到列表外时
    if (!destination) {
      return;
    }
    // 搜索模式不支持拖拽
    if (isSearching) {
      return;
    }
    // 暂时不支持跨列拖拽
    if (destination.droppableId !== source.droppableId) {
      return;
    }
    const fromIndex = source.index;
    const toIndex = destination.index;
    if (fromIndex === toIndex) {
      return;
    }
    const stageId = source.droppableId as SalesPitchStages;
    // 如果隐藏了公司话术时进行拖拽排序，需要知道起止位置在全量（非隐藏公司话术）列表的位置，从而更改全量列表
    const processedFromIndex = config.showEnterprise ? fromIndex : getFromIndexWhenHideEnterprise(dataMap[stageId], salesPitchDataMap[stageId], fromIndex);
    const processedToIndex = config.showEnterprise ? toIndex : getToIndexWhenHideEnterprise(dataMap[stageId], salesPitchDataMap[stageId], toIndex);
    if (processedFromIndex < 0 || processedToIndex < 0) {
      throw new Error('SORT ERROR');
    }
    // 设置列表数据
    const newList = recordDragList<SalesPitchModel>(dataMap[stageId], processedFromIndex, processedToIndex);
    setDataMap({ ...dataMap, [stageId]: newList });
    // 发送请求，静默成功，失败重新刷数据（可以做本地回滚）
    dispatch(SalesPitchThunks.sortSalesPitch({ newList, stageId }));
    salesPitchManageTrack({ opera: 'DRAG', type: newList[processedToIndex].type });
  };

  const onDragStart = (start: DragStart) => {
    setDraggingColumnId(start.source.droppableId);
  };

  // 点击新建话术
  const onCreate = (stageId: SalesPitchStages | '') => {
    setActiveScene(scene);
    setDrawerType('ADD');
    setDrawerVisible(true);
    setDrawerDataId('');
    setSelectedStageId(stageId);
  };

  const fetchData = () => {
    dispatch(SalesPitchThunks.fetchData({ queryKey: searchInput }));
  };

  const getColumnHeight = (length: number) => {
    if (length === 0) {
      return 112;
    }
    if (length < 4) {
      return CARD_CONFIG.ROW_HEIGHT * length + 124;
    }
    return '100%';
  };

  return (
    <div className={style.salesPitchSettingContainer}>
      <div className={style.salesPitchHeader}>
        <span className={style.salesPitchTitle}>
          {!['writePage', 'edmTemplate', 'edmMailEditor'].includes(scene) && (
            <>
              <span
                className={style.back}
                onClick={() => {
                  // 客户端底层框架useEffect有问题，非一级菜单的一级组件，如phase，helpcenter，会导致2+次hash变化，导致history记录跳2+次， 见handlePhase, switchPage
                  // history?.back();
                  process.env.BUILD_ISELECTRON ? history?.go(-2) : history?.back();
                }}
              ></span>{' '}
            </>
          )}
          {getIn18Text('HUASHUKU')}
        </span>
        <div className={style.salesPitchHeaderRight}>
          <SalesPitchConfigCheckbox />
          <SalesPitchSearch />
          <Button type="primary" onClick={() => onCreate('')}>
            {getIn18Text('XINJIANHUASHU')}
          </Button>
          {scene === 'writePage' && (
            <div className={style.closeIconContainer} onClick={() => setWritePageOuterDrawerVisible(false)}>
              <CloseIcon />
            </div>
          )}
          {scene === 'edmTemplate' && (
            <div className={style.closeIconContainer} onClick={() => setEdmTemplateOuterDrawerVisible(false)}>
              <CloseIcon />
            </div>
          )}
          {scene === 'edmMailEditor' && (
            <div className={style.closeIconContainer} onClick={() => setEdmMailOuterDrawerVisible(false)}>
              <CloseIcon />
            </div>
          )}
        </div>
      </div>
      <div className={classNames(style.salesPitchContent)}>
        {isLoading && (
          <div className={style.salesPitchListCommonContainer}>
            <Spin delay={500} tip="Loading..." indicator={<LoadingOutlined style={{ fontSize: 24, marginBottom: 12 }} spin />} />
          </div>
        )}
        {!isLoading && (
          <>
            <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
              {SALES_PITCH_STAGE_CONFIG_LIST.map(v => {
                const idList = salesPitchDataMap[v.id].map(_v => _v.cardId);
                return (
                  <div
                    key={v.id + idList.length}
                    className={classNames([style.salesPitchColumnContainer, `salesPitchColumnContainer-${v.id}`])}
                    style={{ height: getColumnHeight(idList.length) }}
                  >
                    <div className={style.salesPitchBoardListStage} style={{ marginBottom: hasData ? 0 : 12 }}>
                      {v.name || ''}
                    </div>
                    {hasData && <DragList stageId={v.id} idList={idList} isAllDragging={!!draggingColumnId} isDragDisabled={isSearching} scene={scene} />}
                    <Button className={style.salesPitchBoardCreateBtn} onClick={() => onCreate(v.id)}>
                      <PlusOutlined />
                    </Button>
                  </div>
                );
              })}
            </DragDropContext>
            {isFetchFailed && (
              <div className={style.salesPitchNoDataContainer}>
                <div className={style.salesPitchError} />
                <div className={style.salesPitchNoDataText}>{getIn18Text('JIAZAISHIBAI')}</div>
                <div className={style.refreshText} onClick={() => fetchData()}>
                  {getIn18Text('SHUAXIN')}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {!isLoading && !hasData && !isFetchFailed && (
        <div className={style.salesPitchNoDataContainer}>
          <div className={style.salesPitchNoDataBlock} />
          <span className={style.salesPitchNoDataText}>{getIn18Text('NEIRONGWEIKONG')}</span>
        </div>
      )}
    </div>
  );
};

export default SalesPitchSettingPage;
