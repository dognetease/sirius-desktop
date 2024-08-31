import React, { useCallback, useEffect, useRef, useState } from 'react';
import './index.scss';
import {
  apiHolder,
  apis,
  ContactApi,
  ContactModel,
  EntityContact,
  KeyOfEntityContactItem,
  OrgApi,
  HtmlApi,
  ProductTagEnum,
  api,
  CustomerContactSearch,
  ContactItem,
  getIn18Text,
} from 'api';
import debounce from 'lodash/debounce';
import { Select, Spin } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { filterContactSameEmail, transCustomerContactSearch2ContactItem } from '@web-common/components/util/contact';
import Avatar from '@web-common/components/UI/Avatar';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import { buildContactModel, getDisplayEmailInfo } from '@web-common/utils/contact_util';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
// import { doUpdateContactMap } from '@web-common/state/reducer/contactReducer';
interface SearchResult {
  id?: string;
  accountId: string;
  contactId: string;
  avatar: string;
  contactName: string;
  unescapedContactName: string;
  accountName: string;
  unescapedAccountName: string;
  orgName: string[];
  contact: EntityContact;
}
interface EmitResult {
  (contactModel: ContactModel | string): void;
}
interface SetVisible {
  (visible: boolean): void;
}
const loadingIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactApi & OrgApi;
const htmlApi = apiHolder.api.requireLogicalApi(apis.htmlApi) as HtmlApi;
const systemApi = api.getSystemApi();

