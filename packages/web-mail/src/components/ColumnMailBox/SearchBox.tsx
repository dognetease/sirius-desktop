import React, { useImperativeHandle, useRef, useState, forwardRef, useCallback, useMemo, CompositionEvent, useEffect } from 'react';

import BaseSearchBox from '../BaseSearchBox';
import useState2RM from '../../hooks/useState2ReduxMock';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { useActions, useAppDispatch, MailActions } from '@web-common/state/createStore';
import { Tooltip, Form, Input } from 'antd';
import { actions as mailTabActions } from '@web-common/state/reducer/mailTabReducer';
import InputContextMenu from '@web-common/components/UI/InputContextMenu/InputContextMenu';
// import { Input as LxInput } from '@web-common/components/UI/Input';
import LxInput from '@lingxi-common-component/sirius-ui/Input';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import { accountObj } from '../../types';

import {
  apiHolder as api,
  apis,
  MailApi,
  DataTrackerApi,
  MailBoxModel,
  SystemApi,
  MailSearchTypes,
  ProductTagEnum,
  AccountApi,
  getFolderStartContactId,
  PersonalMarkParams,
} from 'api';
import debounce from 'lodash/debounce';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { getIn18Text } from 'api';

interface Props {
  // props 的类型定义
  totalAccount: accountObj;
  inputValue: string;
  setInputValue: (value: string) => void;
  advancedSearchForm?: any;
}

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.api.getSystemApi() as SystemApi;

