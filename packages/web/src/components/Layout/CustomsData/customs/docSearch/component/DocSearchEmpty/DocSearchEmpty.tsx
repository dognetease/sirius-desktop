import { CustomsRecordReq } from 'api';
import { ImageEmptyNormal } from '@/components/Layout/globalSearch/search/EmptyResult/EmptyImge';
import { Empty } from 'antd';
import React, { useMemo } from 'react';
import { CustomsSearchType } from '../SearchInput';
import moment from 'moment';
import { navigate } from 'gatsby';
import { Desc, DescOpButton } from '@/components/Layout/globalSearch/search/EmptyResult/AsyncHSCodeResult';
import styles from './docsearchempty.module.scss';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
import { getIn18Text } from 'api';
interface DocSearchEmptyProps {
  searchType?: CustomsSearchType;
  hasRcmd?: boolean;
  params: Partial<CustomsRecordReq>;
  onSearch?: (
    search: {
      type: CustomsSearchType;
      query: string;
    },
    params: Partial<CustomsRecordReq>
  ) => void;
  defuaultDesc?: React.ReactNode;
  // 接口返回报错时，引导兜底字段
  sensitive?: boolean;
}

const DocSearchEmpty: React.FC<DocSearchEmptyProps> = ({ searchType, params, onSearch, hasRcmd, defuaultDesc = getIn18Text('QINGSHURUGUANJIANCI'), sensitive }) => {
  const { end, begin } = params;
  const query = searchType ? params[searchType] : '';
  const showExpandTime = useMemo(() => {
    if (begin && end) {
      const first = moment(begin);
      const last = moment(end);
      return Math.abs(last.diff(first, 'month')) < 60;
    }
    return false;
  }, [begin, end]);
  const handleMaximizeTimeRange = () => {
    if (query && searchType) {
      const now = moment();
      onSearch?.(
        {
          type: searchType,
          query,
        },
        {
          ...params,
          end: now.format('YYYY-MM-DD'),
          begin: now.clone().add(-60, 'month').format('YYYY-MM-DD'),
        }
      );
    }
  };
  const getDesc = () => {
    let desc: React.ReactNode = defuaultDesc;
    let resultOp: React.ReactNode = null;
    // 按产品搜索
    if (query) {
      if (sensitive) {
        return {
          desc: getIn18Text('ZANWUSHUJU'),
          resultOp,
        };
      }

      if (searchType === 'goodsShipped' || searchType === 'queryCompany') {
        desc = '暂无数据，可尝试调整时间范围或使用其他搜索方式';
        resultOp = (
          <div className={styles.group}>
            {showExpandTime && (
              <Button
                btnType="minorGray"
                onClick={() => {
                  handleMaximizeTimeRange();
                }}
              >
                扩大时间范围
              </Button>
            )}
            <Button
              btnType="minorGray"
              onClick={() => {
                navigate(`#wmData?page=globalSearch&searchType=${searchType === 'goodsShipped' ? 'product' : 'company'}&q=${encodeURIComponent(query)}`);
              }}
            >
              全球搜索搜{searchType === 'goodsShipped' ? '产品' : '公司'}
            </Button>
          </div>
        );
      } else if (searchType === 'hsCode') {
        desc = <Desc hasRcmd={hasRcmd} query={query} defaultDesc="暂无数据，可尝试缩减HSCode位数" />;
        resultOp = (
          <DescOpButton
            query={query}
            onSelectClick={param => {
              onSearch?.(
                {
                  type: searchType,
                  query,
                },
                {
                  ...params,
                  hsCode: param,
                }
              );
            }}
          />
        );
      } else if (searchType === 'port') {
        desc = '暂无数据，可尝试调整时间范围 或 使用当地语言搜索';
        resultOp = (
          <>
            {showExpandTime && (
              <Button
                btnType="minorGray"
                onClick={() => {
                  handleMaximizeTimeRange();
                }}
              >
                扩大时间范围
              </Button>
            )}
          </>
        );
      }
    }
    return {
      desc,
      resultOp,
    };
  };
  const { desc, resultOp } = getDesc();
  return (
    <Empty className={styles.empty} description={desc} image={<ImageEmptyNormal />}>
      {resultOp}
    </Empty>
  );
};

export default DocSearchEmpty;
