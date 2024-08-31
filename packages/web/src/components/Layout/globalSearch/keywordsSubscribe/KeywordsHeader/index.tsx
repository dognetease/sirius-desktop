import { Button, PageHeader } from 'antd';
import React, { useContext } from 'react';
import { ReadCountActions, useActions, useAppSelector } from '@web-common/state/createStore';
import Icon from '@ant-design/icons/es/components/Icon';
import { api, apis, GlobalSearchApi } from 'api';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as RefreshIcon } from '@/images/icons/regularcustomer/refresh.svg';
import styles from './keywordheader.module.scss';
import { SubKeyWordContext } from '../subcontext';
import { globalSearchDataTracker } from '../../tracker';
import GuideToolTip from '../GuideTooltip';
import { getIn18Text } from 'api';
const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
interface KeywordsHeaderProps {
  onRefesh?(): void;
  onAddKeywords?(): void;
  onDel?: (onOk: () => void) => void;
}
const KeywordsHeader: React.FC<KeywordsHeaderProps> = ({ onRefesh, onDel }) => {
  const [state, dispatch] = useContext(SubKeyWordContext);
  const readAction = useActions(ReadCountActions);
  const currentCount = useAppSelector(state => state.readCountReducer.unreadCount.globalSearch) || 0;
  const handleBatchDel = async () => {
    onDel?.(async () => {
      try {
        await globalSearchApi.doDeleteSub(state.selectedSubIds);
        SiriusMessage.success(getIn18Text('GUANJIANCIYITUIDING'));
      } catch (error) {}
      dispatch({
        type: 'LIST_SELECTED_CHANGE',
        payload: {
          ids: [],
        },
      });
      dispatch({ type: 'LIST_REFRESH' });
    });
  };
  const handleReflesh = () => {
    currentCount > 0 && globalSearchApi.doReadSubList().then();
    readAction.updateGloablSearchUnreadCount(0);
    dispatch({
      type: 'LIST_REFRESH',
    });
    onRefesh?.();
  };
  const handleOpen = () => {
    globalSearchDataTracker.trackKeywordSubCreate('list');
    dispatch({
      type: 'MODAL_OPEN_CHANGE',
      payload: {
        open: true,
      },
    });
  };
  return (
    <>
      <PageHeader
        title={getIn18Text('CHANPINDINGYUE')}
        className={styles.header}
        subTitle={
          <span className={styles.subTitle}>
            <span className={styles.subTitleText} title={getIn18Text('DANGDINGYUEDEGUANJIANCIXIANGGUANQIYESHUJUYOUGENGXINSHI\uFF0CXITONGJIANGJISHITONGZHI\u3002')}>
              {getIn18Text('DANGDINGYUEDEGUANJIANCIXIANGGUANQIYESHUJUYOUGENGXINSHI\uFF0CXITONGJIANGJISHITONGZHI\u3002')}
            </span>
            <Icon
              onClick={e => {
                handleReflesh();
              }}
              component={RefreshIcon}
              className={styles.syncIcon}
              spin={state.listLoading}
            />
            <span
              onClick={e => {
                handleReflesh();
              }}
              className={styles.reflesh}
            >
              {getIn18Text('SHUAXIN')}
            </span>
          </span>
        }
      />
      <div className={styles.subHeader}>
        <span>
          <GuideToolTip
            prefixId="global_search_keyword_sub_tab"
            getPopupContainer={() => document.getElementsByClassName(styles.subHeader)[0] as HTMLElement}
            placement="bottomLeft"
            title={getIn18Text('TIANJIAJINGCHANGSOUSUODEGUANJIANCI\uFF08RUNINDEQIYEGONGYINGDECHANPINMINGCHENG\uFF09JINXINGDINGYUE\u3002')}
            storeId="global_search_keyword_sub_create"
          >
            <Button onClick={handleOpen} type="primary">
              添加产品订阅
            </Button>
          </GuideToolTip>
        </span>
        {state.selectedSubIds.length > 0 && (
          <button className={styles.buttonDanger} onClick={handleBatchDel}>
            <span>{getIn18Text('PILIANGTUIDING')}</span>
          </button>
        )}
      </div>
    </>
  );
};
export default KeywordsHeader;
