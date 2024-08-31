import React, { useEffect, useState } from 'react';
import styles from './index.module.scss';
import classNames from 'classnames';
import { Tooltip } from 'antd';
import Drawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';
import AikeywordsSearch from './AiKeywordsSearch';
import { ReactComponent as LeftlinedIcon } from '@/images/globalSearch/leftLine.svg';
import { ReactComponent as RightlinedIcon } from '@/images/globalSearch/rightLine.svg';
import { api, apis, DataTrackerApi, EdmCustomsApi } from 'api';
import { SearchGlobalIcon } from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { ReactComponent as IconSvg4 } from '@/images/icons/waimao/search-icon-at-input-hover.svg';
import LoadingGif from '@/images/icons/edm/edm_ai_loading.gif';
import aiBackgroundSvg from '@/images/globalSearch/aiKeywordsBackground.svg';
import aiPicture from '@/images/globalSearch/aiDoor.png';
import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import { useIntersection } from 'react-use';
import { getIn18Text } from 'api';
const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const sysApi = api.getSystemApi();

// 搜索类型相关接口
type TSearchType = 'company' | 'domain' | 'product';
type TabSearchType = 'customs' | 'buysers' | 'suppliers';
interface AiKeywordsRecommendProp {
  searchType: TSearchType;
  onSearch: (value: string, type: TSearchType, tabType?: TabSearchType) => void;
  tabType?: TabSearchType;
  from?: 'global' | 'customs';
  smSize?: boolean;
}

const CustomsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

