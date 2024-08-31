/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Popover, Spin, Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
// eslint-disable-next-line import/no-extraneous-dependencies
import { navigate } from '@reach/router';
import { api, apis, BaseInfoRes, CustomerApi, DMObjectField, FieldItem, FieldSettingApi, LoadOperation, ResParsedTable } from 'api';
import { useAppSelector } from '@web-common/state/createStore';
import { getIsSomeMenuVisbleSelector, getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import { ReactComponent as ErrorIcon } from '@/images/icons/edm/map_status_error.svg';
import { ReactComponent as SuccessIcon } from '@/images/icons/edm/map_status_success.svg';
import { ReactComponent as DocumentIcon } from '@/images/icons/edm/document-icon.svg';
import { customerContext } from '../customerContext';
import { numberToExcelColumn } from './utils';
import { EditFieldModal } from '../../EnterpriseSetting/fieldSetting/EditFieldModal';
// import style from './dataTransfer.module.scss';
import { getIn18Text } from 'api';
export interface TableMappingProps {
  parsedTable: ResParsedTable;
  mapTables: string[]; // 'customer', 'contact', 'bussiness'
  sessionId: string;
  selectedField: Record<string, boolean>;
  onChange?: (data: RowData[]) => void;
  multiFile?: boolean;
  updateBaseInfo: () => void;
  initMapping?: Record<string, RowData>;
}
export interface RowData {
  field_name: string;
  field_number: string;
  parse_value?: string;
  mapStatus?: string;
  object_code?: string;
  mapping_field_code?: string;
  default_value?: string;
  _cancelKey?: string;
  support_custom?: boolean;
}
export enum MapStatus {
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}
export const mapTableName: Record<string, string> = {
  CUSTOMER: getIn18Text('KEHU'),
  CONTACT: getIn18Text('LIANXIREN'),
  BUSINESS: getIn18Text('SHANGJI'),
};
interface FieldOptions {
  [key: string]: Array<{
    value: string;
    label: string;
    required?: boolean;
    support_custom?: boolean;
  }>;
}
function toLine(name: string) {
  return name.replace(/([A-Z])/g, '_$1').toLowerCase();
}
const customerApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const fieldSettingApi = api.requireLogicalApi(apis.fieldSettingApiImpl) as FieldSettingApi;
const cachedCancelHandler: Record<string, (k: LoadOperation) => void> = {};
export const TableMapping = (props: TableMappingProps) => {
  const { parsedTable, mapTables, sessionId, onChange, multiFile, selectedField, initMapping } = props;
  const fileNameRef = useRef('');
  const [data, setData] = useState<RowData[]>([]);
  const tableOptions = useMemo(() => mapTables.map(t => ({ label: mapTableName[t], value: t })), [mapTables]);
  const [fieldOptions, setFeildOptions] = useState<FieldOptions>();
  const [codeToFieldMap, setCodeToFieldMap] = useState<{
    [key: string]: DMObjectField;
  }>({});
  const { state } = useContext(customerContext).value;
  const [fieldSettingOptions, setFieldSettingOptions] = useState<{
    field: FieldItem;
    item: RowData;
  }>();
  const hasFieldSettingPrivilege = useAppSelector(gState => getModuleAccessSelector(gState.privilegeReducer, 'ORG_SETTINGS', 'CONTACT_FIELD_SETTING'));
  const fieldSettingMenuVisible = useAppSelector(gState => getIsSomeMenuVisbleSelector(gState.privilegeReducer, ['ORG_SETTINGS_FIELD_SETTING']));
  useEffect(() => {
    const tmp: RowData[] = parsedTable.field_list.map(field => {
      let mapping = initMapping ? initMapping[field.field_number] : {};
      mapping = mapping || {};
      return {
        ...field,
        mapStatus: '',
        ...mapping,
        field_name: field.field_name,
      };
    });
    setData(tmp);
    // if (parsedTable.file_name === fileNameRef.current) {
    //   // 同一个文件，保留上次选中映射
    //   setData(prev => {
    //     // const ret = [];
    //     console.log('tableMapping', prev, tmp);
    //     if (prev.length === tmp.length && prev.every((r, idx) => r.field_name === tmp[idx].field_name)) {
    //       return prev;
    //     }
    //     return tmp;
    //   });
    // } else {
    //   setData(tmp);
    // }
    fileNameRef.current = parsedTable.file_name;
  }, [parsedTable, initMapping]);
  useEffect(() => {
    onChange && onChange(data);
  }, [data]);
  useEffect(() => {
    customerApi.getObjectFields(!!multiFile).then(fields => {
      const options: FieldOptions = {};
      const map: {
        [key: string]: DMObjectField;
      } = {};
      Object.keys(fields).forEach(key => {
        options[key] = fields[key].map(i => {
          const option = {
            label: i.name,
            value: i.code,
            required: i.essential,
            support_custom: i.support_custom,
          };
          map[i.code] = i;
          return option;
        });
      });
      setFeildOptions(options);
      setCodeToFieldMap(map);
    });
  }, [data]);
  const checkMappingValid = (item: RowData) => {
    item.mapStatus = MapStatus.Loading;
    customerApi
      .validDMFields(
        {
          file_name: parsedTable.file_name,
          mapping_field_code: item.mapping_field_code!,
          object_code: item.object_code!,
          origin_column_number: item.field_number,
          session_id: sessionId,
        },
        {
          operator: handler => {
            const key = [item.field_number, item.mapping_field_code, item.object_code].join('-');
            item._cancelKey = key;
            cachedCancelHandler[key] = handler;
          },
        }
      )
      .then(ret => {
        item.mapStatus = ret ? MapStatus.Success : MapStatus.Error;
        setData([...data]);
      });
    setData([...data]);
  };
  const cancelCheck = (item: RowData, status?: MapStatus) => {
    const handler = cachedCancelHandler[item._cancelKey || ''];
    item._cancelKey = undefined;
    handler && handler('abort');
    if (status) {
      item.mapStatus = status;
    }
  };
  const handleMapTableChange = (item: RowData, tableName?: string) => {
    item.object_code = tableName;
    item.mapping_field_code = undefined;
    item.mapStatus = undefined;
    item.default_value = undefined;
    cancelCheck(item);
    setData([...data]);
  };
  const handleMapFieldChange = (item: RowData, fieldCode?: string) => {
    item.mapping_field_code = fieldCode;
    item.default_value = undefined;
    if (item.object_code && fieldOptions) {
      const option = fieldOptions[item.object_code].find(option => option.value === fieldCode);
      if (option) {
        item.support_custom = Boolean(option.support_custom);
      }
    }
    cancelCheck(item);
    if (fieldCode !== undefined) {
      const field = codeToFieldMap[fieldCode];
      // 取消验证
      if (field.enum_flag === true) {
        // 发请求验证状态
        checkMappingValid(item);
      } else {
        item.mapStatus = MapStatus.Success;
      }
    } else {
      item.mapStatus = undefined;
    }
    setData([...data]);
  };
  const handleEditField = (item: RowData) => {
    const map: Record<string, string> = {
      company_level: 'companyLevel',
      company_source: 'companySource',
      intent: 'intent',
      require_product_type: 'companyRequireProductType',
      product_require_level: 'companyProductRequireLevel',
      purchase_amount: 'purchaseAmount',
      scale: 'scale',
      main_industry: 'mainIndustry',
    };
    const fieldLabel = item.mapping_field_code;
    fieldSettingApi.getList().then(res => {
      const table = res.find(i => i.part_name === 'customer');
      const field = table?.field_list.find(i => i.field_name === fieldLabel || map[i.field_name] === fieldLabel);
      if (field) setFieldSettingOptions({ field, item });
    });
  };
  const handleEditFieldOk = (item?: RowData) => {
    item && checkMappingValid(item);
    setFieldSettingOptions(undefined);
  };
  const handleMapDefaultValue = (item: RowData, v?: string) => {
    item.default_value = v;
    cancelCheck(item, MapStatus.Success);
    setData([...data]);
  };
  const renderErrorStatusTip = useCallback(
    (field: RowData) => (
      <ul>
        {field.support_custom && (
          <li style={{ marginBottom: 4 }}>
            {getIn18Text('ZIDUANZHIBUPIPEI\uFF0C')}
            {hasFieldSettingPrivilege && fieldSettingMenuVisible && getIn18Text('KELIANXIGUANLIYUAN\uFF0C')}
            {getIn18Text('ZAIQIYESHEZHI - ZIDUANSHEZHIJINXINGSHEZHI\u3002')}
            {hasFieldSettingPrivilege && fieldSettingMenuVisible && <a onClick={() => handleEditField(field)}>{getIn18Text('QUSHEZHI')}</a>}
          </li>
        )}
        <li>{getIn18Text('KEXUANZEMORENTIANCHONGZHI\uFF0CBIANWEIZHENGQUEZHUANGTAI\u3002XUANZEHOU\uFF0CBENZIDUANSUOYOUBUPIPEIDESHUJUHUITIHUANWEIMORENZHI\u3002')}</li>
      </ul>
    ),
    [hasFieldSettingPrivilege, fieldSettingMenuVisible]
  );
  const columns: ColumnsType<RowData> = [
    {
      key: 'field_number',
      dataIndex: 'field_number',
      title: getIn18Text('LIEXUHAO'),
      width: 80,
      render(num) {
        return numberToExcelColumn(num + 1);
      },
    },
    {
      key: 'field_name',
      dataIndex: 'field_name',
      title: getIn18Text('BIAOTOUZIDUAN'),
    },
    {
      key: 'parse_value',
      dataIndex: 'parse_value',
      title: getIn18Text('YULANZHI'),
      ellipsis: true,
      render(v: string[]) {
        return v.map(s => (
          <span title={s}>
            {s}
            <br />
          </span>
        ));
      },
    },
    {
      key: 'mapStatus',
      dataIndex: 'mapStatus',
      width: 64,
      title: getIn18Text('YINGSHE'),
      render(mapStatus: MapStatus | undefined, field) {
        switch (mapStatus) {
          case MapStatus.Loading:
            return <Spin />;
          case MapStatus.Success:
            return <SuccessIcon />;
          case MapStatus.Error:
            return (
              <Popover
                overlayStyle={{ width: 346 }}
                content={renderErrorStatusTip(field)}
                title={getIn18Text('CUOWUTISHI')}
                overlayClassName="waimao-popover"
                getPopupContainer={() => document.getElementById('data-transfer-root')!}
                zIndex={1}
              >
                <ErrorIcon />
              </Popover>
            );
          default:
            return null;
        }
      },
    },
    {
      key: 'object_code',
      dataIndex: 'object_code',
      title: getIn18Text('DUIXIANGYUGUANLIAN'),
      render(_: string, field) {
        return (
          <Select
            style={{ width: '100%' }}
            placeholder={getIn18Text('XUANZEDUIXIANG')}
            options={tableOptions}
            value={field.object_code}
            onChange={v => handleMapTableChange(field, v as string)}
            getPopupContainer={triggerNode => triggerNode.parentNode}
            suffixIcon={<DownTriangle />}
            allowClear
          />
        );
      },
    },
    {
      key: 'mapField',
      title: getIn18Text('ZIDUAN'),
      render(mapField: string | undefined, item) {
        if (!item.object_code || !fieldOptions) {
          return null;
        }
        return (
          <Select
            style={{ width: '100%' }}
            placeholder={getIn18Text('XUANZEZIDUAN')}
            value={item.mapping_field_code}
            onChange={v => handleMapFieldChange(item, v as string)}
            getPopupContainer={triggerNode => triggerNode.parentNode}
            suffixIcon={<DownTriangle />}
            allowClear
          >
            {fieldOptions[item.object_code].map(option => (
              <Select.Option key={option.value} value={option.value} disabled={selectedField[item.object_code + '_' + option.value]}>
                {option.required ? <span style={{ color: '#f5222d', marginRight: 4 }}>*</span> : null}
                {option.label}
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      key: 'default_value',
      dataIndex: 'default_value',
      title: getIn18Text('MORENZHI'),
      render(value: string, item) {
        if (!item.mapping_field_code) {
          return '-';
        }
        const field = codeToFieldMap[item.mapping_field_code];
        if (!field || !field.enum_flag) {
          return '-';
        }
        const options: any[] = state.baseSelect[toLine(item.mapping_field_code) as keyof BaseInfoRes];
        return (
          <Select
            placeholder={getIn18Text('XUANZEMORENZHI')}
            options={options}
            style={{ width: '100%' }}
            value={item.default_value}
            onChange={v => handleMapDefaultValue(item, v as string)}
            allowClear
            suffixIcon={<DownTriangle />}
          />
        );
      },
    },
  ];
  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ color: '#7A8599' }}>
        <DocumentIcon style={{ marginRight: 4, verticalAlign: '-3px' }} />
        {getIn18Text('WENJIAN\uFF1A')}
        {parsedTable.file_name}
      </p>
      <Table tableLayout="fixed" className="waimao-table" rowKey="field_number" columns={columns} dataSource={data} pagination={false} />
      <EditFieldModal
        visible={fieldSettingOptions !== undefined}
        item={fieldSettingOptions?.field}
        onClose={() => setFieldSettingOptions(undefined)}
        onOk={() => {
          handleEditFieldOk(fieldSettingOptions?.item);
          props.updateBaseInfo();
        }}
      />
    </div>
  );
};