const SearchBox: React.FC<Props> = (props, ref) => {
  const { totalAccount, inputValue, setInputValue, advancedSearchForm } = props;
  const reducer = useActions(MailActions);
  const dispatch = useAppDispatch();
  const inputRef = useRef<Input>(null);
  const wrapRef = useRef<HTMLInputElement>(null);
  // const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const [inputHover, setInputHover] = useState<boolean>(false);
  const [searchBoxVisible, setSearchBoxVisible] = useState(false);
  // const [advancedSearchForm] = Form.useForm();
  // 是否显示高级搜索弹窗
  const [advancedSearchVisible, setAdvancedSearchVisible] = useState2RM('advancedSearchVisible', 'doUpdateAdvancedSearchVisible');
  // 邮件-搜索-选中的邮件id
  const [, setSearchMail] = useState2RM('', 'doUpdateActiveSearchMailId');
  // 邮件-搜索-类别
  const [searchType, setSearchType] = useState2RM('mailSearchType', 'doUpdateMailSearchType');
  // 邮件-搜索-是否需要记录
  const [, setMailSearchRecord] = useState2RM('', 'doUpdateMailSearchRecord');
  // 处在拼音输入法的输入中
  const isComposition = useRef(false);
  // 邮件-搜索-搜索状态对象
  const [mailSearchStateMap, doUpdateMailSearchStateMap] = useState2RM('mailSearchStateMap', 'doUpdateMailSearchStateMap');
  // const [totalAccount, setTotalAccount] = useState<accountObj[]>([]);
  // 邮件搜索是否处于loading
  const [, setSearchLoading] = useState2RM('', 'doUpdateMailSearchLoading');
  // 邮件列表是否处于loading
  const [, setListLoading] = useState2RM('', 'doUpdateMailListLoading');
  // 邮件-搜索-关键字
  const [mailSearchKey, setMailSearchKey] = useState2RM('mailSearchKey', 'doUpdateMailSearchKey');
  // 邮件-搜索-搜索类型
  const [mailSearching, doUpdateMailSearching] = useState2RM('mailSearching', 'doUpdateMailSearching');
  // 邮件-搜索-是否处于搜索模式
  const isSearching = useMemo(() => !!mailSearching, [mailSearching]);
  const isAdvancedSearch = useMemo(() => mailSearching === 'advanced', [mailSearching]);
  // 回到默认页签
  const switchDefaultTab = useCallback(() => {
    dispatch(mailTabActions.doChangeCurrentTab('-1'));
  }, []);

  const onSearchTypeChange = useCallback(
    (type: MailSearchTypes, toRecord: boolean) => {
      setSearchMail({
        id: '',
        accountId: '',
      });
      setSearchType(type);
      setMailSearchRecord(toRecord);
    },
    [setSearchMail, setSearchType, setMailSearchRecord]
  );

  // 多账号遍历搜索
  const onSearchMail = useCallback(
    debounce((value: string, account: string) => {
      const sType = mailSearchStateMap[account] || 'local';
      reducer.onSearchMailUpdateTreeStateMap({ account, value });
      dispatch(
        Thunks.searchMail({
          value,
          // 本地搜索则额外搜索云端
          ...(sType === 'local' ? { extraCloud: true } : null),
        })
      );
      trackApi.track('pcMail_executeMailSearch', {
        searchMode: `全文搜索（${sType === 'local' ? '本地' : '云端'}）`,
      });
    }, 500),
    [totalAccount, mailSearchStateMap]
  );

  const onSearchMailRef = useCreateCallbackForEvent(onSearchMail);

  // 当搜索关键词发生变化的时候
  // value-关键词
  // account-重置某个账号下的搜索时传入该账号
  // showLoading-是否展示loading，重置某个账号下的搜索时传入false
  const onSearchChange = useCallback(
    debounce((value, account?: string, showLoading: boolean = true) => {
      switchDefaultTab();
      if (!value) {
        reducer.reseOnSearchChange({});
        // if (Object.values(mailSearchStateMap).some(item => item === 'server')) {
        //   setCurrentAccount();
        //   mailApi.doClearSearchCache().then();
        // }
        advancedSearchForm?.resetFields && advancedSearchForm.resetFields();
        reducer.doResetMailSearch({});
        setAdvancedSearchVisible(false);
      } else {
        !account && setSearchLoading(showLoading);
        setListLoading(true);
        const userInfo = systemApi.getCurrentUser();
        const mainAccount = userInfo?.id || '';
        onSearchMailRef(value, account || totalAccount[0]?.value || mainAccount);
      }
    }, 500),
    []
  );

  const onSearchInputChange = useCallback(
    (inputValue: string) => {
      setSearchMail({
        id: '',

        accountId: '',
      });

      setInputValue(inputValue);

      if (!isComposition.current) {
        setSearchType('all');

        onSearchChange && onSearchChange(inputValue);

        trackApi.track('pcMail_input_searchContent_searchInputBox');

        if (inputValue) {
          setSearchBoxVisible(true);
        }
      }
    },
    [onSearchChange]
  );
  const onSearchInputFocus = useCallback(() => {
    if (isAdvancedSearch && isSearching) {
      setSearchBoxVisible(false);
      setAdvancedSearchVisible(true);
    } else {
      setAdvancedSearchVisible(false);
      trackApi.track('pcMail_click_searchInputBox_topBar');
      setSearchBoxVisible(true);
    }
  }, [isSearching, isAdvancedSearch]);

  const onSearchInputBlur = useCallback((e: { relatedTarget: (EventTarget & Element) | null }) => {
    if (!e?.relatedTarget?.classList?.contains('ant-dropdown-menu-item')) {
      setSearchBoxVisible(false);
    }
  }, []);

  const onCompositionEnd = useCallback(
    (e: CompositionEvent<HTMLInputElement>) => {
      isComposition.current = false;
      onSearchChange && onSearchChange((e.target as HTMLInputElement).value);
      trackApi.track('pcMail_click_enter_keyboard');
    },
    [onSearchChange]
  );

  const onCompositionStart = useCallback(() => {
    isComposition.current = true;
  }, []);

  const SearchInputSuffix = useMemo(() => {
    if (inputHover || isSearching) {
      return (
        <Tooltip title={getIn18Text('GAOJISOUSUO')} placement="right">
          <ProductAuthTag tagName={ProductTagEnum.ADVANCED_SEARCH} tipText={getIn18Text('XIANSHI')}>
            <i
              className="u-mail-search-advanced-icon"
              onClick={e => {
                e.stopPropagation();
                trackApi.track('pcMail_click_advancedSearch');
                // setAdvancedSearchVisible(!advancedSearchVisible);
                setAdvancedSearchVisible(true);
              }}
            />
          </ProductAuthTag>
        </Tooltip>
      );
    }
    return null;
  }, [inputHover, isSearching, advancedSearchVisible]);

  const onPressEnter = useCallback(
    (value: string) => {
      isComposition.current = false;
      setSearchBoxVisible(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
      if (value !== inputValue) {
        onSearchChange && onSearchChange(value);
        trackApi.track('pcMail_click_enter_keyboard');
      }
    },
    [inputValue, onSearchChange]
  );

  useImperativeHandle(ref, () => wrapRef.current);

  useEffect(() => {
    if (advancedSearchVisible && inputRef.current) {
      inputRef.current.blur();
    }
  }, [advancedSearchVisible]);

  // 组件的实现逻辑
  return (
    <div ref={wrapRef} onMouseEnter={() => setInputHover(true)} onMouseLeave={() => setInputHover(false)} className="m-search-container">
      <BaseSearchBox
        visible={searchBoxVisible}
        setVisible={setSearchBoxVisible}
        setAdvancedSearchVisible={setAdvancedSearchVisible}
        searchWord={inputValue || ''}
        setSearchType={type => onSearchTypeChange(type, true)}
        setInputValue={onSearchInputChange}
        onSearchChange={onSearchChange}
        searchType={searchType}
      >
        <InputContextMenu inputOutRef={inputRef} changeVal={setInputValue}>
          <LxInput
            ref={inputRef}
            placeholder={getIn18Text('SOUSUOYOUJIAN')}
            maxLength={100}
            value={typeof inputValue === 'string' ? inputValue : mailSearchKey}
            style={{ padding: 0, paddingLeft: 10 }}
            className="sirius-no-drag"
            onFocus={onSearchInputFocus}
            onBlur={onSearchInputBlur}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            onPressEnter={e => onPressEnter((e.target as HTMLInputElement).value)}
            onChange={e => onSearchInputChange(e.target.value)}
            prefix={<i className="dark-invert m-search-icon" />}
            suffix={SearchInputSuffix}
            allowClear
          />
        </InputContextMenu>
      </BaseSearchBox>
    </div>
  );
};

export default forwardRef(SearchBox);
