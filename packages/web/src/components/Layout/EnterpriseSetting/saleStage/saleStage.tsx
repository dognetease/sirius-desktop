/* eslint-disable react/jsx-props-no-spreading */
import { Skeleton, Button } from 'antd';
import Table, { ColumnsType } from 'antd/lib/table';
import MenuOutlined from '@ant-design/icons/MenuOutlined';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import { api, apis, StageItem, SaleStageApi, SaleStageTableList } from 'api';
import classnames from 'classnames';
import React, { useState, useEffect } from 'react';
import { EditStageModal } from './EditStageModal';
import { SetupDealStageModal } from './SetupDealStageModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { AlertErrorIcon } from '@web-common/components/UI/Icons/icons';
import ShowConfirm from '../../Customer/components/confirm/makeSureConfirm';
import style from './saleStage.module.scss';
import './saleStage.scss';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { getIn18Text } from 'api';
const saleStageApi = api.requireLogicalApi(apis.saleStageApiImpl) as SaleStageApi;
export enum typeEnum {
  NORMAL_STAGE_CODE,
  DEAL_STAGE_CODE,
  CLOSE_STAGE_CODE,
  REOPEN_STAGE_CODE,
}
const typeMap: {
  [index: number]: string;
} = {
  [typeEnum.NORMAL_STAGE_CODE]: '-',
  [typeEnum.DEAL_STAGE_CODE]: getIn18Text('CHENGJIAOJIEDUAN'),
  [typeEnum.CLOSE_STAGE_CODE]: getIn18Text('GUANBIJIEDUAN'),
  [typeEnum.REOPEN_STAGE_CODE]: getIn18Text('ZHONGXINDAKAI'),
};
const DragHandle = SortableHandle(() => <MenuOutlined style={{ cursor: 'grab', color: '#7D8085' }} />);
const SortableItem = SortableElement((props: object) => <tr {...props} />);
const SortableBody = SortableContainer((props: object) => <tbody {...props} />);
interface IDraggableContainerProps {
  onSortEnd: ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => void;
}
const DraggableContainer = (props: IDraggableContainerProps) => (
  <SortableBody useDragHandle disableAutoscroll helperClass="row-dragging" {...props} onSortEnd={props.onSortEnd} />
);
interface IDraggableBodyRowProps {
  className?: string;
  style?: object;
  dataSource: SaleStageTableList;
  'data-row-key'?: string;
}
const DraggableBodyRow = ({ className, style, dataSource, ...restProps }: IDraggableBodyRowProps) => {
  const index = dataSource.findIndex(x => x.id === restProps['data-row-key']);
  // 关闭阶段不可拖拽排序
  if (index >= 0 && dataSource[index].type === typeEnum.CLOSE_STAGE_CODE) {
    return <tr {...restProps} />;
  }
  return <SortableItem index={index} {...restProps} />;
};
export const SaleStage = () => {
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<StageItem>();
  const [data, setData] = useState<SaleStageTableLSist>([]);
  const [loading, setLoading] = useState(false);
  const handleAddStage = () => {
    const maxWeight = Math.min(...data.map(item => item.weight));
    setEditItem({
      id: '',
      name: '',
      stage: 0,
      type: 0,
      weight: maxWeight - 1,
    });
  };
  const handleEdit = (item: StageItem) => {
    setEditItem(item);
  };
  const deleteConfirm = (item: StageItem) => {
    ShowConfirm({ title: getIn18Text('SHIFOUQUERENSHANCHU\uFF1F'), type: 'danger', makeSure: () => handleDelete(item) });
  };
  const handleDelete = (item: StageItem) => {
    saleStageApi.deleteStage(item).then(res => {
      if (res?.code === 1 && res?.message) {
        return SiriusModal.warning({
          title: getIn18Text('CUOWUTISHI'),
          className: 'no-content-confirm',
          icon: <AlertErrorIcon />,
          content: <span>{res.message}</span>,
        });
      }
      fetchData();
      Toast.success({ content: `删除成功` });
    });
  };
  const fetchData = () => {
    setLoading(true);
    saleStageApi
      .getList()
      .then(setData)
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(fetchData, []);
  const columns: ColumnsType<StageItem> = [
    {
      title: getIn18Text('PAIXU'),
      dataIndex: 'sort',
      width: 58,
      className: 'drag-visible',
      render(_, field) {
        if (field.type === typeEnum.CLOSE_STAGE_CODE) {
          return null;
        }
        return <DragHandle />;
      },
    },
    {
      title: getIn18Text('XIAOSHOUJIEDUAN'),
      dataIndex: 'name',
    },
    {
      title: getIn18Text('CHENGJIAOZHUANGTAI'),
      dataIndex: 'type',
      render(_, field) {
        return typeMap[field.type] || '-';
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 120,
      render(_, field) {
        if (field.type === typeEnum.CLOSE_STAGE_CODE) {
          return '-';
        }
        return (
          <>
            <a className={style.btn} onClick={() => handleEdit(field)}>
              {getIn18Text('BIANJI')}
            </a>
            <a className={style.btn} onClick={() => deleteConfirm(field)}>
              {getIn18Text('SHANCHU')}
            </a>
          </>
        );
      },
    },
  ];
  const onSortEnd = ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
    if (oldIndex !== newIndex) {
      const newData: SaleStageTableList = arrayMoveImmutable([...data], oldIndex, newIndex).filter(el => !!el);
      newData.forEach((item, index) => {
        item.weight = index;
      });
      setData(newData);
      saleStageApi.updateOrderList(newData).then(() => {
        Toast.success({ content: `保存成功` });
      });
    }
  };
  return (
    <PermissionCheckPage resourceLabel="ORG_SETTINGS" accessLabel="CONTACT_SALES_STAGE_SETTING" menu="ORG_SETTINGS_SALES_STAGE_SETTING">
      <div className={style.pageContainer}>
        <h3 className={style.pageTitle}>
          <span>{getIn18Text('XIAOSHOUJIEDUANSHEZHI')}</span>
          <div className={style.actionGroup}>
            <Button type="link" onClick={() => setSetupModalVisible(true)}>
              {getIn18Text('SHEZHICHENGJIAO')}
            </Button>
            <Button type="primary" onClick={handleAddStage}>
              {getIn18Text('XINJIANJIEDUAN')}
            </Button>
          </div>
        </h3>
        <Skeleton loading={loading} active>
          <Table
            className={classnames('edm-table', style.saleStageTable)}
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={false}
            components={{
              body: {
                wrapper: (props: object) => <DraggableContainer {...props} onSortEnd={onSortEnd} />,
                row: (props: object) => <DraggableBodyRow {...props} dataSource={data} />,
              },
            }}
          />
        </Skeleton>
        <SetupDealStageModal
          visible={setupModalVisible}
          stageList={data}
          onClose={() => setSetupModalVisible(false)}
          onOk={() => {
            setSetupModalVisible(false);
            fetchData();
          }}
        />
        <EditStageModal
          visible={Boolean(editItem)}
          item={editItem}
          onClose={() => setEditItem(undefined)}
          onOk={() => {
            setEditItem(undefined);
            fetchData();
          }}
        />
      </div>
    </PermissionCheckPage>
  );
};
