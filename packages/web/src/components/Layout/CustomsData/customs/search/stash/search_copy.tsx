import React, { useEffect, useState, useImperativeHandle, useContext, useRef, useMemo } from 'react';
import style from './search.module.scss';
import { Form, Checkbox, DatePicker, Radio, Input, Switch, Button } from 'antd';
import moment, { Moment } from 'moment';
import classnames from 'classnames';
import SearchCollapse from '@/components/Layout/Customer/components/searchCollapse/SearchCollapse';
import CollapseButton from '@/components/Layout/Customer/components/collapseButton/CollapseButton';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import { customsDataTracker, CustomsDataSelectClick } from '../../tracker/tracker';
import { reqBuyers, resCustomsStateCountry as countryItemType } from 'api';
import Country from './country';
import OtherCountry from './otherCountry';
import { cloneDeep } from 'lodash';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { getIn18Text } from 'api';

interface countryItem {
  label: string;
  code: string;
}

interface areaItem {
  label: string;
  value: boolean;
}

const baseLogistics: areaItem[] = [
  { label: '是', value: true },
  { label: '否', value: false },
];

function disabledDate(current: Moment) {
  return current && (current > moment().endOf('day') || current < moment('1900-01-01').endOf('day'));
}
type serarchParam = Partial<reqBuyers>;

interface Props {
  className?: string;
  placeholder?: string;
  index?: number;
  onSearch: (param: serarchParam) => void;
  initLayout?: boolean;
  baseCounrty: countryItemType[];
  defaultCountryList: string[];
  allCountry: countryItem[];
  companyType: string;
}

const timeRange = [
  {
    value: 'all',
    label: '所有',
  },
  {
    value: 'last_five_year',
    label: '近五年',
  },
  {
    value: 'last_three_year',
    label: '近三年',
  },
  {
    value: 'last_two_year',
    label: '近两年',
  },
  {
    value: 'last_one_year',
    label: '近一年',
  },
  {
    value: 'last_half_year',
    label: '近半年',
  },
  {
    value: 'recent_quarter',
    label: '近一个季度',
  },
];

