import React, { useState, useEffect } from 'react';
import { Button, Input, Radio, Space } from 'antd';
import { api, apis, SiteApi, SystemApi, apiHolder, DataTrackerApi } from 'api';

import { ReactComponent as ArrowDownIcon } from '../../../images/arrow-down-gray.svg';
import styles from './style.module.scss';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;

interface DomainSearchBarProps {
  defaultKeyword: string;
  defaultSuffix: string;
  popoverVisible: boolean;
  setPopoverVisible: (visible: boolean) => void;
  onSearch: (keyword: string, suffix: string) => void;
}

// // 匹配域名前缀，去掉不符合规则的字符，包括空格和特殊字符（如!、@、$等）
// function filterString(str: string) {
//   // 匹配符合要求的字符，包括字母、数字、中文、横线和点号
//   const regex = /[\w\u4e00-\u9fa5.-]+/g;
//   // 使用正则表达式匹配字符串，并将匹配结果拼接起来
//   const filteredStr = (str.match(regex) || []).join('');
//   return filteredStr;
// }

export function DomainSearchBar(props: DomainSearchBarProps) {
  const { defaultKeyword, defaultSuffix, popoverVisible, setPopoverVisible, onSearch } = props;
  const [suffixList, setSuffixList] = useState(['.com']);
  const [keyword, setKeyword] = useState(defaultKeyword || '');
  const [suffix, setSuffix] = useState(defaultSuffix || '.com');

  const handleSubmit = () => {
    trackApi.track('search');
    // 把空格干掉
    let newKeyword = keyword.replaceAll(/\s/g, '');
    let newSuffix = suffix;
    // 如果输入了.点号，特殊处理
    // 例如输入了test.site，把keyword变成test，把suffix变成.site（.site是正确的后缀，自动把后缀改成.site）
    // 如果输入了 a.b.c.d，把keyword变成a，suffix不变（.d不是正确后缀）
    let list = newKeyword.split('.').filter(Boolean);
    let first = list[0];
    let last = list[list.length - 1];
    if (first) {
      newKeyword = first;
    }
    if (last && suffixList.includes('.' + last)) {
      newSuffix = '.' + last;
    }
    // 处理输入框文本后缀是.com.cn情况（两段顶级域名后缀）
    let secondLast = list[list.length - 2];
    if (list.length > 2 && secondLast && suffixList.includes('.' + secondLast + '.' + last)) {
      newSuffix = '.' + secondLast + '.' + last;
    }
    if (newKeyword) {
      onSearch(newKeyword, newSuffix);
    }
    setKeyword(newKeyword);
    setSuffix(newSuffix);
  };

  const getDomainTLDTypes = async () => {
    const data = await siteApi.getDomainTLDTypes();
    setSuffixList(data);
  };

  useEffect(() => {
    getDomainTLDTypes();
  }, []);

  return (
    <div className={styles.bar}>
      <div className={styles.barLeft}>
        <Input placeholder="请输入您想要注册的域名" autoFocus={true} onPressEnter={handleSubmit} value={keyword} onChange={e => setKeyword(e.target.value)} />
        {popoverVisible && (
          <div className={styles.barLeftPopover}>
            {suffixList.map(name => (
              <span
                className={`${styles.barLeftPopoverItem} ${suffix === name ? 'selected' : ''}`}
                onClick={() => {
                  setSuffix(name);
                  setPopoverVisible(false);
                }}
              >
                {name}
              </span>
            ))}
          </div>
        )}
        <div
          className={styles.barLeftSuffixWrapper}
          onClick={e => {
            e.stopPropagation();
            setPopoverVisible(!popoverVisible);
          }}
        >
          <div className={styles.barLeftSuffix}>{suffix}</div>
          <ArrowDownIcon style={popoverVisible ? { transform: 'rotate(180deg)' } : {}} />
        </div>
      </div>
      <Button type="primary" onClick={handleSubmit}>
        搜索域名
      </Button>
    </div>
  );
}
