import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Input } from 'antd';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
import { CountryItem } from './filters';
import styles from './countryFilter.module.scss';
import SearchIcon from '../../../../images/icons/waimao/search.svg';
import { getIn18Text, apiHolder, SystemApi } from 'api';
import { TongyongJiantou1Shang, TongyongJiantou1Xia, TongyongTianjia } from '@sirius/icons';
// import { Checkbox } from '@web-common/components/UI/Checkbox';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';

interface ICountryFilterProps {
  countryMap: Record<string, CountryItem[]>;
  hideLabel?: boolean;
  letterList: {
    label: string;
    code: string;
  }[];
  resetToken?: string | number;
  onChange: (
    countries: {
      name: string;
      label: string;
    }[]
  ) => void;
}
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const checkedCountrySet = new Set<string>();
export const CountryFilter = ({ countryMap, letterList, resetToken, onChange, hideLabel = false }: ICountryFilterProps) => {
  const [countries, setCountries] = useState<Array<CountryItem & { checked: boolean }>>([]);
  // const [checkedCountries, setCheckedCountries] = useState<string[]>([]);
  const [searchWord, setSearchWord] = useState('');
  const [isSingleSelect, setIsSingleSelect] = useState(true);
  const [isMultiRow, setIsMultiRow] = useState(false);
  const [activeContinent, setActiveContinent] = useState('all');
  const countryContainEl = useRef<HTMLDivElement>(null);
  const [checkAllGroup, setCheckAllGroup] = useState<Map<string, { indeterminate: boolean; checked: boolean }>>(
    new Map(letterList.map(e => [e.code, { indeterminate: false, checked: false }]))
  );
  let lang = systemApi.getSystemLang();
  const isLangZn = useMemo(() => lang === 'zh', [lang]);
  const toggleIsSingleSelect = () => {
    setIsSingleSelect(!isSingleSelect);
    partialResetState();
  };
  const toggleSMultiRow = () => {
    setIsMultiRow(!isMultiRow);
    partialResetState();
  };

  const partialResetState = () => {
    setActiveContinent('all');
    const newCountries = (countryMap.all ?? []).map(e => ({
      ...e,
      checked: false,
    }));
    setCountries(newCountries);
    setCheckAllGroup(new Map(letterList.map(e => [e.code, { indeterminate: false, checked: false }])));
  };

  const onSearchLetter = (code: string) => {
    setActiveContinent(code);
    setSearchWord('');
    setCountries(
      countryMap[code].map(e => ({
        ...e,
        checked: !!checkedCountrySet.has(e.name),
      }))
    );
  };

  // debounce 节流
  const searchCountry = debounce((word: string) => {
    const allCountries = (countryMap.all || []).map(each => ({
      ...each,
      checked: !!checkedCountrySet.has(each.name),
    }));
    setCountries(allCountries.filter(each => each.name.includes(word) || each.cname.includes(word)));
  }, 300);
  // input搜索和以洲分类是独立的，需互相重置
  const onSearchWord = (key: string) => {
    setSearchWord(key);
    setActiveContinent('all');
    searchCountry(key);
  };

  const checkCountry = (countryCode: string, countryLabel: string) => {
    onChange([
      {
        name: countryCode,
        label: countryLabel,
      },
    ]);
  };
  const submitCheck = () => {
    const checked = [...checkedCountrySet];
    const allCountries = countryMap.all || [];
    const nameCNameMap = allCountries.reduce((acc: { [key: string]: string }, cur) => {
      const { name } = cur;
      const cName = cur.cname;
      acc[name] = cName;
      return acc;
    }, {});
    onChange(
      checked.map(name => ({
        name,
        label: nameCNameMap[name],
      }))
    );
  };

  const resetState = () => {
    if (countryMap.all) {
      setCountries(
        countryMap.all.map(each => ({
          ...each,
          checked: false,
        }))
      );
    }
    checkedCountrySet.clear();
    setActiveContinent('all');
    setIsSingleSelect(true);
    setSearchWord('');
    setCheckAllGroup(new Map(letterList.map(e => [e.code, { indeterminate: false, checked: false }])));
  };

  const onCheckCountry = (name: string, checked: boolean, code: string) => {
    if (checked) {
      checkedCountrySet.add(name);
    } else {
      checkedCountrySet.delete(name);
    }
    setCheckAllGroup(prev => {
      const total = countryMap[code].length;
      const selectLen = countryMap[code].filter(e => checkedCountrySet.has(e.name)).length;
      const group = prev.get(code);
      if (group) {
        prev.set(code, {
          ...group,
          checked: selectLen === total,
          indeterminate: selectLen > 0 && selectLen !== total,
        });
        return new Map(prev);
      }
      return prev;
    });
    setCountries(
      countries.map(each => ({
        ...each,
        checked: !!checkedCountrySet.has(each.name),
      }))
    );
  };

  useEffect(() => {
    resetState();
  }, [countryMap, resetToken]);

  useEffect(() => {
    if (isSingleSelect) {
      checkedCountrySet.clear();
    }
  }, [isSingleSelect]);

  const MultiSelectComp = (
    <div className={styles.multiSelectBtn} onClick={() => toggleIsSingleSelect()}>
      <span className={styles.icon}>
        <TongyongTianjia color="#4C6AFF" fontSize={16} />
      </span>
      {isSingleSelect ? getIn18Text('DUOXUAN') : getIn18Text('DANXUAN')}
    </div>
  );

  const ShowMoreComp = (
    <div className={styles.showMore} onClick={() => toggleSMultiRow()}>
      {!isMultiRow ? (
        <div className={styles.showText}>
          {getIn18Text('GENGDUO')}
          <span className={styles.icon}>
            <TongyongJiantou1Xia color="#4C6AFF" fontSize={16} />
          </span>
        </div>
      ) : (
        <div className={styles.showText}>
          {getIn18Text('SHOUQI')}
          <span className={styles.icon}>
            <TongyongJiantou1Shang color="#4C6AFF" fontSize={16} />
          </span>
        </div>
      )}
    </div>
  );
  useEffect(() => {
    if (!isMultiRow) {
      // if (typeof countryContainEl !== null) {
      //   countryContainEl.current.scroll(0, 0)
      // }
      countryContainEl.current?.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    }
  }, [isMultiRow]);

  const continentComp = (
    <div className={styles.continentList}>
      {letterList.map(({ code, label }) => {
        const renderLabel = (
          <span
            className={classnames(styles.each, activeContinent === code ? styles.active : '')}
            key={code}
            onClick={ev => {
              ev.stopPropagation();
              onSearchLetter(code);
            }}
          >
            {isLangZn ? label : code}
          </span>
        );
        if (!isSingleSelect) {
          return (
            <Checkbox
              key={code}
              indeterminate={checkAllGroup.get(code)?.indeterminate}
              checked={checkAllGroup.get(code)?.checked}
              onChange={ev => {
                const { checked } = ev.target;
                const item = checkAllGroup.get(code);
                if (item) {
                  checkAllGroup.set(code, {
                    ...item,
                    indeterminate: false,
                    checked,
                  });
                  countryMap[code].forEach(e => {
                    checked ? checkedCountrySet.add(e.name) : checkedCountrySet.delete(e.name);
                  });
                  setCountries(prev =>
                    prev.map(e => ({
                      ...e,
                      checked: e.continent === code || code === 'all' ? checked : e.checked,
                    }))
                  );
                }
                if (code === 'all') {
                  checkAllGroup.forEach((v, k) => {
                    checkAllGroup.set(k, {
                      ...v,
                      checked,
                    });
                  });
                } else {
                  let allSelect = true;
                  let selectOne = false;
                  checkAllGroup.forEach((v, k) => {
                    if (k !== 'all') {
                      allSelect = allSelect && v.checked;
                      selectOne = selectOne || v.checked;
                    }
                  });
                  checkAllGroup.set('all', {
                    checked: allSelect,
                    indeterminate: !allSelect && selectOne,
                  });
                }
                setCheckAllGroup(new Map(checkAllGroup));
              }}
            >
              {renderLabel}
            </Checkbox>
          );
        }
        return renderLabel;
      })}
    </div>
  );

  const countryListComp = (
    <div
      className={classnames(styles.body, {
        [styles.bodyHideLabel]: hideLabel,
      })}
      ref={countryContainEl}
    >
      {countries.map(({ cname, count, name }) => (
        <div className={styles.country} style={{ color: '#272E47' }} key={name} onClick={() => checkCountry(name, cname)}>
          {isLangZn ? cname : name}（{count}）
        </div>
      ))}
    </div>
  );

  const renderSearchInput = () => (
    <div className={styles.inputSearch}>
      <Input
        className={styles.antdInput}
        onChange={e => onSearchWord(e.target.value)}
        value={searchWord}
        addonBefore={<img src={SearchIcon} style={{ color: '#37435c', verticalAlign: '-3px' }} />}
        allowClear
      />
    </div>
  );

  return (
    <span className={styles.countryFilter}>
      <div className={classnames([styles.singleSelect])} hidden={!isSingleSelect}>
        {isMultiRow ? (
          <div className={styles.multiRow}>
            <div className={styles.header}>
              <div hidden={hideLabel} className={styles.label}>
                {getIn18Text('GUOJIA/DEQU')}
              </div>
              {continentComp}
              {renderSearchInput()}
              {MultiSelectComp}
              {ShowMoreComp}
            </div>
            {countryListComp}
          </div>
        ) : (
          <div className={styles.singleRow}>
            <div hidden={hideLabel} className={styles.label}>
              {getIn18Text('GUOJIA/DEQU')}
            </div>
            {countryListComp}
            {MultiSelectComp}
            {ShowMoreComp}
          </div>
        )}
      </div>
      <div className={styles.multiSelect} hidden={isSingleSelect}>
        <div className={styles.header}>
          <div hidden={hideLabel} className={styles.label}>
            {getIn18Text('GUOJIA/DEQU')}
          </div>
          {continentComp}
          {renderSearchInput()}
          {MultiSelectComp}
        </div>
        <div
          className={classnames(styles.body, {
            [styles.bodyHideLabel]: hideLabel,
          })}
        >
          {countries.map(each => (
            <Checkbox checked={each.checked} key={each.name} onChange={e => onCheckCountry(each.name, e.target.checked, each.continent)}>
              {isLangZn ? each.cname : each.name}（{each.count}）
            </Checkbox>
          ))}
        </div>
        <div
          className={classnames(styles.footer, {
            [styles.footerHideLabel]: hideLabel,
          })}
        >
          <button className={styles.btn} onClick={submitCheck} disabled={checkedCountrySet.size < 1}>
            {getIn18Text('TIJIAO')}
          </button>
          <button className={styles.btn} onClick={() => resetState()}>
            {getIn18Text('QUXIAO')}
          </button>
        </div>
      </div>
    </span>
  );
};
