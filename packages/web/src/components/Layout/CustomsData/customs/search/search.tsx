/**
 * @deprecated !!!此文件为原海关 采购/供应 的筛选和高级筛选部分 弃用
 */
import React, { useEffect, useState, useImperativeHandle, useRef, useMemo, useCallback } from 'react';
import style from './search.module.scss';
import { Form, Checkbox, Input, Switch, Button, Tabs, FormInstance, Tooltip } from 'antd';
import moment, { Moment } from 'moment';
import classnames from 'classnames';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import { customsDataTracker, CustomsDataSelectClick } from '../../tracker/tracker';
import { customsDataType, DataStoreApi, reqBuyers, resCustomsFollowCountry, resCustomsStateCountry as countryItemType } from 'api';
import { cloneDeep } from 'lodash';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { Menu as CountryBox } from './searchCountry/Menu';
import { flattenTree, hasChildChecked, hasParentChecked, reconcile } from './searchCountry/utils';
import { All, TreeNode } from './searchCountry/type';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import omit from 'lodash/omit';
import { FilterResultType, RegionType, searchParamPro } from '../customs';
import { ReactComponent as Help } from '@/images/icons/customs/help.svg';
import { ReactComponent as AddFollow } from '@/images/icons/customs/add-follow.svg';
import { apiHolder, apis, EdmCustomsApi } from 'api';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import NationFlag from '../../components/NationalFlag';
import NationModal from '../followNation/nationModal/nationModal';
import EditFollowModal from '../followNation/editFollowModal/editFollowModal';
import { useSyncCallback } from '../hooks/useSyncCallback';
import useLangOption from './useLangOption';
import { getIn18Text } from 'api';
import { useCustomsCountryHook } from '../docSearch/component/CountryList/customsCountryHook';
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
interface countryItem {
  label: string;
  code: string;
}
interface areaItem {
  label: string;
  value: boolean;
}
export enum FilterResultState {
  Country = 'country',
  TimeFilter = 'timeFilter',
  ContainsExpress = 'containsExpress',
  OnlyContainsChina = 'onlyContainsChina',
}
type otherValType = {
  countryVal: string[];
  onlyContainsChina: boolean;
};
type serarchParam = Partial<reqBuyers> & otherValType;
interface Props {
  className?: string;
  placeholder?: string;
  index?: number;
  onSearch: (param: searchParamPro) => void;
  initLayout?: boolean;
  baseCountry: countryItemType[];
  defaultCountryList: string[];
  allCountry: countryItem[];
  companyType: string;
  setFilterResData: (param: FilterResultType[]) => void;
  countryProp: resCustomsFollowCountry[];
  initTimeFilter?: string;
  tabValue?: customsDataType;
  query?: string;
}
const timeRange = [
  {
    value: 'all',
    label: getIn18Text('SUOYOU'),
  },
  {
    value: 'last_five_year',
    label: getIn18Text('JINWUNIAN'),
  },
  {
    value: 'last_three_year',
    label: getIn18Text('JINSANNIAN'),
  },
  {
    value: 'last_two_year',
    label: getIn18Text('JINLIANGNIAN'),
  },
  {
    value: 'last_one_year',
    label: getIn18Text('JINYINIAN'),
  },
  {
    value: 'last_half_year',
    label: getIn18Text('JINBANNIAN'),
  },
  {
    value: 'recent_quarter',
    label: getIn18Text('JINYIGEJIDU'),
  },
];
export interface CtxType {
  menuData: TreeNode[][];
  handleSelectChange: (node: TreeNode, checked: boolean) => void;
  value: string[];
  flattenData: TreeNode[];
  drawerForm: FormInstance;
  showCheckboxNode: (node: TreeNode, checked: boolean) => void;
}
const DEFAULT_TAB_KEY = 'default_tab_key';
export interface searchData {
  relationCountryList: string[]; // 供应来源
  timeFilter: string; // 时间范围
  containsExpress: boolean; // 排除物流公司
  countryVal: string[]; // 国家地区
  productDetail: string; // 产品名称
  hsCode: string; // hsCode
}
// @ts-ignore
export const CustomsCtx = React.createContext<CtxType>({});
const content = (
  <span>
    <>{getIn18Text('HUIGUOLVGONGSIMINGCHENGHANGUANJIANCI\uFF1AExpress\u3001UPS\u3001')}</>
    <>Fedex、DHL、Maersk、Nippon Express、</>
    <>Ryder System 、TNT Post、Expeditors、Panalpina</>
  </span>
);
const CustomsSearch = React.forwardRef(
  ({ query, tabValue, setFilterResData, companyType, onSearch, baseCountry, allCountry, defaultCountryList, initTimeFilter, countryProp = [] }: Props, ref) => {
    const [form] = Form.useForm();
    const [filterBoxForm] = Form.useForm();
    const [nationList, setNationList] = useState<resCustomsFollowCountry[]>([]);
    const [countryVal, setValue] = useState<string[]>([]);
    const [regionHalfCheck, setHalfCheckRegion] = useState<boolean>();
    const [allCheckRegion, setAllCheckRegion] = useState<boolean>();
    const [searchVal, setSearchVal] = useState<serarchParam>({});
    const filterResData = useRef<FilterResultType[]>([]); // 保存历史的筛选项
    const [currentChangeValue, setCurrentChangeValues] = useState<string[]>([]);
    const [changeStatus, setChangeStatus] = useState<boolean>(false);
    const changeValue = useRef<string[]>([]);
    const [defaultKey, setDefaultKey] = useState('');
    const [flattenData, setFlattenData] = useState(() => {
      return flattenTree([
        {
          state: All,
          code: All,
          parent: null,
          countries: baseCountry,
        },
      ]);
    });
    const [visible, setVisible] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [menuData, setMenuData] = useState(() => {
      if (flattenData.length === 1) {
        return [];
      }
      return flattenData[0].countries;
    });
    useEffect(() => {
      setFlattenData(() => {
        return flattenTree([
          {
            state: All,
            code: All,
            parent: null,
            countries: baseCountry,
          },
        ]);
      });
    }, [baseCountry]);
    useEffect(() => {
      setMenuData(() => {
        if (flattenData.length === 1) {
          return [];
        }
        return flattenData[0].countries;
      });
    }, [flattenData]);
    // 从首页点击国家相关状态处理
    useEffect(() => {
      console.log('useEffect-isInitProps');
      // 高级筛选选中
      flattenData
        .filter(item => countryProp.map(i => i.code).includes(item.code))
        .forEach(node => {
          handleSelectChange(node, true);
        });
      if (countryProp.length) {
        // 普通筛选
        setAllCheckRegion(false);
        setHalfCheckRegion(true);
      }
      // 筛选结果
      const resValue = countryProp.map(item => ({ countryName: item.countryChinese.split('-')[1], countryCode: item.code }));
      const country = {
        name: getIn18Text('GUOJIA/DEQU'),
        code: FilterResultState.Country,
        value: resValue,
      };
      filterResData.current = [country];
      setFilterResData(filterResData.current);
      // 其他国家
      form.setFieldsValue({ otherCountry: countryProp.map(i => i.code) });
      // 处理默认值的情况
      menuData?.forEach(it => {
        it?.countries?.forEach(x => {
          if (x.code === countryProp[0]?.code) {
            console.log('countryProp: ', countryProp);
            x.showBox = true;
          }
        });
      });
      console.log('handleSelectChange-newData: ', menuData);
      setMenuData(menuData);
    }, [flattenData]);
    const handleSelectChange = useCallback(
      (item: TreeNode, checked: boolean) => {
        // setChangeStatus(true)
        setValue(prevValue => {
          const val = reconcile(item, checked, prevValue);
          console.log('handleSelectChange-item: ', val, item, checked);
          return val;
        });
      },
      [flattenData]
    );
    const showCheckboxNode = useCallback(
      (item: TreeNode, checked: boolean) => {
        menuData?.forEach(it => {
          it?.countries?.forEach(x => {
            if (x.code === item.code) {
              x.showBox = checked;
            }
          });
        });
        setMenuData(menuData);
        setChangeStatus(true);
      },
      [flattenData]
    );
    // 从国家选中值转换为接口参数
    const transformCountryValue = (countryVal: string[]) => {
      if (!Array.isArray(countryVal)) return { cList: [], _cList: [] };
      if (countryVal.length === 0) return { cList: [], _cList: [] };
      let cList: string[] = [];
      let _cList: string[] = [];
      if (countryVal.includes(All)) {
        const _countryList = flattenData
          .find(i => i.code === All)
          ?.countries?.filter(f => f.code !== getIn18Text('QITAGUOJIADEQU'))
          .map(m => {
            return m.countries?.map(c => c.code);
          }) as string[][];
        cList = [..._countryList?.flat(), 'OTHER-COUNTRY'];
        _cList = [..._countryList?.flat(), getIn18Text('QITAGUOJIADEQU')];
      } else if (countryVal.length !== 0) {
        // 部分选中
        const newData = countryVal.map(c => {
          const lve = flattenData.filter(k => k.code !== getIn18Text('QITAGUOJIADEQU')).find(f => f.code === c)?.countries || [];
          const finalCode = lve.length > 0 ? lve.map(m => m.code) : flattenData.find(f => f.code === c)?.code;
          return finalCode;
        }) as string[][];
        if (countryVal.includes(getIn18Text('QITAGUOJIADEQU'))) {
          const _newData = newData.flat();
          cList = [..._newData.filter(f => f !== getIn18Text('QITAGUOJIADEQU')), 'OTHER-COUNTRY'];
          _cList = [..._newData.filter(f => f !== getIn18Text('QITAGUOJIADEQU')), getIn18Text('QITAGUOJIADEQU')];
        } else {
          cList = newData.flat();
          _cList = [...newData.flat()];
        }
      }
      return { cList, _cList };
    };
    const handleChangeAll = useCallback(
      (event: CheckboxChangeEvent) => {
        console.log('flattenData', flattenData);
        const { checked } = event.target;
        handleSelectChange(flattenData[0], checked);
        const otherCode = flattenData[0]?.countries?.find(item => item.code === getIn18Text('QITAGUOJIADEQU'))?.countries?.map(m => m.code);
        if (checked) form.setFieldsValue({ otherCountry: otherCode });
        else form.setFieldsValue({ otherCountry: [] });
        setChangeStatus(true);
        menuData?.forEach(it => {
          it?.countries?.forEach(x => {
            x.showBox = checked;
          });
        });
        setMenuData(menuData);
      },
      [flattenData]
    );
    const onDrawerTabChange = (key: string) => {
      dataStoreApi.putSync(DEFAULT_TAB_KEY, JSON.stringify(key), {
        noneUserRelated: false,
      });
      setDefaultKey(key);
    };
    useEffect(() => {
      const { data } = dataStoreApi.getSync(DEFAULT_TAB_KEY);
      if (data) {
        setDefaultKey(JSON.parse(data));
      } else setDefaultKey('1');
    }, []);
    const checkedAll = hasParentChecked(flattenData[0], countryVal);
    const indeterminateAll = !checkedAll && hasChildChecked(flattenData[0], countryVal);
    const [baseCheckedList, setBaseCheckedList] = useState<countryItemType[]>(() => cloneDeep(baseCountry));
    const [countryCheckedList, setCountryCheckedList] = useState<string[]>(() => cloneDeep(defaultCountryList));
    const [isInit, setIsInit] = useState<boolean>(true);
    const [isExpand, setIsExpand] = useState<boolean>(false);
    const [expandDelay, setExpandDelay] = useState<boolean>(false);
    const [country, setCountry] = useState<
      {
        label: string;
        code: string;
      }[]
    >(() => allCountry);
    const [serarchParam, setSerarchParam] = useState<serarchParam>(() => {
      return {
        containsExpress: true,
        countryList: [...defaultCountryList, 'OTHER-COUNTRY'],
        relationCountryList: [],
        timeFilter: initTimeFilter,
      };
    });
    const [drawerVisible, setDrawerVisible] = useState(false);
    useEffect(() => {
      if (allCountry) {
        setCountry(allCountry);
      }
    }, [allCountry]);
    useEffect(() => {
      setSerarchParam({
        ...serarchParam,
        countryList: defaultCountryList,
      });
    }, [defaultCountryList]);
    useEffect(() => {
      if (isExpand) {
        let timer = setTimeout(() => {
          setExpandDelay(isExpand);
          clearTimeout(timer);
        }, 500);
      } else {
        setExpandDelay(isExpand);
      }
    }, [isExpand]);
    useEffect(() => {
      setBaseCheckedList(cloneDeep(baseCountry));
    }, []);
    // 参数整理，数据变更交给上层发起请求
    const updateSearchVal = (params: serarchParam) => {
      const newVal = {
        ...omit(params, ['countryVal']),
        countryList: [...transformCountryValue(countryVal).cList, ...followCountryCheckedList],
        containsExpress: !params.containsExpress,
      } as serarchParam;
      console.log('updateSearchVal-newVal: ', newVal, params);
      onSearch(newVal);
    };
    const updateFilterArea = (data: serarchParam) => {
      console.log('updateFilterBox-data: ', data);
      const { countryVal = [] } = data;
      // 国家地区
      updateCheckbox(countryVal);
      const values = filterBoxForm.getFieldsValue();
      const { timeFilter = initTimeFilter, containsExpress, onlyContainsChina } = data;
      filterBoxForm.setFieldsValue({ timeFilter, containsExpress, onlyContainsChina });
      // form.setFieldsValue(values)
      console.log('updateFilterBox-values: ', values);
    };
    // 更新筛选条件国家地区状态
    const updateCheckbox = (countryVal: string[]) => {
      if (countryVal.includes(All)) {
        setAllCheckRegion(true);
        setHalfCheckRegion(false);
      } else if (countryVal.length === 0) {
        setAllCheckRegion(false);
        setHalfCheckRegion(false);
      } else {
        setAllCheckRegion(false);
        setHalfCheckRegion(true);
      }
    };
    const updateSeniorFilter = (data: serarchParam) => {
      console.log('updateSeniorFilter-data: ', data);
      const { countryVal = [], timeFilter = initTimeFilter, containsExpress, onlyContainsChina } = data;
      if (countryVal.length === 0) {
        // handleSelectChange(flattenData[0], false)
        flattenData
          .filter(item => countryVal.includes(item.code))
          .forEach(node => {
            handleSelectChange(node, false);
          });
      }
      form.setFieldsValue({ timeFilter, containsExpress, onlyContainsChina });
    };
    const updateFilterResult = (data: serarchParam) => {
      const { countryVal, timeFilter = 'last_half_year', containsExpress, onlyContainsChina } = data;
      const _value = flattenData
        .filter(item => transformCountryValue(countryVal)._cList.includes(item.code))
        .map(item => ({
          countryName: item.label.includes('-') ? item.label.split('-')?.[1] : item.label,
          countryCode: item.code,
        }));
      console.log('updateFilterResult-data: ', data, _value, filterResData.current);
      let preState = filterResData.current.filter(item => item.code !== FilterResultState.Country);
      const country = { name: getIn18Text('GUOJIA/DEQU'), code: FilterResultState.Country, value: _value };
      let result: FilterResultType[] = [];
      if (currentChangeValue.includes('timeFilter')) {
        result.push({
          name: getIn18Text('SHIJIANFANWEI'),
          code: 'timeFilter',
          value: timeRange.find(item => item.value === timeFilter)?.label || getIn18Text('SUOYOU'),
        });
        preState = preState.filter(item => item.code !== 'timeFilter');
      }
      if (currentChangeValue.includes('containsExpress')) {
        if (containsExpress) {
          result.push({
            name: getIn18Text('PAICHUWULIUGONGSI'),
            code: 'containsExpress',
            value: getIn18Text('SHI'),
          });
        }
        preState = preState.filter(item => item.code !== 'containsExpress');
      }
      if (currentChangeValue.includes('onlyContainsChina')) {
        if (onlyContainsChina) {
          result.push({
            name: `${companyType === 'suppliers' ? getIn18Text('GONGYINGMUDE') : getIn18Text('CAIGOULAIYUAN')}`,
            code: 'onlyContainsChina',
            value: `仅显示有${companyType === 'suppliers' ? getIn18Text('GONGYINGMUDE') : getIn18Text('CAIGOULAIYUAN')}中国的`,
          });
        }
        preState = preState.filter(item => item.code !== 'onlyContainsChina');
        console.log('updateFilterResult-preState: ', preState);
      }
      // 导致 valuesChange ：点筛选框、点筛选结果、高级筛选
      filterResData.current = [...preState, country, ...result];
      console.log('updateFilterResult_value: ', filterResData.current, changeValue);
      setFilterResData(filterResData.current);
    };
    const deleteAllFilter = () => {
      // handleSelectChange(flattenData[0], false)
      flattenData
        .filter(item => countryVal.includes(item.code))
        .forEach(node => {
          handleSelectChange(node, false);
        });
      form.resetFields();
      filterBoxForm.resetFields();
      // @ts-ignore
      // 下面的setSearchVal就会触发onSearch，这里不用手动触发了 否则会触发两次
      // onSearch({
      //   onlyContainsChina: false,
      //   containsExpress: false,
      //   timeFilter: initTimeFilter,
      //   countryList: []
      // });
      filterResData.current = [];
      setSearchVal({} as serarchParam);
      setFilterResData([]);
      setCurrentChangeValues([]);
      setHalfCheckRegion(false);
      setAllCheckRegion(false);
      // 全部国家不展示checkbox
      menuData?.forEach(it => {
        it?.countries?.forEach(x => {
          x.showBox = false;
        });
      });
      // 其他国家和地区
      form.setFieldsValue({ otherCountry: [] });
      console.log('deleteAllFilter-filterResData: ', filterResData.current);
    };
    const [followCountryCheckedList, setCheckedList] = useState<string[]>([]);

    useImperativeHandle(
      ref,
      () => ({
        serarchParam: serarchParam,
        deleteOneFilter,
        deleteAllFilter,
        getCountryList: () => transformCountryValue(Array.from(new Set([...countryVal, ...followCountryCheckedList]))).cList,
      }),
      [followCountryCheckedList, countryVal]
    );
    const onChange = () => {
      let _value: RegionType[];
      setCurrentChangeValues(['country']);
      console.log('onChange-countryVal', countryVal);
      let _searchData: string[] = [];
      const otherCode = flattenData[0]?.countries?.find(item => item.code === getIn18Text('QITAGUOJIADEQU'))?.countries?.map(m => m.code);
      if (!allCheckRegion || (allCheckRegion && regionHalfCheck)) {
        // no && half
        setAllCheckRegion(true);
        setHalfCheckRegion(false);
        _value = flattenData
          .filter(item => transformCountryValue([All])._cList.includes(item.code))
          .map(item => ({
            countryName: item.label,
            countryCode: item.code,
          }));
        _searchData = transformCountryValue([All]).cList;
        handleSelectChange(flattenData[0], true); // 同步高级筛选
        menuData?.forEach(it => {
          it?.countries?.forEach(x => {
            x.showBox = true;
          });
        });
        // 其他国家和地区
        form.setFieldsValue({ otherCountry: otherCode });
      } else {
        // all
        setAllCheckRegion(false);
        setHalfCheckRegion(false);
        _value = [];
        // handleSelectChange(flattenData[0], false)
        flattenData
          .filter(item => countryVal.includes(item.code))
          .forEach(node => {
            handleSelectChange(node, false);
          });
        _searchData = transformCountryValue([]).cList;
        setSearchVal(state => ({
          ...state,
          countryVal: [],
        }));
        menuData?.forEach(it => {
          it?.countries?.forEach(x => {
            x.showBox = false;
          });
        });
        // 其他国家和地区
        form.setFieldsValue({ otherCountry: [] });
      }
      setMenuData(menuData);
      const ret = [{ name: getIn18Text('GUOJIA/DEQU'), code: FilterResultState.Country, value: _value }];
      console.log('onChange-ret: ', ret, _searchData);
      filterResData.current = [...filterResData.current.filter(item => item.code !== FilterResultState.Country), ...ret];
      setFilterResData(filterResData.current); // 同步筛选项
      const newVal = {
        ...omit(searchVal, ['countryVal']),
        countryList: _searchData,
      } as serarchParam;
      onSearch(newVal);
    };
    // 筛选区域
    const handleFilterBox = (values: any) => {
      const { containsExpress, timeFilter, onlyContainsChina, otherGoodsShipped } = values;
      if (otherGoodsShipped) {
        setSearchVal(state => ({
          ...state,
          countryVal,
          otherGoodsShipped,
        }));
        setCurrentChangeValues([Object.keys(values)[0]]);
      }
      if (timeFilter !== undefined) {
        setSearchVal(state => ({
          ...state,
          countryVal,
          timeFilter,
        }));
        setCurrentChangeValues([Object.keys(values)[0]]);
      }
      if (containsExpress !== undefined) {
        setSearchVal(state => {
          console.log('setSearchVal-state: ', state);
          return {
            ...state,
            countryVal,
            containsExpress,
          };
        });
        setCurrentChangeValues([Object.keys(values)[0]]);
      }
      if (onlyContainsChina !== undefined) {
        setSearchVal(state => ({
          ...state,
          countryVal,
          onlyContainsChina,
        }));
        setCurrentChangeValues([Object.keys(values)[0]]);
      }
      console.log('handleFilterBox-values: ', values);
      console.log('handleFilterBox-filterResData: ', filterResData.current, { timeFilter, containsExpress, onlyContainsChina });
      console.log('handleFilterBox-countryVal: ', countryVal, transformCountryValue(countryVal).cList);
    };
    // 高级筛选
    const onSeniorFinish = () => {
      const val = form.getFieldsValue();
      const conVal = Array.from(new Set([...countryVal, ...followCountryCheckedList]));
      setSearchVal(pre => ({
        ...pre,
        ...{ ...omit(val, ['otherCountry']), countryVal: conVal },
        ...val,
        countryList: conVal,
      }));
      setDrawerVisible(false);
      setChangeStatus(false);
      changeValue.current = [];
      if (Object.values(val).every(item => item === undefined) && !countryVal.length && !followCountryCheckedList.length) {
        filterResData.current = [];
        setFilterResData([]);
        setCurrentChangeValues([]);
        // handleSelectChange(flattenData[0], false);
      }
    };
    const resetSeniorForm = () => {
      form.resetFields();
      // 重置收藏
      setCheckedList([]);
      flattenData
        .filter(item => countryVal.includes(item.code))
        .forEach(node => {
          handleSelectChange(node, false);
        });
      setIndeterminate(false);
      setCheckAll(false);
      setChangeStatus(true);
      menuData?.forEach(it => {
        it?.countries?.forEach(x => {
          x.showBox = false;
        });
      });
      const _nl = [...nationList];
      _nl.forEach(item => {
        item.showBox = false;
      });
      setNationList(_nl);
    };
    const handleValuesChange = (values: any) => {
      setChangeStatus(true);
      changeValue.current = [...changeValue.current, Object.keys(values)[0]];
      setCurrentChangeValues(changeValue.current);
    };
    // 删除一个标签的筛选结果 (上层触发)
    const deleteOneFilter = (code: string) => {
      let newParam = {};
      switch (code) {
        case FilterResultState.Country:
          newParam = { countryVal: [], countryList: [] };
          setFilterResData(filterResData.current.filter(item => item.code !== FilterResultState.Country));
          filterResData.current = filterResData.current.filter(item => item.code !== FilterResultState.Country);
          flattenData
            .filter(item => countryVal.includes(item.code))
            .forEach(node => {
              handleSelectChange(node, false);
            });
          setAllCheckRegion(false);
          setHalfCheckRegion(false);
          setCheckedList([]);
          setSearchVal(state => ({
            ...state,
            countryVal: [],
            countryList: [],
          }));
          // 全部国家不展示checkbox
          menuData?.forEach(it => {
            it?.countries?.forEach(x => {
              x.showBox = false;
            });
          });
          // 其他国家和地区
          form.setFieldsValue({ otherCountry: [] });
          break;
        case FilterResultState.TimeFilter:
          newParam = {
            timeFilter: initTimeFilter,
          };
          setFilterResData(filterResData.current.filter(item => item.code !== FilterResultState.TimeFilter));
          filterResData.current = filterResData.current.filter(item => item.code !== FilterResultState.TimeFilter);
          filterBoxForm.setFieldsValue({ timeFilter: initTimeFilter });
          form.setFieldsValue({ timeFilter: initTimeFilter });
          setSearchVal(state => ({
            ...state,
            timeFilter: initTimeFilter,
          }));
          break;
        case FilterResultState.ContainsExpress:
          newParam = {
            containsExpress: false,
          };
          setFilterResData(filterResData.current.filter(item => item.code !== FilterResultState.ContainsExpress));
          filterResData.current = filterResData.current.filter(item => item.code !== FilterResultState.ContainsExpress);
          filterBoxForm.setFieldsValue({ containsExpress: false });
          form.setFieldsValue({ containsExpress: false });
          setSearchVal(state => ({
            ...state,
            containsExpress: false,
          }));
          break;
        case FilterResultState.OnlyContainsChina:
          newParam = {
            onlyContainsChina: false,
          };
          const temp = filterResData.current.filter(item => item.code !== FilterResultState.OnlyContainsChina);
          filterResData.current = temp;
          setFilterResData(temp);
          filterBoxForm.setFieldsValue({ onlyContainsChina: false });
          form.setFieldsValue({ onlyContainsChina: false });
          setSearchVal(state => ({
            ...state,
            onlyContainsChina: false,
          }));
          break;
        default:
          break;
      }
      setCurrentChangeValues([]);
      // updateSearchVal({ ...searchVal, ...newParam });
    };
    const passValue = {
      menuData: [menuData],
      handleSelectChange: handleSelectChange,
      value: countryVal,
      flattenData,
      drawerForm: form,
      updateSearchVal: updateSearchVal,
      showCheckboxNode,
      changeStatus: () => setChangeStatus(true),
    };
    const onDrawerClose = () => {
      setDrawerVisible(false);
      // setChangeStatus(false)
    };
    useEffect(() => {
      console.log('useEffect-isInit: ', isInit);
      if (!isInit) {
        // 更新筛选区域状态
        updateFilterArea(searchVal);
        // 更新高级搜索状态
        updateSeniorFilter(searchVal);
        // 更新筛选结果
        updateFilterResult(searchVal);
        // 请求服务端
        updateSearchVal(searchVal);
      }
      setIsInit(false);
    }, [searchVal]);
    const [tempList, setTempList] = useState<string[]>([]);
    useEffect(() => {
      edmCustomsApi
        .getFollowCountry()
        .then((res: any) => {
          const _res = res.map((item: any) => ({ id: item.id, label: item.countryChinese, value: item.country, code: item.code, showBox: false }));
          console.log('edmCustomsApi_res: ', _res);
          const _temp = _res.map((item: any) => item.code);
          setTempList(_temp);
          setNationList(_res);
        })
        .catch(() => setNationList([]));
    }, []);
    const [indeterminate, setIndeterminate] = useState(false);
    const [checkAll, setCheckAll] = useState(false);
    const currList = useRef<string[]>([]);
    useEffect(() => {
      setTempList(nationList.map(item => item.code));
    }, [nationList]);
    const onCheckAllChange = useSyncCallback((e: CheckboxChangeEvent) => {
      const _nl = [...nationList];
      _nl.forEach(item => {
        if (e.target.checked) item.showBox = true;
        else item.showBox = false;
      });
      setNationList(_nl);
      setCheckedList(e.target.checked ? tempList : []);
      setIndeterminate(false);
      setCheckAll(e.target.checked);
      setChangeStatus(true);
      if (!e.target.checked) {
        currList.current = [];
        setTempList([]);
      } else {
        currList.current = [...tempList];
      }
    });
    const onChangeGroup = useSyncCallback((list: CheckboxValueType[]) => {
      console.log('onChangeGroup-list: ', list, nationList);
      const _nl = [...nationList];
      _nl.forEach(item => {
        if (list.includes(item.code)) {
          item.showBox = true;
        } else item.showBox = false;
      });
      if (list.length === 0) currList.current = [];
      currList.current = currList.current.filter(code => list.includes(code));
      setNationList(_nl);
      setCheckedList(list);
      setIndeterminate(!!list.length && list.length < tempList.length);
      setCheckAll(list.length === tempList.length);
      setChangeStatus(true);
    });
    const renderExtraFilter = useMemo(() => {
      return (
        <>
          <div className={style.extraWrap}>
            <div className={style.front}>
              <Form.Item name="relationCountryList" label={companyType === 'suppliers' ? getIn18Text('GONGYINGMUDE') : getIn18Text('CAIGOULAIYUAN')}>
                <Select
                  onChange={() => {
                    customsDataTracker.trackSelectClick(companyType === 'suppliers' ? CustomsDataSelectClick.supplierNation : CustomsDataSelectClick.buyerNation);
                  }}
                  maxTagCount="responsive"
                  mode="multiple"
                  showSearch
                  showArrow={true}
                  allowClear={true}
                  optionFilterProp="children"
                  style={{ width: 220 }}
                  placeholder={`请选择${companyType === 'suppliers' ? getIn18Text('GONGYINGMUDE') : getIn18Text('CAIGOULAIYUAN')}`}
                >
                  {country &&
                    country.map((item, index) => {
                      return (
                        <Select.Option key={index} value={item.code}>
                          {item.label}
                        </Select.Option>
                      );
                    })}
                </Select>
              </Form.Item>
              <Form.Item name="onlyContainsChina" noStyle valuePropName="checked">
                <Checkbox
                  onChange={() => {
                    customsDataTracker.trackSelectClick(companyType === 'suppliers' ? CustomsDataSelectClick.supplierNation : CustomsDataSelectClick.buyerNation);
                  }}
                  style={{ marginLeft: -32, marginTop: 14 }}
                >
                  {getIn18Text('JINXIANSHIYOU')}
                  {`${companyType === 'suppliers' ? getIn18Text('GONGYINGMUDE') : getIn18Text('CAIGOULAIYUAN')}`}
                  {getIn18Text('ZHONGGUODE')}
                </Checkbox>
              </Form.Item>
            </div>
          </div>
          <Form.Item name="timeFilter" label={getIn18Text('SHIJIANFANWEI')} className={classnames(style.formItemTime)}>
            <Select
              onChange={() => {
                customsDataTracker.trackSelectClick(CustomsDataSelectClick.time);
              }}
              style={{ width: 220 }}
              placeholder={getIn18Text('QINGXUANZESHIJIANFANWEI')}
            >
              {timeRange.map(item => (
                <Select.Option key={item.value} value={item.value}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="HSCode" name="advanceHsCode">
            <Input style={{ width: 220 }} placeholder={getIn18Text('QINGSHURUHSCODE')} />
          </Form.Item>
          <Form.Item label={getIn18Text('CHANPINMIAOSHU')} name="advanceGoodsShipped">
            <Input style={{ width: 220 }} placeholder={getIn18Text('QINGSHURUCHANPINMIAOSHU')} />
          </Form.Item>
          <Form.Item
            className={style.conExpress}
            label={
              <>
                <span>{getIn18Text('PAICHUWULIUGONGSI')}</span>
                <Tooltip placement="topLeft" title={content}>
                  <Help />
                </Tooltip>
              </>
            }
            labelCol={{ span: 4 }}
            name="containsExpress"
            valuePropName="checked"
          >
            <Switch
              onChange={checked => {
                customsDataTracker.trackSelectClick(CustomsDataSelectClick.logistics, checked);
              }}
            />
          </Form.Item>
        </>
      );
    }, []);
    const handleClick = useSyncCallback((node: any) => {
      const _nl = [...nationList];
      _nl.forEach(item => {
        if (!followCountryCheckedList.includes(item.code) && item.code === node.code) {
          item.showBox = true;
        }
      });
      setNationList(_nl);
      console.log('handleClick-node: ', node, nationList, _nl);
      setCheckedList(state => [...state, node.code]);
      currList.current = Array.from(new Set([...currList.current, node.code]));
      console.log('followCountryCheckedList-first', followCountryCheckedList, tempList, currList.current);
      setIndeterminate(!!currList.current.length && currList.current.length < tempList.length);
      setCheckAll(currList.current.length === tempList.length);
      setChangeStatus(true);
    });
    const addFollow = () => {
      setVisible(true);
    };
    const editFollow = () => {
      setEditVisible(true);
    };
    useEffect(() => {
      console.log('getFollowCountry-res-1');
      fetchMyFollowCountries();
    }, []);
    const fetchMyFollowCountries = () => {
      edmCustomsApi
        .getFollowCountry()
        .then(res => {
          const _res = res.map((item: any) => ({ id: item.id, label: item.countryChinese, value: item.country, code: item.code, showBox: false }));
          setNationList(_res);
        })
        .catch(() => setNationList([]));
    };
    const onOk = () => {
      fetchMyFollowCountries();
      setVisible(false);
    };
    const onEditOk = () => {
      fetchMyFollowCountries();
      setEditVisible(false);
    };
    const renderFollowCheckbox = useMemo(() => {
      return (
        <>
          <div className={style.followTitle}>
            {!!nationList.length && (
              <Checkbox className={style.checkFollowAll} indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
                {getIn18Text('QUANBU')}
              </Checkbox>
            )}
            <div className={style.tail}>
              <div onClick={addFollow} className={style.addCou}>
                <AddFollow />
                {getIn18Text('TIANJIAGUOJIA')}
              </div>
              {!!nationList.length && <div onClick={editFollow}>{getIn18Text('BIANJISHOUCANG')}</div>}
            </div>
          </div>
          <Checkbox.Group className={style.followCheck} value={followCountryCheckedList} onChange={onChangeGroup}>
            {nationList.map((item: any) => {
              if (!item.showBox) {
                return (
                  <div className={style.showCheckbox} onClick={() => handleClick(item)}>
                    <NationFlag name={item.value} />
                  </div>
                );
              }
              return (
                <Checkbox className={style.showCheckboxTrue} value={item.code}>
                  {' '}
                  <NationFlag name={item.value} />{' '}
                </Checkbox>
              );
            })}
          </Checkbox.Group>
        </>
      );
    }, [nationList, indeterminate, checkAll, followCountryCheckedList]);

    const enableLang = tabValue === 'goodsShipped';
    const langOptions = useLangOption(query, enableLang);
    const [continentList, nationModalAllCountry] = useCustomsCountryHook(true);
    return (
      <CustomsCtx.Provider value={passValue}>
        <div className={style.container}>
          <div className={style.titleWrap}>
            <div className={style.title}>{getIn18Text('SHAIXUANTIAOJIAN')}</div>
            <div className={style.title} onClick={() => setDrawerVisible(true)}>
              {getIn18Text('GAOJISHAIXUAN')}
            </div>
          </div>
          <Form labelAlign="left" layout="inline" form={filterBoxForm} onValuesChange={handleFilterBox}>
            <Form.Item name="countryList" label={getIn18Text('GUOJIADEQU')} valuePropName="checked">
              <Checkbox checked={allCheckRegion} indeterminate={regionHalfCheck} onChange={onChange}>
                {getIn18Text('QUANBU')}
              </Checkbox>
              <span className={style.changeCountry} onClick={() => setDrawerVisible(true)}>
                [{getIn18Text('QIEHUANGUOJIA')}]
              </span>
            </Form.Item>
            <Form.Item name="onlyContainsChina" label={companyType === 'suppliers' ? getIn18Text('GONGYINGMUDE') : getIn18Text('CAIGOULAIYUAN')} valuePropName="checked">
              <Checkbox
                onChange={() => {
                  customsDataTracker.trackSelectClick(companyType === 'suppliers' ? CustomsDataSelectClick.supplierNation : CustomsDataSelectClick.buyerNation);
                }}
              >
                {getIn18Text('JINXIANSHIYOU')}
                {`${companyType === 'suppliers' ? getIn18Text('GONGYINGMUDE') : getIn18Text('CAIGOULAIYUAN')}`}
                {getIn18Text('ZHONGGUODE')}
              </Checkbox>
            </Form.Item>
            <Form.Item initialValue={initTimeFilter} name="timeFilter" label={getIn18Text('SHIJIANFANWEI')}>
              <Select
                onChange={() => {
                  customsDataTracker.trackSelectClick(CustomsDataSelectClick.time);
                }}
                style={{ width: 171 }}
                placeholder={getIn18Text('QINGXUANZESHIJIANFANWEI')}
              >
                {timeRange.map(item => (
                  <Select.Option key={item.value} value={item.value}>
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="containsExpress"
              label={
                <>
                  <span>{getIn18Text('PAICHUWULIUGONGSI')}</span>
                  <Tooltip placement="topLeft" title={content}>
                    <Help />
                  </Tooltip>
                </>
              }
              valuePropName="checked"
            >
              <Switch
                onChange={checked => {
                  customsDataTracker.trackSelectClick(CustomsDataSelectClick.logistics, checked);
                }}
              />
            </Form.Item>
            {enableLang && (
              <Form.Item
                initialValue={['en', 'es']}
                name="otherGoodsShipped"
                label={
                  <>
                    <span>{getIn18Text('YUZHONG')}</span>
                    <Tooltip placement="topLeft" title={'系统会按输入的关键词的原文进行搜索，可选择翻译成其他语种继续搜索'}>
                      <Help />
                    </Tooltip>
                  </>
                }
              >
                <Select
                  style={{ width: 171 }}
                  mode="multiple"
                  optionLabelProp="label"
                  maxTagCount="responsive"
                  onChange={vl => {
                    customsDataTracker.trackSelectClick(CustomsDataSelectClick.language, vl);
                  }}
                >
                  {langOptions.map(lo => (
                    <Select.Option key={lo.value} label={lo.label} value={lo.value}>
                      {lo.labelDisplay}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </Form>
          <Drawer
            visible={drawerVisible}
            onClose={onDrawerClose}
            footer={
              <>
                <Button disabled={!changeStatus} type="primary" style={{ marginRight: 12 }} onClick={onSeniorFinish}>
                  {getIn18Text('QUEDING')}
                </Button>
                <Button onClick={resetSeniorForm}>{getIn18Text('ZHONGZHI')}</Button>
              </>
            }
          >
            <Form className={style.seniorContent} form={form} labelAlign="left" onValuesChange={handleValuesChange}>
              <h3>{getIn18Text('GAOJISHAIXUAN')}</h3>
              <Form.Item label={getIn18Text('GUOJIADEQU')}>
                <Tabs activeKey={defaultKey} onChange={onDrawerTabChange}>
                  <Tabs.TabPane tab={getIn18Text('SHOUCANG')} key="1">
                    {renderFollowCheckbox}
                  </Tabs.TabPane>
                  <Tabs.TabPane tab={getIn18Text('QUANBU')} key="2">
                    <Checkbox indeterminate={indeterminateAll} checked={checkedAll} onChange={handleChangeAll}>
                      {getIn18Text('QUANBUGUOJIA')}
                    </Checkbox>
                    <CountryBox value={[]} />
                  </Tabs.TabPane>
                </Tabs>
              </Form.Item>
              {renderExtraFilter}
            </Form>
          </Drawer>
          <NationModal
            countryList={nationModalAllCountry}
            visible={visible}
            nationList={nationList}
            updateNationList={fetchMyFollowCountries}
            onCancel={() => setVisible(false)}
            onOk={onOk}
          />
          <EditFollowModal
            visible={editVisible}
            nationList={nationList}
            onCancel={() => setEditVisible(false)}
            onOk={onEditOk}
            updateNationList={fetchMyFollowCountries}
          />
        </div>
      </CustomsCtx.Provider>
    );
  }
);
export default CustomsSearch;