export const MailAt: React.FC<{
  visible: boolean;
  setVisible: SetVisible;
  emitResult: EmitResult;
  resultPos?: 'top' | 'bottom';
}> = ({ visible, setVisible, emitResult, resultPos }) => {
  const dispath = useAppDispatch();
  const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSenderMainEmail);

  const [keyWords, setKeyWords] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [inProcess, setInProcess] = useState(false);
  const [contactList, setContactList] = useState<ContactModel[]>([]);
  const [fetching, setFetching] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const doSearch = useCallback(
    async words => {
      const res = await contactApi
        .doSearch({
          query: words,
          showDisable: false,
          useEdmData: process.env.BUILD_ISEDM,
          exclude: ['orgName', 'orgPYName'],
          _account: curAccount,
        })
        .finally(() => {
          setFetching(false);
        });
      const _curAccount = curAccount || systemApi.getCurrentUser()?.id || '';
      const mainRes: ContactModel[] = res.main[_curAccount]?.contactList || [];
      const mainContactList = filterContactSameEmail(mainRes);

      // edm 数据不需要走 filterContactSameEmail，因为没有企业的概念
      // const edmContactList: ContactModel[] = process.env.BUILD_ISEDM ? res.edm?.contact || [] : [];
      let edmContactList: ContactModel[] = [];
      if (process.env.BUILD_ISEDM && res.edm?.contact) {
        const contactItemArr = res.edm?.contact.map((i: CustomerContactSearch) => transCustomerContactSearch2ContactItem(i));
        edmContactList = contactItemArr.map((i: ContactItem) => buildContactModel(i));
      }
      const filterContactList = [...edmContactList, ...mainContactList];
      setContactList(filterContactList);
      const highlight = (target: string) => {
        // eslint-disable-next-line no-param-reassign
        target = htmlApi.encodeHtml(target);
        return target.replace(new RegExp(`(${words})`, 'g'), '<span class="at-result-highlight">$1</span>');
      };
      return filterContactList.reduce((total, current) => {
        const baseResult = {
          accountId: current.contact.accountId,
          contactId: current.contact.id,
          avatar: current.contact.avatar || '',
          contactName: current.contact.contactName,
          unescapedContactName: current.contact.contactName,
          accountName: '',
          unescapedAccountName: '',
          orgName: Array.isArray(current.contact.position) && current.contact.position.length > 0 ? current.contact.position.slice(0, 2).map(v => v.join('/')) : [],
          contact: current.contact,
        };
        // 高亮关键字（姓名）
        if (current.contact.hitQuery && current.contact.hitQuery.includes('contactName')) {
          baseResult.contactName = highlight(baseResult.contactName);
        }
        const validContactInfo = getDisplayEmailInfo(current.contactInfo);
        if (validContactInfo.length > 0) {
          const result = [validContactInfo[0]].map(v => {
            // 高亮关键字（Email）
            let accountName = v.contactItemVal ? `&lt;${v.contactItemVal}&gt;` : '';
            if (v.hitQuery && v.hitQuery.includes('contactItemVal')) {
              accountName = `&lt;${highlight(v.contactItemVal)}&gt;`;
            }
            return {
              ...baseResult,
              id: v.id,
              accountName,
              unescapedAccountName: v.contactItemVal ? v.contactItemVal : '',
            };
          });
          return [...total, ...result];
        }
        return [...total, baseResult];
      }, [] as SearchResult[]);
    },
    [keyWords, curAccount]
  );
  const reset = useCallback(() => {
    setKeyWords('');
    setSearchResults([]);
    setVisible(false);
  }, [setKeyWords, setSearchResults, setVisible]);
  const searchHandler = useCallback(
    async words => {
      if (!inProcess || !words) {
        setSearchResults([]);
        setFetching(false);
        return;
      }
      const result = await doSearch(words);
      if (!words) {
        setSearchResults([]);
      } else {
        setSearchResults(result);
      }
    },
    [inProcess, setSearchResults, setFetching]
  );
  const searchContactDebounce = useCallback(debounce(searchHandler, 300), [inProcess]);
  const onResultClick = useCallback(
    (item: SearchResult | string) => {
      if (typeof item === 'string') {
        emitResult(item);
      } else {
        const contactModel = contactList.find(v => v.contact.accountId === item.accountId);
        if (contactModel) {
          // doUpdateContactMap([contactModel]);
          const contactInfo = contactModel.contactInfo.map(v => {
            const hitQuery: KeyOfEntityContactItem[] = v.contactItemVal === item.unescapedAccountName ? ['isDefault'] : [];
            return {
              ...v,
              hitQuery,
            };
          });
          emitResult({ ...contactModel, contactInfo });
        }
      }
      setInProcess(false);
    },
    [contactList]
  );
  const onKeywordsChange = useCallback(
    value => {
      setKeyWords(value);
    },
    [setKeyWords]
  );
  const onSelect = useCallback(
    index => {
      const target = searchResults[index];
      onResultClick(target);
    },
    [searchResults, onResultClick]
  );
  const onKeydown = useCallback(
    e => {
      // 输入 ESC
      if (e.keyCode === 27) {
        reset();
      }
      // 回车选中
      if (e.keyCode === 13) {
        if (searchResults.length === 0) {
          onResultClick(keyWords);
        }
      }
    },
    [searchResults, keyWords]
  );
  useEffect(() => {
    setInProcess(visible);
  }, [visible]);
  useEffect(() => {
    setFetching(!!keyWords);
    setSearchResults([]);
    searchContactDebounce(keyWords);
  }, [keyWords]);
  useEffect(() => {
    if (!inProcess) {
      reset();
    }
  }, [inProcess]);
  if (!inProcess) {
    return <></>;
  }
  // 无数据时元素
  const searchEmptyContent = keyWords ? <p>{getIn18Text('WUCILIANXIREN')}</p> : null;
  const notFoundContent = fetching ? <Spin indicator={loadingIcon} /> : searchEmptyContent;
  // 候选项列表
  const searchOptions = searchResults.map((v, index) => (
    <Select.Option key={v.contactId + (v.id || '')} value={index}>
      <div className="mail-at-search-result-item">
        <Avatar
          item={{ contact: { ...v.contact, color: v.contact.color || '#c4c4c4' } }}
          size={28}
          style={{
            flexGrow: 0,
            flexShrink: 0,
            marginRight: '12px',
          }}
        />
        <div className="mail-at-contact-info">
          <p className="mail-at-contact-info-top" title={v.unescapedAccountName}>
            <span dangerouslySetInnerHTML={{ __html: v.contactName }} />
            <span dangerouslySetInnerHTML={{ __html: v.accountName }} />
          </p>
          {v.orgName.map((org, orgIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <p key={org + orgIndex} className="mail-at-contact-info-bottom" title={org}>
              {org}
            </p>
          ))}
        </div>
      </div>
    </Select.Option>
  ));
  return (
    <div className="mail-at-container">
      <ProductAuthTag tagName={ProductTagEnum.AT_CONTACT}>
        <Select
          autoFocus
          showSearch
          style={{ width: '290px' }}
          value={keyWords || undefined}
          placeholder={getIn18Text('QINGSHURULIANXI')}
          defaultActiveFirstOption
          showArrow={false}
          filterOption={false}
          onSearch={onKeywordsChange}
          onSelect={onSelect}
          onInputKeyDown={onKeydown}
          onBlur={() => setInProcess(false)}
          dropdownClassName="mail-at-search-result"
          notFoundContent={notFoundContent}
          getPopupContainer={() => containerRef.current || document.body}
          listHeight={246}
          dropdownRender={menu => (
            <div>
              {menu}
              {searchOptions}
            </div>
          )}
        >
          {searchOptions}
        </Select>
      </ProductAuthTag>

      <div
        className="mail-at-dropdown-container"
        ref={containerRef}
        style={resultPos === 'top' ? { top: fetching || searchOptions.length === 0 ? '-46px' : '-260px' } : { top: '36px' }}
      />
    </div>
  );
};