const CustomsSearch = React.forwardRef(({ className, companyType, onSearch, baseCounrty, allCountry, defaultCountryList }: Props, ref) => {
  const [baseCheckedList, setBaseCheckedList] = useState<countryItemType[]>(() => cloneDeep(baseCounrty));
  const [countryCheckedList, setCountryCheckedList] = useState<string[]>(() => cloneDeep(defaultCountryList));
  const [indeterminate, setIndeterminate] = useState<boolean>(false);
  const [checkAll, setCheckAll] = useState<boolean>(true);
  const [isInit, setIsInit] = useState<boolean>(true);
  const [isExpand, setIsExpand] = useState<boolean>(false);
  const [expandDelay, setExpandDelay] = useState<boolean>(false);
  const [country, setCountry] = useState<{ label: string; code: string }[]>(() => allCountry);
  const [otherCountryList, setOtherCountryList] = useState<string[]>([]);
  const [otherCountryChecked, setOtherCountryChecked] = useState<boolean>(true);

  const [serarchParam, setSerarchParam] = useState<serarchParam>(() => {
    return {
      containsExpress: true,
      countryList: [...defaultCountryList, 'OTHER-COUNTRY'],
      relationCountryList: [],
      timeFilter: 'all',
    };
  });

  // const context = useContext<cParams>(CustomerContext);
  // const { relationCountryList = [], timeFilter = '', containsExpress = true, countryList = [] } = context.reqParams
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

  // useEffect(() => {
  //     setCountryCheckedList(countryList)
  //     // console.log('useEffectcountryListcontext: ', context);
  // }, [countryList])

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

  // 数组包含 1
  const arrIsContains = (originArr: string[], currentArr: string[]) => {
    if (currentArr.length) {
      return currentArr.every(el => originArr.includes(el));
    }
    return false;
  };
  // 存在 0.5
  const arrIsExit = (originArr: string[], currentArr: string[]) => {
    return currentArr.some(el => originArr.includes(el));
  };
  // 不存在 0
  const arrIsNotExit = (originArr: string[], currentArr: string[]) => {
    return currentArr.every(el => !originArr.includes(el));
  };
  const restOnChange = (list: string[]) => {
    let _base = [...baseCheckedList];
    let _list = [...list];
    console.log('xxxxxlist', _list, _base);
    _base.forEach(item => {
      let itemCodeArr = item.countries && item.countries.map(item => item.code);
      if (Array.isArray(itemCodeArr)) {
        if (arrIsContains(list, itemCodeArr)) {
          if (list.includes(item.code)) {
            item.indeterminate = false;
          } else {
            // 半选到全选
            if (item.indeterminate === true) {
              _list.push(item.code);
              item.indeterminate = false;
            }
            // 本条全部取消
            else {
              item.countries &&
                item.countries.forEach(ele => {
                  _list = _list.filter(code => ele.code !== code);
                });
            }
          }
        } else if (arrIsExit(list, itemCodeArr)) {
          if (list.includes(item.code)) {
            // 整体
            if (item.indeterminate === true) {
              item.countries && item.countries.forEach(el => _list.push(el.code));
              _list = [...new Set(_list)];
              item.indeterminate = false;
            } else {
              // 单个操作
              item.indeterminate = true;
              _list = _list.filter(code => code !== item.code);
            }
          } else {
            if (item.indeterminate === true) {
              // 取消洲全选
              _list.push(item.code);
              _list = _list.filter(code => item.code !== code);
            } else {
              item.indeterminate = true;
            }
          }
        } else {
          // 不包含子类
          if (list.includes(item.code)) {
            // 半选to
            if (item.indeterminate === true) {
              _list = _list.filter(code => item.code !== code);
              item.indeterminate = false;
            } else {
              item.indeterminate = false;
              item.countries && item.countries.forEach(el => _list.push(el.code));
              _list = [...new Set(_list)];
            }
          } else {
            // 逐个取消国家
            item.indeterminate = false;
            console.log('xxxnoway-noway', item.state);
          }
        }
      }
      customsDataTracker.trackSelectClick(CustomsDataSelectClick.nation);
    });
    // 动态变更checkbox
    setCountryCheckedList([..._list]);
    setBaseCheckedList([..._base]);
    if (otherCountryList && otherCountryList.length) {
      checkChange([..._list, ...otherCountryList]); // 变更国家
    } else {
      if (otherCountryChecked) {
        checkChange([..._list, 'OTHER-COUNTRY']); // 变更国家
      } else {
        checkChange([..._list]); // 变更国家
      }
    }

    let length = [..._list].length;
    let isCountry = length > 0 && length < defaultCountryList.length;

    if (isCountry) {
      setIndeterminate(true);
      setCheckAll(false);
    } else if (length === 0) {
      setIndeterminate(otherCountryChecked);
      setCheckAll(false);
    } else {
      // length === 100
      setIndeterminate(!otherCountryChecked);
      setCheckAll(otherCountryChecked);
    }
    // // 半选
    // setIndeterminate(isCountry || !otherCountryChecked);
    // // 全选
    // setCheckAll(length === defaultCountryList.length && otherCountryChecked);
    customsDataTracker.trackSelectClick(CustomsDataSelectClick.nation);
  };

  const changeOtherCountry = (keys: string[], checked?: boolean) => {
    setOtherCountryList(keys);
    if (checked === true) {
      checkChange([...countryCheckedList, 'OTHER-COUNTRY']);
    } else if (checked === false) {
      checkChange([...countryCheckedList].filter(el => el !== 'OTHER-COUNTRY'));
    } else {
      if (keys && keys.length) {
        let list = [...countryCheckedList].filter(el => el !== 'OTHER-COUNTRY');
        checkChange([...list, ...keys]);
        setOtherCountryChecked(false); // 半选就是没有选中
        setIndeterminate(true);
        setCheckAll(false);
      } else {
        setOtherCountryChecked(true);
        checkChange([...countryCheckedList, 'OTHER-COUNTRY']);
        changeCommonCheckALL(true);
      }
      // else if (otherCountryChecked) {

      //     setOtherCountryChecked(true);
      //     checkChange([...countryCheckedList, 'OTHER-COUNTRY'])
      //     changeCommonCheckALL(true);
      // } else {
      //     setOtherCountryChecked(true);
      //     checkChange([...countryCheckedList].filter(el => el !== 'OTHER-COUNTRY'))
      //     changeCommonCheckALL(false);
      // }
    }
  };

  const changeCommonCheckALL = (checked: boolean) => {
    let length = [...countryCheckedList].length;
    let isCountry = length > 0 && length < defaultCountryList.length;
    if (isCountry) {
      setIndeterminate(true);
      setCheckAll(false);
    } else if (length === 0) {
      setIndeterminate(checked);
      setCheckAll(false);
    } else {
      setIndeterminate(!checked);
      setCheckAll(checked);
    }
  };

  const changeOtherCountryChecked = (checked: boolean) => {
    setOtherCountryChecked(checked);
    changeOtherCountry([], checked);
    changeCommonCheckALL(checked);
  };

  const onCheckAllChange = e => {
    if (e.target.checked) {
      setCountryCheckedList([...defaultCountryList]);
      checkChange([...defaultCountryList, 'OTHER-COUNTRY']);
      setOtherCountryChecked(true);
      setOtherCountryList([]);
    } else {
      setCountryCheckedList([]);
      checkChange([]);
      setOtherCountryChecked(false);
      setOtherCountryList([]);
    }
    setBaseCheckedList(cloneDeep(baseCounrty));
    setIndeterminate(false);
    setCheckAll(e.target.checked);
    customsDataTracker.trackSelectClick(CustomsDataSelectClick.nation);
  };

  const checkChange = (country: string[]) => {
    setSerarchParam({
      ...serarchParam,
      countryList: country,
    });
  };

  const onChangeTime = (value: string) => {
    setSerarchParam({
      ...serarchParam,
      timeFilter: value,
    });
    customsDataTracker.trackSelectClick(CustomsDataSelectClick.time);
  };
  const changeCountry = (country: string[]) => {
    setSerarchParam({
      ...serarchParam,
      relationCountryList: country,
    });
    if (companyType === 'suppliers') {
      customsDataTracker.trackSelectClick(CustomsDataSelectClick.buyerNation);
    } else {
      customsDataTracker.trackSelectClick(CustomsDataSelectClick.supplierNation);
    }
  };

  // 初始化不调用
  useEffect(() => {
    if (!isInit) {
      onSearch(serarchParam);
    }
    setIsInit(false);
  }, [serarchParam]);

  useEffect(() => {
    setBaseCheckedList(cloneDeep(baseCounrty));
  }, []);

  useImperativeHandle(ref, () => ({
    serarchParam: serarchParam,
  }));

  const onDrawerClose = () => {
    setDrawerVisible(false);
  };

  const renderExtraFilter = useMemo(() => {
    return (
      <>
        <Form.Item label={companyType === 'suppliers' ? '采购来源' : '供应来源'}>
          <Select
            maxTagCount={'responsive'}
            mode="multiple"
            // defaultValue={relationCountryList}
            showSearch
            showArrow={true}
            allowClear={true}
            filterOption={false}
            onSearch={value => {
              if (value) {
                let list = allCountry.filter(item => item.label.toLowerCase().indexOf(value.toLowerCase()) >= 0);
                setCountry(list);
              } else {
                setCountry([...allCountry]);
              }
            }}
            style={{ width: 230, verticalAlign: 'top' }}
            placeholder={`请选择${companyType === 'suppliers' ? '采购来源' : '供应来源'}`}
            onChange={e => changeCountry(e as string[])}
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
          <Checkbox style={{ marginRight: 30 }}>仅显示有采购来源中国的</Checkbox>
        </Form.Item>
        <Form.Item label={getIn18Text('SHIJIANFANWEI')} className={classnames(style.formItemTime)}>
          <Select
            style={{ width: 230, verticalAlign: 'top' }}
            // defaultValue={timeFilter}
            placeholder={getIn18Text('QINGXUANZESHIJIANFANWEI')}
            onChange={e => {
              onChangeTime(e as string);
            }}
          >
            {timeRange.map(item => (
              <Select.Option value={item.value}>{item.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="HSCode" name="hscode">
          <Input style={{ width: 220 }} placeholder={getIn18Text('QINGSHURUHSCODE')} />
        </Form.Item>
        <Form.Item label={getIn18Text('CHANPINMIAOSHU')} name="productDetail">
          <Input style={{ width: 220 }} placeholder={getIn18Text('QINGSHURUCHANPINMIAOSHU')} />
        </Form.Item>
        <Form.Item label={getIn18Text('PAICHUWULIUGONGSI')} name="company">
          <Switch defaultChecked />
        </Form.Item>
      </>
    );
  }, []);

  return (
    <div className={classnames(style.searchBox, className)}>
      <div className={style.titleWrap}>
        <div className={style.title}>{getIn18Text('SHAIXUANTIAOJIAN')}</div>
        <div className={style.title} onClick={() => setDrawerVisible(true)}>
          {getIn18Text('GAOJISHAIXUAN')}
        </div>
      </div>
      <Form labelAlign="left">
        <Form.Item className={classnames(style.formItem, style.formItemCountry)} label={getIn18Text('GUOJIADEQU')}>
          <div className={style.checkAll}>
            <Checkbox className={style.checkAllItem} indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
              {getIn18Text('QUANBUGUOJIA')}
            </Checkbox>
            <span onClick={() => setDrawerVisible(true)}>[{getIn18Text('QIEHUANGUOJIA')}]</span>
            {/* <CollapseButton
                        foldText='更多'
                        unFoldText='收起'
                        expand={isExpand}
                        onClick={() => { setIsExpand(!isExpand) }}
                        className={style.clickBtn}
                        noIcon={true}
                    /> */}
          </div>
        </Form.Item>
        <Form.Item label={companyType === 'suppliers' ? getIn18Text('CAIGOULAIYUAN') : '供应来源'} className={style.formItemTime}>
          <Select
            maxTagCount={'responsive'}
            mode="multiple"
            // defaultValue={relationCountryList}
            showSearch
            showArrow={true}
            allowClear={true}
            filterOption={false}
            onSearch={value => {
              if (value) {
                let list = allCountry.filter(item => item.label.toLowerCase().indexOf(value.toLowerCase()) >= 0);
                setCountry(list);
              } else {
                setCountry([...allCountry]);
              }
            }}
            style={{ width: 230, verticalAlign: 'top' }}
            placeholder={`请选择${companyType === 'suppliers' ? getIn18Text('CAIGOULAIYUAN') : '供应来源'}`}
            onChange={e => changeCountry(e as string[])}
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
        <Form.Item label={getIn18Text('SHIJIANFANWEI')} className={classnames(style.formItemTime)}>
          <Select
            style={{ width: 230, verticalAlign: 'top' }}
            // defaultValue={timeFilter}
            placeholder={getIn18Text('QINGXUANZESHIJIANFANWEI')}
            onChange={e => {
              onChangeTime(e as string);
            }}
          >
            {timeRange.map(item => (
              <Select.Option value={item.value}>{item.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label={getIn18Text('PAICHUWULIUGONGSI')} className={style.formItem}>
          <Radio.Group
            onChange={e => {
              setSerarchParam({
                ...serarchParam,
                containsExpress: e.target.value,
              });
              customsDataTracker.trackSelectClick(CustomsDataSelectClick.logistics);
            }}
            // defaultValue={containsExpress}>
            defaultValue={true}
          >
            {baseLogistics.map((item, index) => {
              return (
                <Radio value={item.value} key={index}>
                  {item.label}
                </Radio>
              );
            })}
          </Radio.Group>
        </Form.Item>
      </Form>

      <Drawer
        visible={drawerVisible}
        onClose={onDrawerClose}
        footer={
          <>
            <Button type="primary">{getIn18Text('QUEDING')}</Button>
            <Button>{getIn18Text('ZHONGZHI')}</Button>
          </>
        }
      >
        <Form className={style.seniorContent} labelAlign="left">
          <h3>{getIn18Text('GAOJISHAIXUAN')}</h3>
          <Form.Item className={classnames(style.formItem, style.formItemCountry)} label={getIn18Text('GUOJIADEQU')} name="country">
            <>
              <Checkbox.Group value={countryCheckedList} onChange={v => restOnChange(v as string[])}>
                <Country list={baseCheckedList} />
              </Checkbox.Group>
              <OtherCountry
                list={baseCheckedList}
                isChecked={otherCountryChecked}
                onChangeChecked={checked => {
                  changeOtherCountryChecked(checked);
                }}
                onChangeCountry={changeOtherCountry}
                otherCountryList={otherCountryList}
              />
            </>
          </Form.Item>
          {renderExtraFilter}
        </Form>
      </Drawer>
    </div>
  );
});
export default CustomsSearch;
