import React, { useEffect, useState } from 'react';
import style from './customsSearch.module.scss';
import { Empty } from 'antd';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import classnames from 'classnames';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { ArrowRight } from './icon';
import { apiHolder, apis, EdmCustomsApi, reqCustomsHsCode as hsCodeType, resCustomsHsCode as hsCodeItemType } from 'api';
import { getIn18Text } from 'api';
const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

interface Props {
  className?: string;
  onClick: (code: string) => void;
  optionValue: string;
}

const HsCode: React.FC<Props> = props => {
  const [list, setList] = useState<hsCodeItemType[]>([]);
  const [currentCode, setCurrentCode] = useState<string[]>([]);
  const [reqParams, setReqParams] = useState<hsCodeType>({
    queryValue: '',
    hsCodeParent: 'TOTAL',
    limit: 100,
  });
  const [reqValue, setReqValue] = useState<string>('');

  useEffect(() => {
    setReqValue(props.optionValue);
    requestList({
      ...reqParams,
      queryValue: props.optionValue,
      hsCodeParent: '',
    });
  }, [props.optionValue]);

  const requestList = (reqParams: hsCodeType) => {
    edmCustomsApi.customsHsCode(reqParams).then(res => {
      res.map(item => {
        item.highHsCodeDesc = item.hsCodeDesc;
        if (item?.highLight?.value) {
          item.highHsCodeDesc = item.highLight.value;
        }
      });
      setList(res);
    });
  };
  const fetchData = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    setReqValue(value);
    const params = {
      ...reqParams,
      queryValue: value,
      hsCodeParent: '',
    };
    requestList(params);
  };

  const getChildren = (parentCode: string) => {
    requestList({
      ...reqParams,
      hsCodeParent: parentCode,
      queryValue: '',
    });
    setReqValue('');
    setCurrentCode([...currentCode, parentCode]);
  };
  const changeList = (code: string, index: number) => {
    requestList({
      ...reqParams,
      hsCodeParent: code,
    });
    setCurrentCode([...currentCode.slice(0, index + 1)]);
  };
  const renderOption = () => {
    return (
      <ul className={classnames(style.hsUl)}>
        {list.length ? (
          list.map((item, index) => {
            return (
              <li className={style.hsLi} key={index}>
                <span className={style.index} onClick={() => props.onClick(item.hsCode)}>
                  {item.hsCode}
                </span>
                {item.hasChildNode ? (
                  <span
                    className={`${style.content} customs-company`}
                    dangerouslySetInnerHTML={{ __html: item.highHsCodeDesc }}
                    onClick={() => getChildren(item.hsCode)}
                  ></span>
                ) : (
                  <span className={`${style.content} customs-company`} dangerouslySetInnerHTML={{ __html: item.highHsCodeDesc }}></span>
                )}
                <span className={style.more} onClick={() => getChildren(item.hsCode)}>
                  {item.hasChildNode && <ArrowRight />}
                </span>
              </li>
            );
          })
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </ul>
    );
  };
  const renderBreadcrumb = () => {
    return (
      <div className={style.breadWrap}>
        {currentCode &&
          currentCode.map((code, index) => {
            return (
              <span key={index}>
                <span
                  className={classnames(style.item, {
                    [style.itemBox]: currentCode.length !== index + 1,
                  })}
                  onClick={() => changeList(code, index)}
                >
                  {code}
                </span>
                {currentCode.length !== index + 1 && <ArrowRight />}
              </span>
            );
          })}
      </div>
    );
  };
  return (
    <div
      className={style.hscodeWrap}
      onClick={e => {
        e.stopPropagation();
      }}
    >
      <div className={style.hsSearch}>
        <Input
          prefix={<SearchIcon />}
          value={reqValue}
          placeholder={getIn18Text('QINGSHURUHSBIANMAHUOSHANGPINMINGCHENG')}
          className={style.hsInput}
          onChange={e => setReqValue(e.target.value)}
          onPressEnter={fetchData}
        />
      </div>
      {currentCode.length ? renderBreadcrumb() : ''}
      {renderOption()}
    </div>
  );
};
HsCode.defaultProps = {};
export default HsCode;
