import React, { useCallback, useMemo, useState } from 'react';
import classnames from 'classnames';
import { IGlobalSearchSub, apiHolder } from 'api';
import { Breadcrumb, PageHeader } from 'antd';
import Alert from '@web-common/components/UI/Alert/Alert';
import KeywordsPageHeader from './KeywordsHeader';
import customsStyles from '../../CustomsData/customs/customs.module.scss';
import styles from './keywordsubscribe.module.scss';
import KeywordsTable from './KeywordsTable';
import { SearchPage as DataSearchPage } from '../search/search';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import { globalSearchDataTracker } from '../tracker';
import { getIn18Text } from 'api';

const isWebWmEntry = apiHolder.api.getSystemApi().isWebWmEntry();

interface KeywordsSubscribeProps extends React.HTMLAttributes<HTMLDivElement> {}
const KeywordsSubscribe: React.FC<KeywordsSubscribeProps> = ({ className, ...rest }) => {
  const [currentSub, setCurrentSub] = useState<IGlobalSearchSub | null>();
  const handleDiplaySub = async (sub: IGlobalSearchSub) => {
    globalSearchDataTracker.trackKeywordSubDetail(sub.type);
    setCurrentSub(sub);
  };
  const handleDelSub = (onOk: () => void) => {
    Alert.destroyAll();
    Alert.warn({
      title: getIn18Text('SHIFOUTUIDINGGUANJIANCI\uFF1F'),
      content: getIn18Text('TUIDINGGUANJIANCIHOU\uFF0CXIANGGUANQIYESHUJUGENGXINSHIJIANGBUZAIXIANGNINFASONGTONGZHI\u3002'),
      okText: getIn18Text('TUIDING'),
      okButtonProps: {
        danger: true,
      },
      onOk,
      okCancel: true,
    });
  };
  const renderSearchPageHeader = useCallback(() => {
    if (!currentSub) {
      return null;
    }
    return (
      <PageHeader
        className={styles.header}
        breadcrumbRender={() => (
          <Breadcrumb separator={<SeparatorSvg />}>
            <Breadcrumb.Item>
              <a
                href="javascript:void(0)"
                onClick={e => {
                  e.preventDefault();
                  setCurrentSub(null);
                }}
              >
                {getIn18Text('CHANPINDINGYUE')}
              </a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{getIn18Text('DINGYUEXIANGQING')}</Breadcrumb.Item>
          </Breadcrumb>
        )}
        title={currentSub.value}
      />
    );
  }, [currentSub]);

  const defaultQ = useMemo(
    () => ({
      query: currentSub?.value || '',
      createTime: currentSub?.watchTime || '',
      renderHeader: renderSearchPageHeader,
    }),
    [currentSub, renderSearchPageHeader]
  );

  return (
    <>
      {currentSub ? (
        <DataSearchPage disableKeyWordSubTip defautQuery={defaultQ} listOnly hideSearchResultTips {...rest} />
      ) : (
        <div className={classnames(customsStyles.customsContainer, className, styles.pageContainer)} {...rest}>
          <KeywordsPageHeader onDel={handleDelSub} />
          <KeywordsTable onDel={handleDelSub} onDisplaySub={handleDiplaySub} />
        </div>
      )}
    </>
  );
};
export default KeywordsSubscribe;
