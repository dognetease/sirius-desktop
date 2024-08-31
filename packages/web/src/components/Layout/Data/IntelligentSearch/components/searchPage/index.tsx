import React, { useContext } from 'react';
import { Input, Divider, Checkbox, Tooltip, Row, Col } from 'antd';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { apiHolder, apis, DataTrackerApi } from 'api';
import { useMemoizedFn } from 'ahooks';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew';
import { ReactComponent as CheckIcon } from '@/images/icons/customs/check.svg';
import { ReactComponent as SearchIcon } from '@/images/icons/datasearch/searchIcon.svg';
import { ReactComponent as DescIcon1 } from '@/images/icons/IntelligentSearch/search_index_icon1.svg';
import { ReactComponent as DescIcon2 } from '@/images/icons/IntelligentSearch/search_index_icon2.svg';
import { ReactComponent as DescIcon3 } from '@/images/icons/IntelligentSearch/search_index_icon3.svg';
import CustomerTabs from '@/components/Layout/Customer/components/Tabs/tabs';
import { getTransText } from '@/components/util/translate';
import { SearchType, IntelligentSearchContext, ActionType, IntelligentSearchType } from '../../context';
import style from './searchPage.module.scss';
import { WMDATA_ALL_SEARCH_TRACKER_KEY } from '@/components/Layout/globalSearch/tracker';

interface Props {
  onSearch: Function;
}

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
export const SearchPage = (props: Props) => {
  const { onSearch } = props;
  const { state, dispatch } = useContext(IntelligentSearchContext);

  const triggerSearch = () => {
    onSearch();
    trackApi.track('pc_google_search_search', { page: 'search_index' });
    trackApi.track(WMDATA_ALL_SEARCH_TRACKER_KEY);
  };

  const withHollowOutGuide = useMemoizedFn((children: React.ReactNode) =>
    state.inWa ? (
      <HollowOutGuide type="3" guideId="intelligent-search-search-page" title="搜索行业关键词WhatsApp群组和WhatsApp号码" placement="topLeft" padding={[16, 12, 8, 10]}>
        <CustomerTabs
          className={style.companyTabs}
          defaultActiveKey="buysers"
          tabList={SearchType.filter(item => item.value !== IntelligentSearchType.Email || !state.inWa)}
          onChange={val => dispatch({ type: ActionType.typeChange, payload: val })}
          activeKey={state.type}
        />
      </HollowOutGuide>
    ) : (
      children
    )
  );

  return (
    <div className={style.wrapper}>
      <div className={style.head}>
        <h3 className={style.title}>{state.title || getTransText('IntelligentSearch')}</h3>
        <div className={style.desc}>
          <span>
            <CheckIcon />
            <span>{getTransText('IntelligentSearchIndexTip1')}</span>
          </span>
          <span>
            <CheckIcon />
            <span>{getTransText('IntelligentSearchIndexTip2')}</span>
          </span>
          <span>
            <CheckIcon />
            <span>{getTransText('IntelligentSearchIndexTip3')}</span>
          </span>
          <span>
            <CheckIcon />
            <span>{getTransText('IntelligentSearchIndexTip4')}</span>
          </span>
        </div>
        <div className={style.search}>
          {withHollowOutGuide(
            <CustomerTabs
              className={style.companyTabs}
              defaultActiveKey="buysers"
              tabList={SearchType.filter(item => item.value !== IntelligentSearchType.Email || !state.inWa)}
              onChange={val => dispatch({ type: ActionType.typeChange, payload: val })}
              activeKey={state.type}
            />
          )}
          <Input.Group className={style.inputWrap}>
            <Input
              className={style.input}
              prefix={<SearchIcon className={style.inputPreIcon} />}
              placeholder={getTransText('InputCompnameOrProductName')}
              value={state.content}
              onPressEnter={triggerSearch}
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
            {/* <QuestionIcon /> */}
            <Button btnType="primary" className={style.searchBtn} onClick={triggerSearch}>
              {getTransText('SOUSUO')}
            </Button>
          </Input.Group>
        </div>
      </div>
      <div className={style.content}>
        <div className={style.contentTitle}>{getTransText('ProductFeatures')}</div>
        <Row justify="space-between" gutter={20}>
          <Col span={8}>
            <div className={style.descCard}>
              <div className={style.descIcon}>
                <DescIcon1 />
              </div>
              <div className={style.descContent}>
                <div className={style.descTitle}>{getTransText('ProductFeaturesTitle1')}</div>
                <div className={style.descText}>{getTransText('ProductFeaturesDesc1')}</div>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className={style.descCard}>
              <div className={style.descIcon}>
                <DescIcon2 />
              </div>
              <div className={style.descContent}>
                <div className={style.descTitle}>{getTransText('ProductFeaturesTitle2')}</div>
                <div className={style.descText}>{getTransText('ProductFeaturesDesc2')}</div>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className={style.descCard}>
              <div className={style.descIcon}>
                <DescIcon3 />
              </div>
              <div className={style.descContent}>
                <div className={style.descTitle}>{getTransText('ProductFeaturesTitle3')}</div>
                <div className={style.descText}>{getTransText('ProductFeaturesDesc3')}</div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};
