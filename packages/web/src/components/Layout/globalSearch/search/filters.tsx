import React, { useEffect, useMemo, useState } from 'react';
import style from '../globalSearch.module.scss';
import { FilterResultList } from './filterList';
import { CountryFilter } from './countryFilter';
import classNames from 'classnames';
import { getIn18Text } from 'api';
export interface CountryItem {
  code: string;
  name: string;
  cname: string;
  continent: string;
  count: number;
  ccontinent: string;
}
export interface FilterValue {
  country?: string[];
  staffNumMax?: number;
  staffNumMin?: number;
}
export interface GlobalSearchFilterProps {
  countryMap: Record<string, CountryItem[]>;
  resetToken?: string | number;
  onChange: (filterValue: FilterValue) => void;
  hideLabel?: boolean;
  selectedCountryList?: {
    label: string;
    name: string;
  }[];
  clearSelectedCountry?: (param: []) => void;
}
export const GlobalSearchFilter = (props: GlobalSearchFilterProps) => {
  const { countryMap, onChange, resetToken, hideLabel = false, selectedCountryList, clearSelectedCountry } = props;
  const [newCountryMap, setNewCountryMap] = useState<Record<string, CountryItem[]>>({});
  const [letterList, setLetterList] = useState<
    {
      label: string;
      code: string;
    }[]
  >([]);
  const [filterResult, setFilterResult] = useState<
    {
      name: string;
      content: string;
      id: string;
    }[]
  >([]);
  const onFilterClear = (type: string) => {
    clearSelectedCountry && clearSelectedCountry([]);
    const filtered = filterResult.filter(({ id }) => id !== type);
    setFilterResult(filtered);
    if (!filtered.length) {
      onChange({});
    }
  };
  const generateNewMap = () => {
    let dst: {
      [key: string]: CountryItem[];
    } = {
      all: [],
    };
    Object.keys(countryMap).forEach(key => {
      dst.all = dst.all.concat(countryMap[key].map(each => ({ ...each })));
    });
    dst = {
      ...dst,
      ...countryMap,
    };
    setNewCountryMap(dst);
  };
  const onSelectCountries = (
    countries: {
      name: string;
      label: string;
    }[]
  ) => {
    // setFilterText(countries.map(obj => obj.label).join('`'));
    if (selectedCountryList && selectedCountryList.length > 0) {
      setFilterResult([
        {
          name: '',
          content: countries.map(obj => obj.label).join('、'),
          id: 'country',
        },
      ]);
    } else {
      setFilterResult(
        filterResult.concat([
          {
            name: '',
            content: countries.map(obj => obj.label).join('、'),
            id: 'country',
          },
        ])
      );
      onChange({
        country: countries.map(e => e.name),
      });
    }
  };
  const generateLetterList = () => {
    setLetterList(
      [
        {
          label: getIn18Text('SUOYOUGUOJIA'),
          code: 'all',
        },
      ].concat(
        Object.keys(countryMap)
          .filter(key => countryMap[key] && countryMap[key].length > 0)
          .map(key => {
            const array = countryMap[key];
            const first = array[0];
            return {
              label: first.ccontinent,
              code: first.continent,
            };
          })
      )
    );
  };
  useEffect(() => {
    generateNewMap();
    generateLetterList();
    if (selectedCountryList && selectedCountryList.length > 0) {
      clearSelectedCountry && clearSelectedCountry([]);
    }
  }, [countryMap]);
  useEffect(() => {
    setFilterResult([]);
    setNewCountryMap({});
  }, [resetToken]);
  useEffect(() => {
    if (selectedCountryList && selectedCountryList.length > 0) {
      onSelectCountries(selectedCountryList);
    }
  }, [selectedCountryList]);
  const filterHasCountry = useMemo(() => {
    for (const each of filterResult) {
      if (each.id === 'country') {
        return true;
      }
    }
    return false;
  }, [filterResult]);
  return (
    <div
      className={classNames(style.filterContainer, {
        [style.filterContainerHideLabel]: hideLabel,
      })}
    >
      {Object.keys(newCountryMap).length > 0 && !filterHasCountry && (
        <CountryFilter hideLabel={hideLabel} countryMap={newCountryMap} letterList={letterList} resetToken={resetToken} onChange={onSelectCountries} />
      )}
      {filterResult.length > 0 && <FilterResultList hideLabel={hideLabel} filters={filterResult} onClear={onFilterClear} />}
    </div>
  );
};
