import { api, apis, GlobalSearchApi, TGloabalSearchType } from 'api';
import { Empty, message, Progress } from 'antd';
import React, { useContext, useState } from 'react';
import { isNumber } from '../search';
import { globalSearchDataTracker } from '../../tracker';
import { SubKeyWordContext } from '../../keywordsSubscribe/subcontext';
import { ImageEmptyNormal, ImageGrub } from './EmptyImge';
import styles from './globalsearchempty.module.scss';
import { useTween } from 'react-use';
import { Desc, DescOpButton } from './AsyncHSCodeResult';
import { DynamicProcessText } from '../GrubProcess/GrubProcess';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { getIn18Text } from 'api';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

interface EmptyResultProps {
  searchType?: TGloabalSearchType;
  query?: string;
  disableKeyWordSubTip?: boolean;
  onSearch?(p: string): void;
  hasRcmd?: boolean;
  defaultDesc?: React.ReactNode;
  // 服务端接口报错情况下，默认无数据，表格兜底
  sensitive?: boolean;
}

const DynamicProgress = () => {
  const step = useTween('outQuint', 30000);
  return (
    <Progress
      strokeColor="#4C6AFF"
      strokeLinecap="square"
      style={{
        margin: '0 auto',
        width: 240,
      }}
      strokeWidth={6}
      type="line"
      percent={step * 100 * 0.95}
      showInfo={false}
      trailColor="#EBEDF2"
      className={styles.progress}
    />
  );
};

const EmptyResult: React.FC<EmptyResultProps> = ({
  searchType,
  query,
  disableKeyWordSubTip,
  onSearch,
  hasRcmd,
  defaultDesc = getIn18Text('QINGSHURUGUANJIANCI'),
  sensitive,
}) => {
  const [_, subKeywordDispatch] = useContext(SubKeyWordContext);
  const [deepSearchCompanyLoading, setDeepSearchCompanyLoading] = useState<boolean>(false);
  // 是否搜索hscode
  const searchHSCode = searchType === 'product' && !!query && isNumber(query);
  // 深度搜索方法
  const deepSearchCompany = () => {
    if (query) {
      setDeepSearchCompanyLoading(true);
      globalSearchApi
        .deepSearchCompany(query.trim())
        .then(res => {
          if (res.addRecordNum > 0 && onSearch) {
            onSearch(query);
          } else {
            message.open({
              type: 'info',
              content: getIn18Text('ZANSHIWEINENGWAJUEDAOXINXINXI\uFF01BAOQIAN'),
              duration: 3,
            });
          }
        })
        .catch(err => console.error(err))
        .finally(() => {
          setDeepSearchCompanyLoading(false);
        });
    }
    globalSearchDataTracker.trackSearchEmptyClick();
  };
  const getDesc = () => {
    let desc: React.ReactNode = defaultDesc;
    let resultOp: React.ReactNode = null;
    if (query) {
      if (sensitive) {
        return {
          desc: getIn18Text('ZANWUSHUJU'),
          resultOp,
        };
      }
      if (searchType === 'product') {
        if (searchHSCode) {
          desc = <Desc hasRcmd={hasRcmd} query={query} defaultDesc={'暂无数据，可尝试缩减HSCode位数'} />;
          resultOp = (
            <DescOpButton
              query={query}
              onSelectClick={param => {
                onSearch?.(param);
                globalSearchDataTracker.trackSearchEmptyClick();
              }}
            />
          );
        } else if (!disableKeyWordSubTip) {
          desc = '暂无数据，可尝试订阅关键词，系统将及时通知更新内容';
          resultOp = (
            <Button
              btnType="minorGray"
              onClick={() => {
                globalSearchDataTracker.trackKeywordSubCreate('noResult');
                globalSearchDataTracker.trackSearchEmptyClick();
                subKeywordDispatch({
                  type: 'MODAL_OPEN_CHANGE',
                  payload: {
                    open: true,
                    initForm: {
                      keyword: query,
                      product: isNumber(query) ? 'hscode' : 'product',
                    },
                  },
                });
              }}
            >
              订阅关键词
            </Button>
          );
        }
      } else if (searchType === 'company') {
        if (deepSearchCompanyLoading) {
          desc = <DynamicProcessText />;
          resultOp = <DynamicProgress />;
        } else {
          desc = '暂无数据，可尝试深挖获得更多数据结果';
          resultOp = (
            <Button btnType="minorGray" onClick={deepSearchCompany}>
              深挖公司
            </Button>
          );
        }
      } else if (searchType === 'domain') {
        desc = '暂无数据，请检查域名拼写是否正确';
      }
    }
    return {
      desc,
      resultOp,
    };
  };
  const { desc, resultOp } = getDesc();
  return (
    <Empty className={styles.empty} image={deepSearchCompanyLoading ? <ImageGrub /> : <ImageEmptyNormal />} description={desc}>
      {resultOp}
    </Empty>
  );
};

export default EmptyResult;
