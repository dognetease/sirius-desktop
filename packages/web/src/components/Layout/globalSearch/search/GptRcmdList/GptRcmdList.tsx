import { GlobalSearchApi, SystemEvent, api, apis, getIn18Text } from 'api';
import { Subject } from 'rxjs';
import { useMemoizedFn } from 'ahooks';
import useLangOption, { defaultOptions } from '@/components/Layout/CustomsData/customs/search/useLangOption';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import styles from './gptrcmdlist.module.scss';
import { ArrowDownFullfill } from '@/components/Layout/CustomsData/customs/search/searchFilter';
import classNames from 'classnames';
import { useSize } from 'react-use';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
// import { Checkbox } from '@web-common/components/UI/Checkbox';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
import { TongyongJiantou1Xia } from '@sirius/icons';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const wrapperUnfolderHeight = 40;
export const checkAllRcmdList$ = new Subject<SystemEvent>();
interface GptRcmdListProps {
  searchedValue?: string;
  onCheckRmcd?(value: string[], dosearch: boolean): void;
  checkedRcmdList?: string[];
  disableLang?: boolean;
}

const EMPTY_LIST: string[] = [];

const GptRcmdList: React.FC<GptRcmdListProps> = ({ searchedValue, onCheckRmcd, checkedRcmdList = EMPTY_LIST, disableLang = false }) => {
  const defaultLang = defaultOptions[0].gptValue;
  const langOptions = useLangOption(undefined, false);
  const [loading, setLoading] = useState<boolean>(false);
  const [lang, setLang] = useState<string>(defaultLang);
  const [rcmdList, setRcmdList] = useState<string[]>([]);
  const [indeterminate, setIndeterminate] = useState<boolean>(false);
  const [checkAll, setCheckAll] = useState<boolean>(false);
  const [unfolder, setUnfolder] = useState<boolean>(false);
  const [showFolder, setShowFolder] = useState<boolean>(false);
  const [hasFetched, setHasFetched] = useState(false);
  const mergeRcmdList = useMemo(() => {
    return Array.from(new Set([...rcmdList, ...checkedRcmdList]));
  }, [rcmdList, checkedRcmdList]);

  const updateList = (value?: string, language?: string) => {
    if (value && language) {
      onCheckRmcd?.([], false);
      setIndeterminate(false);
      setCheckAll(false);
      setLoading(true);
      setHasFetched(false);
      setLang(language);
      if (/^\d+$/.test(value)) {
        setLoading(false);
        setRcmdList([]);
        return;
      }
      globalSearchApi
        .doGetGlobalSearchGptRcmd({
          value,
          language,
        })
        .then(setRcmdList)
        .catch(() => {
          setRcmdList([]);
        })
        .finally(() => {
          setHasFetched(true);
          setLoading(false);
        });
    }
  };

  const onCheckAllChange = useMemoizedFn((e: CheckboxChangeEvent) => {
    const nextCheckedList = e.target.checked ? rcmdList : [];
    setIndeterminate(false);
    setCheckAll(e.target.checked);
    onCheckRmcd?.(nextCheckedList, true);
  });

  const onChange = (list: CheckboxValueType[]) => {
    onCheckRmcd?.(list as string[], true);
    setIndeterminate(!!list.length && list.length < rcmdList.length);
    setCheckAll(list.length === rcmdList.length);
  };

  const handleLangChange = (selectLang: string) => {
    updateList(searchedValue, selectLang);
    onCheckRmcd?.([], true);
  };

  useEffect(() => {
    setIndeterminate(!!checkedRcmdList.length && checkedRcmdList.length < rcmdList.length);
    setCheckAll(checkedRcmdList.length === rcmdList.length);
  }, [checkedRcmdList.length, rcmdList.length]);

  useEffect(() => {
    updateList(searchedValue, defaultLang);
  }, [searchedValue]);

  useEffect(() => {
    setUnfolder(false);
  }, [mergeRcmdList]);

  useEffect(() => {
    const r = checkAllRcmdList$.subscribe(() => {
      onCheckAllChange({ target: { checked: true } } as any);
    });
    return () => {
      r.unsubscribe();
    };
  }, [onCheckAllChange]);

  const [sized, { height }] = useSize(
    () => (
      <span
        className={styles.checkWrapper}
        style={{ opacity: loading || rcmdList.length === 0 ? 0 : 1, pointerEvents: loading || rcmdList.length === 0 ? 'none' : 'auto' }}
      >
        <Checkbox className={styles.checkAll} indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
          {getIn18Text('QUANXUAN')}
        </Checkbox>
        <Checkbox.Group className={styles.checkGroup} value={checkedRcmdList} onChange={onChange}>
          {mergeRcmdList.map(li => (
            <Checkbox className={styles.checkboxgrid} value={li} key={li}>
              <EllipsisTooltip>{li}</EllipsisTooltip>
            </Checkbox>
          ))}
        </Checkbox.Group>
      </span>
    ),
    { width: 100, height: wrapperUnfolderHeight }
  );

  useEffect(() => {
    setShowFolder(height > wrapperUnfolderHeight);
  }, [height]);

  return (
    <div
      style={{ maxHeight: wrapperUnfolderHeight }}
      className={classNames(styles.wrapper, {
        [styles.wrapperUnfolder]: unfolder,
      })}
    >
      {!loading && hasFetched && rcmdList.length === 0 ? (
        <span className={styles.text}>{getIn18Text('AIWEIKUOZHANCHUXIANGGUANSOUSUOCI')}</span>
      ) : (
        <>
          <span className={styles.text}>{getIn18Text('AIWEININ')}</span>
          {!disableLang && <span className={styles.text}>{getIn18Text('YONG')}</span>}
          {!disableLang && (
            <EnhanceSelect
              className={styles.select}
              suffixIcon={<ArrowDownFullfill />}
              value={lang}
              disabled={loading}
              onChange={handleLangChange}
              // style={{width: "98px"}}
              dropdownMatchSelectWidth={false}
            >
              {[...langOptions, { label: '德语', gptValue: '德语' }, { label: '阿拉伯语', gptValue: '阿拉伯语' }].map(e => (
                <InSingleOption key={e.label} value={e.gptValue}>
                  {e.label}
                </InSingleOption>
              ))}
            </EnhanceSelect>
          )}
          <span className={styles.text}>{getIn18Text('KUOZHANLEYIXIAXIANGGUAN')}</span>
          {loading && (
            <span className={styles.text}>
              {' '}
              <LoadingOutlined spin /> {getIn18Text('JIAZAIZHONG...') + ' '}
            </span>
          )}
          {sized}
          {showFolder && !loading && rcmdList.length > 0 && (
            <div
              className={styles.folder}
              onClick={() => {
                setUnfolder(!unfolder);
              }}
            >
              <span>{!unfolder ? getIn18Text('ZHANKAI') : getIn18Text('SHOUQI')}</span>
              <span
                className={classNames(styles.folderIcon, {
                  [styles.folderIconUnfolder]: unfolder,
                })}
              >
                <TongyongJiantou1Xia color="#4C6AFF" fontSize={16} />
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GptRcmdList;