const AiKeywordsRecommend: React.FC<AiKeywordsRecommendProp> = props => {
  const { searchType, onSearch, tabType, from, smSize } = props;
  const [visible, setVisible] = useState<boolean>(false);
  const [useNumber, setUseNumber] = useState<number>(0);
  const [keyWords, setKeyWords] = useState<string[]>([]);
  const [historyList, setHistoryList] = useState<Array<string[]>>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [updatePage, setUpdatePage] = useState<boolean>(false);
  const [historyTypeList, setHistoryTypeList] = useState<TSearchType[]>([]);
  const [historyTabTypeList, setHistoryTabTypeList] = useState<TabSearchType[]>([]);

  const intersectionRef = React.useRef<HTMLDivElement>(null);
  const intersection = useIntersection(intersectionRef, {
    root: null,
    rootMargin: '0px',
    threshold: 1,
  });

  const aiResultTableHeader = () => (
    <div className={classNames(styles.aiHeader, styles.aiResultHeader)}>
      <div className={classNames(styles.aiHeaderTop)}>
        <div className={classNames(styles.aiTitle)}>AI已为您生成以下相似词</div>
        <div className={classNames(styles.rightHeader)}>
          <div className={classNames(styles.checkPage)}>
            <span
              className={classNames(styles.icon)}
              onClick={() => {
                prevPage();
              }}
            >
              <LeftlinedIcon />
            </span>
            <a href="javascript:;" className={classNames(styles.aiUse)} style={{ fontSize: '14px', color: '#000000' }}>
              {page}/{historyList.length}
            </a>
            <span
              className={classNames(styles.icon)}
              onClick={() => {
                nextPage();
              }}
            >
              <RightlinedIcon />
            </span>
          </div>
          <div
            className={classNames(styles.retry)}
            onClick={() => {
              setUpdatePage(true);
              // setLoading(true)
            }}
          >
            换一批
          </div>
        </div>
      </div>
    </div>
  );

  const aiHeader = (num: Number, type: string) => (
    <div className={classNames(styles.aiHeader)}>
      <div className={classNames(styles.aiHeaderTop)}>
        <div className={classNames(styles.aiTitle)}>
          AI推荐搜索词 <div className={classNames(styles.free)}>限时免费</div>
        </div>
        <div className={classNames(styles.aiUse)}>
          <span className={classNames(styles.introText)}>
            今天还可以使用 <span style={{ color: '#4C6AFF' }}>{num}</span> 次
          </span>
          <span
            className={classNames(styles.closeIcon)}
            onClick={() => {
              setVisible(false);
            }}
          >
            <CloseIcon />
          </span>
        </div>
      </div>
      <div className={classNames(styles.intro)}>
        {type === 'product'
          ? 'AI可以帮您打造个性化的搜索词，帮助您快速、准确地搜索出符合您公司产品经营需求的相关信息。'
          : type === 'company'
          ? '通过AI能力帮助您快速寻找同类公司，只需输入目标公司，即可获得定位和经营品类相似公司的推荐结果。'
          : 'AI可根据公司的域名为您推荐同类公司的信息，帮助您更快找到同类公司域名。'}
      </div>
    </div>
  );

  const queryUseNumber = () => {
    CustomsApi.aiKeywordSearchQuota()
      .then(data => {
        setUseNumber(data);
      })
      .catch(e => {
        // console.log(e);
        // window.alert(e)
      });
  };
  const prevPage = () => {
    if (page == 1) {
      return;
    }
    setPage(page - 1);
  };
  const nextPage = () => {
    if (page === historyList.length) {
      return;
    }
    setPage(page + 1);
    // setKeyWords(historyList[page])
  };

  const sliceHistoryList = (value: string[]) => {
    var list = [value, ...historyList];
    return list.slice(0, 3);
  };
  const sliceHistoryTypeList = (value: TSearchType) => {
    // var list = [value, ...historyList]
    return [value, ...historyTypeList].slice(0, 3);
  };

  const sliceHistoryTabTypeList = (value: TabSearchType) => {
    return [value, ...historyTabTypeList].slice(0, 3);
  };
  const tracker = () => {
    if (from) {
      trackerApi.track('aiKeyword_search', {
        from: from === 'global' ? getIn18Text('QUANQIUSOU') : getIn18Text('HAIGUANSHUJU'),
        searchType: searchType === 'product' ? getIn18Text('CHANPIN') : searchType === 'company' ? getIn18Text('GONGSI') : getIn18Text('YUMING'),
      });
    }
  };

  useEffect(() => {
    if (visible) {
      queryUseNumber();
    }
  }, [visible]);

  useEffect(() => {
    if (historyList.length > 0) {
      setKeyWords(historyList[page - 1]);
    }
  }, [page]);

  return (
    <>
      <HollowOutGuide
        guideId={'AI_GLOBAl_GUIDE'}
        title={<span style={{ wordBreak: 'keep-all' }}>试试AI推荐更多搜索词</span>}
        placement="topRight"
        okText="知道了"
        type="3"
        enable={intersection ? intersection.intersectionRatio >= 1 : false}
        // padding={[20, 20, 20, 20]}
      >
        <div ref={intersectionRef} className={classNames(styles.aiPart)}>
          <div
            className={classNames(styles.aiFloatWindow, {
              [styles.aiFloatWindowSm]: smSize,
            })}
            onClick={() => {
              setVisible(true);
              tracker();
            }}
          >
            {/* <img src={aiPictureJump}  alt="" className={styles.pictureJump} /> */}
            <img src={aiPicture} alt="" className={styles.picture} />
          </div>
          <Drawer
            // style={}
            visible={visible}
            contentWrapperStyle={{ width: 468 }}
            // destroyOnClose={true}
            bodyStyle={{ padding: 24, background: `url(${aiBackgroundSvg}) no-repeat  #F4F5F9` }}
            onClose={() => {
              setVisible(false);
            }}
            closable={false}
            // closeIcon={<CloseIcon className={classNames(styles.closeIcon)} />}
            zIndex={1080}
            // className = {classNames(styles.aiDrawer)}
          >
            {/* <p>这是干啥呢啊擦</p> */}
            {aiHeader(useNumber, searchType)}
            <AikeywordsSearch
              visible={visible}
              querySetNumber={() => {
                queryUseNumber();
              }}
              type={searchType}
              createKeyWords={value => {
                setKeyWords(value);
                console.log(historyList);
                setUpdatePage(false);
                setHistoryTypeList(sliceHistoryTypeList(searchType));
                if (tabType) setHistoryTabTypeList(sliceHistoryTabTypeList(tabType));
                setHistoryList(sliceHistoryList(value));
                // setHistoryList
              }}
              loading={value => {
                setLoading(value);
              }}
              updatePage={updatePage}
              useNumber={useNumber}
            />
            <div
              className={classNames(styles.resultTable, {
                [styles.hideTable]: loading,
                [styles.hideLength]: historyList.length === 0,
              })}
            >
              {aiResultTableHeader()}
              <div className={styles.resultBody}>
                {keyWords.map(item => {
                  return (
                    <div
                      className={classNames(styles.keyword)}
                      key={item}
                      onClick={() => {
                        setVisible(false);
                        onSearch(item, historyTypeList[page - 1], historyTabTypeList[page - 1]);
                      }}
                    >
                      <span className={classNames(styles.searchIcon)}>
                        <SearchGlobalIcon />{' '}
                      </span>
                      <span className={classNames(styles.hoverIcon)}>
                        <IconSvg4 />
                      </span>
                      <Tooltip title={item}>
                        <a href="javascript:;" className={classNames(styles.keywordText)}>
                          {item}
                        </a>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              className={classNames(styles.loading, {
                [styles.showLoading]: loading,
              })}
            >
              <img src={LoadingGif} alt="" width="100" height="100" />
            </div>
          </Drawer>
        </div>
      </HollowOutGuide>
    </>
  );
};

export default AiKeywordsRecommend;
