import { apiHolder, apis, CustomsContinent, CustomsRecordCountry, EdmCustomsApi, resCustomsFollowCountry } from 'api';
import { Checkbox, Col, Input, Row, Tabs } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './countrycompactselect.module.scss';
import { useCustomsCountryHook } from '../../docSearch/component/CountryList/customsCountryHook';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import dictionary from '../../../components/NationalFlag/dictionary';
import countryExtraDictionary from '../../docSearch/component/CountryList/countryExtraDictionary';
import classNames from 'classnames';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { getCheckStatus, getIndeterminateStatus } from './util';
import FollowCountryEdit from './FollowCountryEdit';
import { useDebounce } from 'react-use';
import { SearchIconAtInput } from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { ReactComponent as CloseIcon } from '@/images/icons/customs/close-icon.svg';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

const flagDictionary = countryExtraDictionary.concat(dictionary);

type NationMap = {
  [n: string]: {
    component: string;
  };
};
const nationComponentMap: NationMap = {};
for (const item of flagDictionary) {
  Object.assign(nationComponentMap, {
    [item.code]: {
      component: item.flag && require(`@/images/flags/${item.flag}`),
    },
  });
}

interface CountryCompactSelectProps {
  value?: string[];
  onChange?(value: string[]): void;
  searchType?: string;
}

