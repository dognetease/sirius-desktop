import React, { useEffect, useMemo, useState, useContext } from 'react';
import { message, Modal } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
// import Tabs from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import cloneDeep from 'lodash/cloneDeep';
import { useMount } from 'ahooks';
import { navigate } from '@reach/router';
// import { EnhanceSelect } from '@web-common/components/UI/Select';
import { EnhanceSelect } from '@lingxi-common-component/sirius-ui/Select';
import { apiHolder, apis, FFMSApi, FFMSLevelAdmin, FFMSCustomer, getIn18Text } from 'api';
import { GlobalContext } from '@web-entry-ff/layouts/WmMain/globalProvider';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import Table from './table';
import LevelModal from '../components/addLevelModal';
import AddCustomer from '../components/addCustomer';
import style from './style.module.scss';

const { confirm } = Modal;
const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;

const TAB_TYPE = [
  {
    tab: '客户分类差价',
    key: FFMSLevelAdmin.CUSTOMER_TYPE.TERMINAL_CLIENT,
    dataSource: [] as FFMSCustomer.TypeItem[],
    showDot: false,
  },
  {
    tab: '客户等级差价',
    key: 'CUSTOMER_LEVEL',
    dataSource: [] as FFMSLevelAdmin.ListItem[],
    showDot: false,
  },
  // {
  //   tab: '同行差价',
  //   key: FFMSLevelAdmin.CUSTOMER_TYPE.CO_LOADER,
  //   dataSource: [] as FFMSCustomer.TypeItem[],
  //   showDot: false,
  // },
  // {
  //   tab: '游客差价',
  //   key: FFMSLevelAdmin.CUSTOMER_TYPE.POTENTIAL_CLIENT,
  //   dataSource: [] as FFMSCustomer.TypeItem[],
  //   showDot: false,
  // },
];

const OPTOINS = [
  {
    label: '百分比',
    value: 'PERCENT',
  },
  {
    label: '金额',
    value: 'MONEY',
  },
];
export type activeProps = FFMSLevelAdmin.CUSTOMER_TYPE | 'CUSTOMER_LEVEL';

