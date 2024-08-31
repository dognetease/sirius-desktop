import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { eventApi, globalSearchApi } from '../constants';
import GuideSearch from '../../components/guideSearch/guideSearch';
import { ReactComponent as AlertClose } from '@/images/icons/edm/alert-close-white.svg';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { SearchGuide } from './SearchGuide/SearchGuide';
import styles from './searchResultTip.module.scss';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import { ConfigProvider } from 'antd';
import { checkAllRcmdList$ } from '../search/GptRcmdList/GptRcmdList';

interface Props {
  searchResultNum: number;
  checkAiKeywords: boolean;
  query: string;
}

export type ShowTipsType = 'server' | 'tips' | 'ai' | null;

const MIN_RES_NUM = 500;

export const SearchResultTip: FC<Props> = props => {
  const { query, searchResultNum, checkAiKeywords } = props;
  const [show, toggleShow] = useState<boolean>(false);
  const [type, setType] = useState<ShowTipsType>(null);
  const [searchGuideVisible, setSearchGuideVisible] = useState<boolean>(false);
  const onClose = useCallback(() => {
    toggleShow(false);
  }, []);
  const onBtnClick = useCallback(() => {
    if (type === 'tips' || type === 'server') {
      setSearchGuideVisible(true);
    }
    if (type === 'ai') {
      toggleShow(false);
      checkAllRcmdList$.next({
        eventName: 'globalSearchCheckAllAiKeywords',
        eventData: {},
      });
    }
  }, [type]);
  const fetch = async () => {
    if (!query) return;
    try {
      const res = await globalSearchApi.searchKeywordsRecommendTip();
      if (res) {
        setType('server');
        toggleShow(true);
      } else if (searchResultNum < MIN_RES_NUM) {
        // 纯数字或者勾选了ai扩展词
        setType(checkAiKeywords || /^\d+$/g.test(query) ? 'tips' : 'ai');
        toggleShow(true);
      }
    } catch (e) {
      // do nothing
    }
  };
  useEffect(() => {
    fetch();
  }, [searchResultNum, checkAiKeywords]);
  const content = useMemo(() => {
    if (!type) return '';
    if (type === 'server') return '找不到想要的数据？尝试换词搜索';
    return type === 'tips' ? '数据太少？尝试换词搜索' : '数据太少？AI帮你扩展搜索词';
  }, [type]);
  const btnText = useMemo(() => {
    if (!type) return '';
    return type === 'tips' || type === 'server' ? '查看教程' : '使用AI扩展搜索词';
  }, [type]);
  const onCloseSearchGuideVisible = () => {
    setSearchGuideVisible(false);
  };
  return (
    <>
      <Tooltip
        visible={show}
        placement="topLeft"
        autoAdjustOverflow
        destroyTooltipOnHide
        getPopupContainer={element => element.parentElement || document.body}
        overlayClassName={styles.tipsTooltip}
        title={
          <div className={styles.tipsStyle}>
            <span className={styles.tipsTextStyle}>{content}</span>

            <span style={{ margin: '0 8px' }}>
              <ConfigProvider autoInsertSpaceInButton={false}>
                <Button onClick={() => onBtnClick()} btnType="primary" size="mini">
                  {btnText}
                </Button>
              </ConfigProvider>
            </span>

            <span className={styles.tipsIconStyle}>
              <AlertClose onClick={onClose} />
            </span>
          </div>
        }
        arrowPointAtCenter
      >
        <span style={{ color: '#4C6AFF' }}>{searchResultNum}</span>
      </Tooltip>
      {searchGuideVisible && <SearchGuide visible={searchGuideVisible} onClose={onCloseSearchGuideVisible} />}
    </>
  );
};