const CountryCompactSelect: React.FC<CountryCompactSelectProps> = ({ value: propValue = [], onChange, searchType }) => {
  const [continentList, allCountry] = useCustomsCountryHook(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [followCountry, setFollowCountry] = useState<resCustomsFollowCountry[]>([]);
  const [listType, setListType] = useState<'fellow' | 'whole'>('whole');
  const [value, setValue] = useState<string[]>(propValue);
  const [searchValue, setSearchValue] = useState<string>('');
  const [searchedContinentList, setSearchedContinentList] = useState<CustomsContinent[] | null>();
  const [inputFocus, setInputFocus] = useState<boolean>(false);

  // const propsAllChecked = propValue.length > 0 && propValue.length === allCountry.length;
  // const allChecked =  value.length > 0 && value.length === allCountry.length;

  // console.log(allCountry, 'allCountry' , propValue);

  const handleToggle = (target: string[], checked: boolean) => {
    if (value) {
      if (checked) {
        setValue(Array.from(new Set(value.concat(target))));
      } else {
        setValue(value.filter(v => !target.includes(v)));
      }
    } else {
      if (checked) {
        setValue(target);
      } else {
        setValue([]);
      }
    }
  };

  const valueInChinese = useMemo(() => {
    // followCountry.filter(item => value.includes(item.country)).map(item => item.countryChinese)
    if (value.length === 0) {
      return [];
    } else {
      let arr: string[] = [];
      let arr2 = [...value];
      followCountry.forEach(item => {
        if (arr2.includes(item.country)) {
          arr.push(item.countryChinese);
          arr2.splice(arr2.indexOf(item.country), 1);
        }
      });
      allCountry.forEach(item => {
        if (arr2.includes(item.name)) {
          arr.push(item.nameCn);
          arr2.splice(arr2.indexOf(item.name), 1);
        }
      });
      return arr;
    }
  }, [value, followCountry, allCountry]);

  const onOk = () => {
    onChange?.(value);
    setModalVisible(false);
  };
  const onCancel = () => {
    setValue(propValue);
    setModalVisible(false);
  };

  const fetchFellowContry = useCallback(() => {
    edmCustomsApi
      .getFollowCountry()
      .then(res => {
        setFollowCountry(
          res.map(ct => {
            const countryCnName = ct.countryChinese;
            const [_, cn = countryCnName] = countryCnName.split('-');
            return {
              ...ct,
              countryChinese: cn,
            };
          })
        );
      })
      .catch(() => setFollowCountry([]));
  }, []);

  useDebounce(
    () => {
      setSearchedContinentList(() => {
        if (value) {
          return continentList.map(cont => {
            return {
              ...cont,
              countries: cont.countries.reduce<CustomsRecordCountry[]>((prev, curv) => {
                const lowerCaseSearchValue = searchValue.toLowerCase();
                if (curv.name.toLowerCase().includes(lowerCaseSearchValue) || curv.nameCn.toLowerCase().includes(lowerCaseSearchValue)) {
                  return prev.concat([curv]);
                }
                return prev;
              }, []),
            };
          });
        }
        return null;
      });
    },
    500,
    [continentList, searchValue]
  );

  // useEffect(() => {
  //   fetchFellowContry();
  // }, [fetchFellowContry]);

  useEffect(() => {
    if (!modalVisible) {
      setListType('whole');
    } else {
      fetchFellowContry();
    }
    setSearchValue('');
  }, [modalVisible]);

  useEffect(() => {
    console.log(propValue, 'initvalue');
    setValue(propValue);
  }, [
    // 用参数的简单字符表示更新，以免引用频繁变化但表达值不变
    propValue.toString(),
  ]);

  const handleClose = (id: string) => {
    edmCustomsApi
      .deleteFollowCountry({ countryIdList: [id] })
      .then(res => {
        Toast.success({
          content: getIn18Text('YISHANCHUSHOUCANG'),
        });
        fetchFellowContry();
        // setTimeout(() => updateNationList(), 500);
      })
      .catch(err => {
        console.log('deleteFollowCountry-err: ', err);
      });
  };

  return (
    <>
      {/* <Checkbox
        onChange={({ target: { checked } }) => {
          // 直接操作propsValue
          if (checked) {
            onChange?.(allCountry.map(ct => ct.name));
          } else {
            onChange?.([]);
          }
        }}
        checked={propsAllChecked}
        indeterminate={propValue.length > 0 && propValue.length !== allCountry.length} >
        {getIn18Text("QUANBU")}
      </Checkbox> */}
      <span
        className={styles.changeCountry}
        hidden={valueInChinese.length > 0}
        onClick={() => {
          setModalVisible(true);
          setListType('whole');
        }}
      >
        {`[${getIn18Text('XUANZEGUOJIA')}]`}
      </span>
      <span
        hidden={valueInChinese.length === 0}
        className={styles.countryChinese}
        onClick={() => {
          setModalVisible(true);
          setListType('whole');
        }}
      >
        <span className={styles.countryText}>{valueInChinese.join('、')}</span>
        <span
          className={styles.countryClose}
          onClick={event => {
            event.stopPropagation();
            setValue([]);
            onChange?.([]);
          }}
        >
          {' '}
          <CloseIcon />{' '}
        </span>
      </span>
      <SiriusModal
        title={getIn18Text('XUANZEGUOJIA')}
        visible={modalVisible}
        className={styles.modal}
        width={840}
        bodyStyle={{ position: 'relative', zIndex: 1 }}
        onCancel={onCancel}
        onOk={onOk}
        cancelText={getIn18Text('ZHONGZHI')}
        cancelButtonProps={{
          onClick: () => {
            setValue([]);
          },
        }}
      >
        <OverlayScrollbarsComponent
          options={{
            scrollbars: { autoHide: 'leave', autoHideDelay: 0 },
            overflowBehavior: {
              x: 'hidden',
              y: 'scroll',
            },
          }}
          className={styles.modalContent}
        >
          <Input
            onChange={ev => {
              setSearchValue(ev.target.value);
            }}
            onFocus={() => {
              setInputFocus(true);
            }}
            onBlur={() => {
              setInputFocus(false);
            }}
            value={searchValue}
            prefix={<SearchIconAtInput hover={inputFocus} />}
            placeholder="搜索国家"
            className={styles.searchInput}
            style={{ marginBottom: 16 }}
          />
          <div style={{ marginBottom: '12px' }} className={styles.countryTitle}>
            {getIn18Text('SHOUCANG')}
          </div>
          <div className={styles.continent}>
            <div className={styles.followTitle}>
              {followCountry.length > 1 && (
                <Checkbox
                  checked={getCheckStatus(
                    followCountry.map(fc => fc.country),
                    value
                  )}
                  indeterminate={getIndeterminateStatus(
                    followCountry.map(fc => fc.country),
                    value
                  )}
                  onChange={ev => {
                    const { checked } = ev.target;
                    handleToggle(
                      followCountry.map(fc => fc.country),
                      checked
                    );
                  }}
                >
                  {getIn18Text('QUANBU')}
                </Checkbox>
              )}
              <FollowCountryEdit followCountry={followCountry} onUpdateFollowCountry={fetchFellowContry} />
            </div>
            <Row gutter={[16, 8]} className={styles.list}>
              {followCountry.map(fc => {
                const flag = nationComponentMap[fc.country] || {};
                const checked = value.includes(fc.country);
                return (
                  <Col
                    flex={'0 0 20%'}
                    style={{
                      maxWidth: '20%',
                    }}
                    key={fc.id}
                  >
                    <div
                      className={classNames(styles.item, {
                        [styles.itemSelect]: checked,
                      })}
                      onClick={() => {
                        handleToggle([fc.country], !checked);
                      }}
                    >
                      <i style={{ backgroundImage: flag.component ? `url(${flag.component})` : 'none' }} />
                      <span title={fc.countryChinese} style={{ width: '70px' }} className={styles.name}>
                        {fc.countryChinese}
                      </span>
                      <div
                        className={styles.closeIcon}
                        onClick={event => {
                          event.stopPropagation();
                          handleClose(fc.id);
                        }}
                      >
                        <CloseIcon />
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
          <div style={{ marginBottom: '12px' }} className={styles.countryTitle}>
            {getIn18Text('QUANBU')}
          </div>
          {(searchedContinentList || continentList).map(con => {
            if (con.countries.length === 0) {
              return null;
            }
            const continentAllCountryNames = con.countries.map(e => e.name);
            return (
              <div className={styles.continent} key={con.continent}>
                <Checkbox
                  indeterminate={getIndeterminateStatus(continentAllCountryNames, value)}
                  checked={getCheckStatus(continentAllCountryNames, value)}
                  onChange={ev => {
                    const { checked } = ev.target;
                    handleToggle(continentAllCountryNames, checked);
                  }}
                >
                  {con.continentCn}
                </Checkbox>
                <Row gutter={[16, 8]} className={styles.list}>
                  {con.countries.map(el => {
                    const flag = nationComponentMap[el.name] || {};
                    const checked = value.includes(el.name);
                    return (
                      <Col
                        flex={'0 0 20%'}
                        style={{
                          maxWidth: '20%',
                        }}
                        key={el.name}
                      >
                        <div
                          className={classNames(styles.item, {
                            [styles.itemSelect]: checked,
                          })}
                          onClick={() => {
                            handleToggle([el.name], !checked);
                          }}
                        >
                          <i style={{ backgroundImage: flag.component ? `url(${flag.component})` : 'none' }} />
                          <span title={el.nameCn} className={styles.name}>
                            {el.nameCn}
                          </span>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            );
          })}
        </OverlayScrollbarsComponent>
      </SiriusModal>
    </>
  );
};

export default CountryCompactSelect;
