import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Checkbox, Skeleton } from 'antd';
import Table, { ColumnsType } from 'antd/lib/table';
import { api, apis, CustomerApi, EdmMailRule } from 'api';
import classnames from 'classnames';
import style from './index.module.scss';
import { EditRuleModal } from './EditRuleModal';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { getIn18Text } from 'api';
const customerApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
export const MailTagSetting = () => {
  const [editItem, setEditItem] = useState<EdmMailRule>();
  const [data, setData] = useState<EdmMailRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fetchData = () => {
    setLoading(true);
    customerApi
      .getRuleList()
      .then(res => setData(res.items))
      .finally(() => {
        setLoading(false);
      });
  };
  const handleEdit = useCallback(
    (item: EdmMailRule) => {
      setEditItem(item);
      setShowModal(true);
    },
    [setEditItem]
  );
  const handleDelete = useCallback((item: EdmMailRule) => {
    customerApi.deleteRule([item.rule_id]).then(() => {
      fetchData();
    });
  }, []);
  const handleModalOk = () => {
    setEditItem(undefined);
    setShowModal(false);
    fetchData();
  };
  const handleCreate = useCallback(() => {
    setEditItem(undefined);
    setShowModal(true);
  }, [setShowModal]);
  useEffect(fetchData, []);
  const columns: ColumnsType<EdmMailRule> = [
    {
      title: getIn18Text('BIAOQIANMINGCHENG'),
      dataIndex: 'id',
      render(_, field) {
        return field.labels?.length ? field.labels[0].name : '-';
      },
    },
    {
      title: getIn18Text('TIAOJIAN'),
      dataIndex: 'condictions',
      render(condictions, item) {
        return <RenderCondition item={item} />;
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 120,
      render(_, field) {
        return (
          <>
            <a onClick={() => handleEdit(field)}>{getIn18Text('BIANJI')}</a>
            <a onClick={() => handleDelete(field)} style={{ marginLeft: 8 }}>
              {getIn18Text('SHANCHU')}
            </a>
          </>
        );
      },
    },
  ];
  return (
    <PermissionCheckPage resourceLabel="ORG_SETTINGS" accessLabel="CONTACT_AI_TAG_SETTING" menu="ORG_SETTINGS_AI_TAG_SETTING">
      <div className={style.pageContainer}>
        <h3 className={style.pageTitle}>
          {getIn18Text('YOUJIANZHINENGBIAOQIAN')}
          <Button onClick={handleCreate} type="primary" style={{ float: 'right' }}>
            {getIn18Text('XINJIANBIAOQIAN')}
          </Button>
        </h3>
        <p className={style.subtitle}>
          {getIn18Text('QIYEJIBIAOQIANGUIZE\uFF0CKETONGGUOYOUJIANZHUTI\u3001YOUJIANFUJIANBIAOTISHEZHIGUANJIANCIPIPEIGUIZE\uFF0CZIDONGGEIYOUJIANDABIAOQIAN\u3002')}
        </p>
        <Skeleton loading={loading} active>
          <div>
            {/* <Checkbox>启用</Checkbox> */}
            <Table className={classnames('edm-table', style.fieldTable)} columns={columns} rowKey="id" pagination={false} dataSource={data} />
          </div>
          <EditRuleModal item={editItem} visible={showModal} onClose={() => setShowModal(false)} onOk={handleModalOk} />
        </Skeleton>
      </div>
    </PermissionCheckPage>
  );
};
const mapField: Record<string, string> = {
  subject: '[主题]',
};
const mapOperator: Record<string, string> = {
  contains: getIn18Text('BAOHAN'),
};
const RenderCondition = (props: { item: EdmMailRule }) => {
  const { condictions } = props.item;
  const flagOperatorOr = useMemo(() => (condictions.some(item => item.flagOperatorOr) ? getIn18Text('HUO') : getIn18Text('QIE')), [condictions]);
  return (
    <div className={style.ruleContent}>
      {condictions.map((item, index) => (
        <>
          {index !== 0 && flagOperatorOr}
          <span>
            {mapField[item.field]} {mapOperator[item.operator]}
          </span>
          {item.operand.map(i => (
            <span className={classnames(style[item.field])}>{i}</span>
          ))}
        </>
      ))}
    </div>
  );
};
