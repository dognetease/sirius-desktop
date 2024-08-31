/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button, Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import React, { useState, useEffect, useCallback } from 'react';
import { api, apis, EdmVariableItem, FieldSettingApi } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { AlertErrorIcon } from '@web-common/components/UI/Icons/icons';
import style from './variable.module.scss';
import { EditVariableModal } from './EditVariableModal';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { getIn18Text } from 'api';
const fieldSettingApi = api.requireLogicalApi(apis.fieldSettingApiImpl) as FieldSettingApi;
const SYSTEM_VARS = ['name_0', 'name_1', 'name_2', 'company'];
export const VariableSetting = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<EdmVariableItem>();
  const [data, setData] = useState<EdmVariableItem[]>();
  const handleEdit = (item: EdmVariableItem) => {
    setShowModal(true);
    setEditItem(item);
  };
  const handleCreate = () => {
    setShowModal(true);
    setEditItem(undefined);
  };
  const getList = useCallback(() => {
    setLoading(true);
    fieldSettingApi.getVariableList().then(res => {
      setData(res);
      setLoading(false);
    });
  }, [setLoading, setData]);
  useEffect(() => {
    getList();
  }, []);
  const isDuplicateVarName = useCallback(
    (name: string) => {
      if (SYSTEM_VARS.indexOf(name) > -1) return true;
      return data ? data.some(item => item.variableName === name) : false;
    },
    [data]
  );
  const handleDelete = (item: EdmVariableItem) => {
    SiriusModal.warning({
      title: getIn18Text('SHIFOUQUERENSHANCHU?'),
      className: 'no-content-confirm',
      icon: <AlertErrorIcon />,
      okType: 'danger',
      onOk: () => {
        // 检查
        fieldSettingApi.delVariable(item.variableId).then(() => {
          Toast.success({ content: getIn18Text('SHANCHUCHENGGONG') });
          getList();
        });
      },
    });
  };
  const columns: ColumnsType<EdmVariableItem> = [
    {
      title: getIn18Text('MOBANBIANLIANGMINGCHENG'),
      dataIndex: 'variableName',
    },
    {
      title: getIn18Text('CAOZUO'),
      dataIndex: 'variableId',
      render(_, item) {
        return (
          <>
            <a onClick={() => handleEdit(item)}>{getIn18Text('BIANJI')}</a>
            <a onClick={() => handleDelete(item)} style={{ marginLeft: 8 }}>
              {getIn18Text('SHANCHU')}
            </a>
          </>
        );
      },
    },
  ];
  return (
    <PermissionCheckPage resourceLabel="ORG_SETTINGS" accessLabel="EDM_TMPL_VARIABLE_SETTING" menu="ORG_SETTINGS_TMPL_VARIABLE_SETTING">
      <div className={style.pageContainer}>
        <h3 className={style.pageTitle}>
          {getIn18Text('YOUJIANYINGXIAOMOBANBIANLIANG')}
          <Button onClick={handleCreate} type="primary" style={{ float: 'right' }}>
            {getIn18Text('XINJIANBIANLIANG')}
          </Button>
        </h3>
        <Table className="edm-table" columns={columns} dataSource={data} pagination={false} rowKey="variableId" />
        <EditVariableModal
          visible={showModal}
          item={editItem}
          checkConflict={isDuplicateVarName}
          onClose={() => {
            setShowModal(false);
            setEditItem(undefined);
          }}
          onOk={() => {
            setShowModal(false);
            setEditItem(undefined);
            getList();
          }}
        />
      </div>
    </PermissionCheckPage>
  );
};
