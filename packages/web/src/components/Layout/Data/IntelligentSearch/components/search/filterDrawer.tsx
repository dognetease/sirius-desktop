import React, { useContext } from 'react';
import { Button, Select, Switch, Checkbox, Space } from 'antd';
import { isEqual, cloneDeep } from 'lodash';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import { getTransText } from '@/components/util/translate';
import { IntelligentSearchContext, ActionType, SearchEngine, SearchSiteList, allSites, initialState, IntelligentSearchType } from '../../context';
import { IconMap } from './iconMap';
import style from './filterDrawer.module.scss';

interface Props {
  visible: boolean;
  disable?: boolean;
  countries: Array<{
    label: string;
    value: string;
  }>;
  onClose: Function;
  onConfirm: Function;
}

const CheckboxGroup = Checkbox.Group;
export const FilterDrawer: React.FC<Props> = props => {
  const { visible, onClose, countries, disable, onConfirm } = props;

  const { state, dispatch } = useContext(IntelligentSearchContext);

  const onCheckAllChange = (checked: boolean, index: number) => {
    if (index === -1) {
      if (checked) {
        dispatch({ type: ActionType.siteListChange, payload: allSites.slice() });
      } else {
        dispatch({ type: ActionType.siteListChange, payload: [] });
      }
      return;
    }

    const options = SearchSiteList[index]?.options || [];
    const siteList = cloneDeep(state.siteList || []);
    if (checked) {
      options.forEach(option => {
        if (!siteList.includes(option.value)) {
          siteList.push(option.value);
        }
      });
    } else {
      options.forEach(option => {
        const _index = siteList.findIndex(item => item === option.value);
        if (_index > -1) {
          siteList.splice(_index, 1);
        }
      });
    }
    dispatch({ type: ActionType.siteListChange, payload: siteList.slice() });
  };

  const onCheckChange = (list: string[], index: number) => {
    const siteList = state.siteList || [];
    const optionKeys = (SearchSiteList[index]?.options || []).map(item => item.value);
    optionKeys.forEach(key => {
      if (list.includes(key)) {
        // append
        if (!siteList.includes(key)) {
          siteList.push(key);
        }
      } else {
        // remove
        const _index = siteList.findIndex(item => item === key);
        if (_index > -1) {
          siteList.splice(_index, 1);
        }
      }
    });
    dispatch({ type: ActionType.siteListChange, payload: siteList.slice() });
  };

  const getIndeterminate = (index: number): boolean => {
    const siteList = state.siteList || [];

    if (index === -1) {
      if (!siteList.length || isEqual(siteList.slice().sort(), allSites.slice().sort())) {
        return false;
      }
      return true;
    }

    const optionKeys = (SearchSiteList[index]?.options || []).map(item => item.value);
    let findOne = false;
    let hasNoFind = false;
    optionKeys.forEach(key => {
      if (siteList.includes(key)) {
        findOne = true;
      } else {
        hasNoFind = true;
      }
    });

    if (!findOne || !hasNoFind) {
      return false;
    }

    return true;
  };

  const getCheckAll = (index: number): boolean => {
    const siteList = state.siteList || [];

    if (index === -1) {
      if (isEqual(siteList.slice().sort(), allSites.slice().sort())) {
        return true;
      }
      return false;
    }

    const optionKeys = (SearchSiteList[index]?.options || []).map(item => item.value);
    if (optionKeys.every(key => siteList.includes(key))) {
      return true;
    }
    return false;
  };

  return (
    <Drawer
      className={style.cluePicker}
      title={getTransText('GAOJISHAIXUAN')}
      contentWrapperStyle={{ width: 800 }}
      visible={visible}
      onClose={() => onClose()}
      footer={
        <Space>
          <Button
            type="primary"
            disabled={disable}
            onClick={() => {
              if (onConfirm) {
                onConfirm();
              }
            }}
          >
            {getTransText('QUEREN')}
          </Button>
          <Button
            disabled={disable}
            onClick={() => {
              const newState = {
                ...initialState,
                type: state.type,
              };
              dispatch({ type: ActionType.updateState, payload: newState });
            }}
          >
            {getTransText('ZHONGZHI')}
          </Button>
        </Space>
      }
    >
      <div className={style.body}>
        {state.type === IntelligentSearchType.Phone ? (
          <div className={style.field}>
            <div className={style.label}>{getTransText('GUOJIA/DEQU')}</div>
            <Select
              dropdownClassName="edm-selector-dropdown"
              showSearch
              filterOption
              optionFilterProp="label"
              placeholder={getTransText('Area') || ''}
              className={style.select}
              options={countries}
              disabled={disable}
              suffixIcon={<DownTriangle />}
              value={state?.countryList?.[0] || ''}
              onChange={val => dispatch({ type: ActionType.countryListChange, payload: val ? [val] : [] })}
            />
          </div>
        ) : (
          ''
        )}

        <div className={style.field} style={{ alignItems: 'flex-start' }}>
          <div className={style.label}>{getTransText('SearchPlatform')}</div>
          <div style={{ flex: 1 }}>
            <Checkbox
              indeterminate={getIndeterminate(-1)}
              disabled={disable}
              onChange={({ target: { checked } }) => onCheckAllChange(checked, -1)}
              checked={getCheckAll(-1)}
            >
              {getTransText('QUANXUAN')}
            </Checkbox>
            {SearchSiteList.map((item, index) => (
              <div style={{ marginTop: 16 }}>
                <Checkbox
                  disabled={disable}
                  indeterminate={getIndeterminate(index)}
                  onChange={({ target: { checked } }) => onCheckAllChange(checked, index)}
                  checked={getCheckAll(index)}
                >
                  {item.label}
                </Checkbox>

                <div>
                  <CheckboxGroup className={style.checkBoxGroup} value={state.siteList} disabled={disable} onChange={list => onCheckChange(list as string[], index)}>
                    {(item.options || []).map(option => {
                      const Icon = IconMap[option.value];
                      return (
                        <Checkbox value={option.value} className={style.checkBox}>
                          <div className={style.checkBoxContent}>
                            {Icon ? <Icon className={style.checkBoxIcon} /> : ''}
                            {option.label}
                          </div>
                        </Checkbox>
                      );
                    })}
                  </CheckboxGroup>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={style.field}>
          <div className={style.label}>{getTransText('SearchEngine')}</div>
          <Select
            dropdownClassName="edm-selector-dropdown"
            value={state.searchEngine}
            className={style.select}
            options={SearchEngine}
            disabled={disable}
            suffixIcon={<DownTriangle />}
            onChange={val => {
              dispatch({ type: ActionType.searchEngineChange, payload: val });
            }}
          />
        </div>

        {state.type !== IntelligentSearchType.Email ? (
          <div className={style.field}>
            <Checkbox
              disabled={disable}
              style={{ padding: '0 12px' }}
              checked={state.excludeDelivered}
              onChange={e => {
                dispatch({ type: ActionType.excludeDeliveredChange, payload: e.target.checked });
              }}
            >
              {state.type === IntelligentSearchType.Phone ? '未发过消息' : '未加群'}
            </Checkbox>
          </div>
        ) : (
          ''
        )}
      </div>
    </Drawer>
  );
};