// Terminal client.同行:CO_LOADER
const PriceManage: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(false);
  const [customerVisible, setCustomerVisible] = useState<boolean>(false);
  const [active, setActive] = useState<activeProps>(FFMSLevelAdmin.CUSTOMER_TYPE.TERMINAL_CLIENT);
  const [typeList, setTypeList] = useState(cloneDeep(TAB_TYPE));
  const [editType, setEditType] = useState<'new' | 'edit'>('new');
  const [customerEditType, setCustomerEditType] = useState<'new' | 'edit'>('new');
  const [customerEditData, setCustomerEditData] = useState<FFMSCustomer.TypeItem[]>([]);
  const [levelId, setLevelId] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [priceType, setPriceType] = useState<string>(OPTOINS[0].value);
  const { state, dispatch } = useContext(GlobalContext);

  const setListData = (content: any, isDot?: boolean) => {
    setTypeList(prevState => {
      if (isDot) {
        (content as FFMSCustomer.CustomerTypeStatusItem[]).forEach(config => {
          prevState.map(typeItem => {
            if (typeItem.key === config.customerType) {
              typeItem.showDot = config.customerTypeConfigStatus !== 'CONFIGURED';
            }
            return typeItem;
          });
        });
      } else {
        prevState.map(item => {
          if (item.key === active) {
            item.dataSource = content;
          }
          return item;
        });
      }
      return [...prevState];
    });
  };

  const getLevleData = () => {
    let params = {
      pageSize: 26,
      page: 1,
    };
    setLoading(true);
    ffmsApi
      .getFfCustomerLevelList(params)
      .then(res => {
        setListData(res?.content || []);
      })
      .finally(() => setLoading(false));
  };

  const getCustomerType = () => {
    setLoading(true);
    let params = { customerType: active as FFMSLevelAdmin.CUSTOMER_TYPE };
    ffmsApi
      .getFfCustomerTypeList(params)
      .then(res => {
        setListData(res?.content || []);
      })
      .finally(() => setLoading(false));
  };

  const dataSource = useMemo(() => {
    return typeList.filter(item => item.key === active)[0].dataSource;
  }, [typeList, active]);

  const onDelete = (levelId: string) => {
    ffmsApi.deleteFfCustomerLevel({ levelIdList: [levelId] }).then(() => {
      message.success('删除成功');
      getLevleData();
    });
  };
  const onCustomerDelete = (id: string) => {
    ffmsApi.deleteFfCustomerType({ customerTypeIdList: [id] }).then(res => {
      message.success('删除成功');
      getCustomerType();
    });
  };

  const onChange = (value: string) => {
    confirm({
      title: '确认修改加价类型?',
      icon: <ExclamationCircleOutlined />,
      // content: '',
      onOk() {
        console.log('OK');
        ffmsApi
          .changeFfmsDiscountType({
            discountType: value as FFMSLevelAdmin.DiscountType['discountType'],
          })
          .then(() => {
            message.success('修改成功');
            setTypeList(cloneDeep(TAB_TYPE));
            getConfigDot(true);
            dispatch({
              type: 'changeDiscountType',
              payload: {
                discountType: value,
              },
            });
          });
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  };

  const getTableData = () => {
    // 缓存，避免重复请求
    let activeItem = typeList.filter(item => item.key === active)[0].dataSource;
    switch (active) {
      case FFMSLevelAdmin.CUSTOMER_TYPE.TERMINAL_CLIENT:
      case FFMSLevelAdmin.CUSTOMER_TYPE.CO_LOADER:
      case FFMSLevelAdmin.CUSTOMER_TYPE.POTENTIAL_CLIENT:
        if (!activeItem.length) {
          getCustomerType();
        }
        break;
      case 'CUSTOMER_LEVEL':
        if (!activeItem.length) {
          getLevleData();
        }
        break;
    }
  };

  const getConfigDot = (first?: boolean) => {
    if (typeList.some(item => item.showDot === true) || first) {
      ffmsApi.getFfmsCustomerConfigType().then(res => {
        setListData(res.configStatusList, true);
      });
    }
  };

  useEffect(() => {
    getTableData();
  }, [active, state?.discountType]);

  useEffect(() => {
    setPriceType(state?.discountType);
  }, [state?.discountType]);

  useMount(() => {
    getConfigDot(true);
  });

  return (
    <div className={style.levleAdmin}>
      <header className={style.levleAdminHeader}>
        <Breadcrumb separator={<SeparatorSvg />}>
          <Breadcrumb.Item
            className={style.breadCrumbItem}
            onClick={() => {
              navigate('#edm?page=customerBookList');
            }}
          >
            {getIn18Text('DINGYUEKEHULIEBIAO')}
          </Breadcrumb.Item>
          <Breadcrumb.Item>差价管理</Breadcrumb.Item>
        </Breadcrumb>
      </header>
      <div className={style.typeSelect}>
        <span className={style.price}>
          各价差按照
          <EnhanceSelect style={{ padding: '0 4px' }} options={OPTOINS} size="small" value={priceType} onChange={onChange} />
          加价
        </span>
      </div>
      <div className={style.levleAdminContent}>
        <Tabs activeKey={active} onChange={key => setActive(key as activeProps)}>
          {typeList.map(item => (
            <Tabs.TabPane tab={<>{item.showDot ? <span className={style.dotTab}>{item.tab}</span> : item.tab}</>} key={item.key}>
              <div className={style.addBtn}>
                {active === FFMSLevelAdmin.CUSTOMER_TYPE.TERMINAL_CLIENT && typeList[0].dataSource.length < 10 ? (
                  <Button
                    btnType="minorLine"
                    className={style.gostBtn}
                    onClick={() => {
                      setCustomerVisible(true);
                      setCustomerEditType('new');
                    }}
                  >
                    添加分类
                  </Button>
                ) : null}
                {active === 'CUSTOMER_LEVEL' ? (
                  <Button
                    btnType="minorLine"
                    className={style.gostBtn}
                    onClick={() => {
                      setVisible(true);
                      setEditType('new');
                      setLevelId('');
                    }}
                  >
                    添加等级
                  </Button>
                ) : null}
              </div>
              <Table
                type={active}
                loading={loading}
                priceType={priceType}
                key={priceType}
                dataSource={item.dataSource}
                onChangeRow={levelId => {
                  setEditType('edit');
                  setLevelId(levelId);
                  setVisible(true);
                }}
                onChangeCustomerRow={id => {
                  setCustomerVisible(true);
                  setCustomerEditType('edit');
                  let editData = (item.dataSource as FFMSCustomer.TypeItem[]).filter(ele => ele.customerTypeId === id);
                  setCustomerEditData(editData);
                }}
                onDelete={onDelete}
                onCustomerDelete={onCustomerDelete}
              />
            </Tabs.TabPane>
          ))}
        </Tabs>
      </div>
      <LevelModal
        type={editType}
        visible={visible}
        levelId={levelId}
        dataSource={dataSource as FFMSLevelAdmin.ListItem[]}
        onSuccess={() => {
          setVisible(false);
          getLevleData();
          getConfigDot();
        }}
        onCancel={() => setVisible(false)}
      />
      <AddCustomer
        type={customerEditType}
        customerType={active as FFMSLevelAdmin.CUSTOMER_TYPE}
        customerTypeList={customerEditData}
        visible={customerVisible}
        accountId=""
        onSuccess={() => {
          setCustomerVisible(false);
          getCustomerType();
          getConfigDot();
        }}
        onCancel={() => setCustomerVisible(false)}
      />
    </div>
  );
};
export default PriceManage;
