import React, { useState, useContext, useEffect, useCallback } from 'react';
import classnames from 'classnames';
import { useLatest, useUpdateEffect } from 'ahooks';
import { Input, Divider, Select, Space, Switch, Checkbox, Row, Col, Tooltip } from 'antd';
import { EnhanceSelect, InSingleOption, InMultiOption } from '@lingxi-common-component/sirius-ui/Select';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { apiHolder, apis, DataTrackerApi } from 'api';
import { isEqual } from 'lodash';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { ReactComponent as SearchIcon } from '@/images/icons/datasearch/searchIcon.svg';
import CustomerTabs from '@/components/Layout/Customer/components/Tabs/tabs';
import { getTransText } from '@/components/util/translate';
import { SearchType, IntelligentSearchContext, ActionType, SearchEngine, SearchSiteList, defaultSites, IntelligentSearchType } from '../../context';
import { FilterDrawer } from './filterDrawer';
import style from './search.module.scss';
import { globalSearchApi } from '@/components/Layout/globalSearch/constants';
import { WMDATA_ALL_SEARCH_TRACKER_KEY } from '@/components/Layout/globalSearch/tracker';

interface Country {
  label: string;
  value: string;
}

interface Props {
  onSearch?: Function;
  disable?: boolean;
}

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
export const Search = (props: Props) => {
  const { disable = false, onSearch } = props;
  const { state, dispatch } = useContext(IntelligentSearchContext);
  const [countries, setCountries] = useState<Country[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawerVisibleRef = useLatest(drawerVisible);
  useEffect(() => {
    globalSearchApi.listWaCountry().then((country: any) => {
      const code = new Set();
      const filterdCountry = (country || []).filter((item: any) => {
        if (!item.code || code.has(item.code)) {
          return false;
        }
        code.add(item.code);
        return true;
      });
      setCountries([
        {
          label: getTransText('QUANBU'),
          value: '',
        },
        ...filterdCountry.map((item: any) => ({
          label: item.label,
          value: item.code,
        })),
      ]);
    });
  }, []);

  const triggerSearch = (hideToast?: boolean) => {
    onSearch?.(hideToast);
    trackApi.track('pc_google_search_search', { page: 'search' });
    trackApi.track(WMDATA_ALL_SEARCH_TRACKER_KEY);
  };

  const tagRender = useCallback(() => {
    const list: string[] = state?.siteList || [];
    // defaultSites
    if (isEqual(list.slice().sort(), defaultSites.slice().sort())) {
      return <div>{getTransText('MOREN')}</div>;
    }
    return <div>{getTransText('ZIDINGYI')}</div>;
  }, [state.siteList]);

  useUpdateEffect(() => {
    if (!drawerVisibleRef.current) {
      triggerSearch(true);
    }
  }, [state.excludeDelivered, state.countryList, state.isAllMatch, state.searchEngine, state.siteList, state.type]);

  return (
    <div className={style.wrapper}>
      <CustomerTabs
        className={style.companyTabs}
        defaultActiveKey="buysers"
        tabList={SearchType.filter(item => item.value !== IntelligentSearchType.Email || !state.inWa)}
        onChange={val => dispatch({ type: ActionType.typeChange, payload: val })}
        activeKey={state.type}
      />
      <Input.Group className={style.inputWrap}>
        <Input
          className={style.input}
          prefix={<SearchIcon className={style.inputPreIcon} />}
          placeholder={getTransText('InputCompnameOrProductName')}
          value={state.content}
          onPressEnter={() => triggerSearch()}
          disabled={disable}
          onChange={({ target: { value } }) => dispatch({ type: ActionType.contentChange, payload: value })}
        />
        <Divider type="vertical" className={style.divider} />
        <Checkbox
          style={{ width: 130 }}
          checked={state.isAllMatch === 1}
          onChange={({ target: { checked } }) => dispatch({ type: ActionType.isAllMatchChange, payload: checked ? 1 : 0 })}
        >
          {getTransText('PreciseSearch')}
        </Checkbox>
        <Tooltip title={getTransText('PreciseSearchTip') || ''} placement="top" arrowPointAtCenter>
          <QuestionCircleOutlined className={style.tipIcon} />
        </Tooltip>
        <Button btnType="primary" disabled={disable} className={style.searchBtn} onClick={() => triggerSearch()}>
          {getTransText('SOUSUO')}
        </Button>
      </Input.Group>

      <div className={style.filter}>
        <div className={style.title}>{getTransText('SHAIXUANTIAOJIAN')}</div>
        <span
          className={classnames(style.linkBtn, style.filterClp)}
          onClick={() => {
            if (disable) {
              return;
            }
            setDrawerVisible(true);
          }}
        >
          {getTransText('GAOJISHAIXUAN')}
        </span>
        <div className={style.filterContent}>
          <Row>
            {state.type === IntelligentSearchType.Phone ? (
              <Col span={6}>
                <div className={style.field}>
                  <div className={style.label}>{getTransText('GUOJIA/DEQU')}</div>
                  <EnhanceSelect
                    // dropdownClassName="edm-selector-dropdown"
                    showSearch
                    filterOption
                    optionFilterProp="label"
                    disabled={disable}
                    placeholder={getTransText('Area') || ''}
                    className={style.select}
                    options={countries}
                    suffixIcon={<DownTriangle />}
                    value={state?.countryList?.[0] || ''}
                    onChange={val => {
                      dispatch({ type: ActionType.countryListChange, payload: val ? [val] : [] });
                    }}
                  />
                </div>
              </Col>
            ) : (
              ''
            )}
            <Col span={6}>
              <div className={style.field}>
                <div className={style.label}>{getTransText('SearchPlatform')}</div>
                <EnhanceSelect
                  // dropdownClassName="edm-selector-dropdown"
                  className={style.select}
                  allowClear
                  disabled={disable}
                  placeholder={getTransText('Platform') || ''}
                  value={state.siteList}
                  mode="multiple"
                  maxTagCount={1}
                  showArrow
                  options={SearchSiteList}
                  showSearch={false}
                  tagRender={tagRender}
                  suffixIcon={<DownTriangle />}
                  onChange={val => {
                    dispatch({ type: ActionType.siteListChange, payload: val });
                  }}
                  dropdownRender={menu => (
                    <>
                      <Space style={{ padding: '5px 12px' }}>
                        <span className={style.linkBtn} onClick={() => dispatch({ type: ActionType.siteListChange, payload: defaultSites.slice() })}>
                          {getTransText('ResetToDefault')}
                        </span>
                        {/* <span className={style.linkBtn}>全选</span> */}
                      </Space>
                      {menu}
                    </>
                  )}
                />
              </div>
            </Col>
            <Col span={6}>
              <div className={style.field}>
                <div className={style.label}>{getTransText('SearchEngine')}</div>
                <EnhanceSelect
                  // dropdownClassName="edm-selector-dropdown"
                  value={state.searchEngine}
                  className={style.select}
                  disabled={disable}
                  options={SearchEngine}
                  suffixIcon={<DownTriangle />}
                  onChange={val => {
                    dispatch({ type: ActionType.searchEngineChange, payload: val });
                  }}
                />
              </div>
            </Col>
            {state.type !== IntelligentSearchType.Email ? (
              <Col span={6}>
                <div className={style.field}>
                  <Checkbox
                    disabled={disable}
                    checked={state.excludeDelivered}
                    onChange={e => {
                      dispatch({ type: ActionType.excludeDeliveredChange, payload: e.target.checked });
                    }}
                  >
                    {state.type === IntelligentSearchType.Phone ? '未发过消息' : '未加群'}
                  </Checkbox>
                </div>
              </Col>
            ) : (
              ''
            )}
          </Row>
        </div>
      </div>

      <FilterDrawer
        visible={drawerVisible}
        countries={countries}
        disable={disable}
        onClose={() => setDrawerVisible(false)}
        onConfirm={() => {
          setDrawerVisible(false);
          triggerSearch();
        }}
      />
    </div>
  );
};
