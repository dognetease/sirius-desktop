import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { apis, apiHolder, DataTrackerApi } from 'api';
import { TempContactActions, ContactActions, useActions, useAppSelector, useAppDispatch } from '@web-common/state/createStore';
import { WriteContext } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';
import SelectList from '@web-common/components/UI/SiriusContact/selectList';
import { ContactTreeOrgNodeType } from '@web-common/components/util/contact';
import ErrorBoundary from '@web-common/hooks/ErrorBoundary';
import { doGetContactModelByContactItem } from '@web-common/state/selector/contact';
import { ContactItem, StaticRootNodeKey } from '@web-common/utils/contact_util';
import { actions as mailActions } from '@web-common/state/reducer/mailReducer';
import debounce from 'lodash/debounce';
import { getIn18Text } from 'api';

const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = apiHolder.api.getSystemApi();

interface Props {}

const WriteContact: React.FC<Props> = () => {
  const { isMailTemplate } = useContext(WriteContext);
  const [searchValue, setSearchValue] = useState<string>('');
  const onContactActions = isMailTemplate ? TempContactActions : ContactActions;
  const { doAddItemToSelector, doFocusSelector } = useActions(onContactActions);
  const { focused } = useAppSelector(state => state.contactReducer.selector);
  const isCorpMail = useAppSelector<boolean>(state => state.loginReducer.loginInfo.isCorpMailMode as boolean);
  const { currentMail } = useAppSelector(state => state.mailReducer);
  const dispatch = useAppDispatch();
  const currentMailCid = useMemo(() => currentMail.cid, [currentMail]);
  const shouldShowOrgContact = !isCorpMail;

  const focusedRef = useRef(focused);
  useEffect(() => {
    focusedRef.current = focused;
  }, [focused]);
  // const mailStatus = useAppSelector(state => (isMailTemplate ? state.mailTemplateReducer.mailTemplateContent.status : state.mailReducer.currentMail.status));
  const handleSelect = async (itemList: ContactItem[]) => {
    const focusType = focusedRef.current || 'to';
    if (!['to', 'bcc', 'cc']?.includes(focusType)) {
      doFocusSelector('to');
    }
    const list = await doGetContactModelByContactItem(itemList, {
      useCompositeQuery4Lx: true,
    });
    doAddItemToSelector({
      add: true,
      pendingItem: list,
    });
  };
  const onExpand = (type: ContactTreeOrgNodeType, isOpen: boolean) => {
    if (type === 'personalOrg') {
      trackApi.track('pcMail_click_allContacts_personalAddress_writeMailPage', {
        status: isOpen ? getIn18Text('ZHANKAI') : getIn18Text('SHOUQI'),
      });
    } else if (type === 'org') {
      trackApi.track('pcMail_click_department_enterpriseAddress_writeMailPage', {
        status: isOpen ? getIn18Text('ZHANKAI') : getIn18Text('SHOUQI'),
      });
    } else if (type === 'team') {
      trackApi.track('pcMail_click_department_groupAddress_writeMailPage', {
        status: isOpen ? getIn18Text('ZHANKAI') : getIn18Text('SHOUQI'),
      });
    }
  };
  const onSearchChange = (value: string) => {
    dispatch(
      mailActions.doChangeMailInfoStatus({
        ...currentMail.status,
        keyword: value,
      })
    );
  };

  const debounceSearch = useCallback(
    debounce(value => {
      onSearchChange(value);
    }, 700),
    [onSearchChange]
  );

  useEffect(() => {
    const { status } = currentMail;
    let searchKeyword = '';
    if (!status) {
      searchKeyword = '';
    } else {
      const { keyword } = status;
      searchKeyword = keyword;
    }
    setSearchValue(searchKeyword);
  }, [currentMailCid]);

  // useEffect(() => {
  //   if (mailStatus) {
  //     const {keyword} = mailStatus;
  //     if (keyword !== searchValue) {
  //       setSearchValue(keyword);
  //     }
  //   }
  // }, [mailStatus]);
  return useMemo(() => {
    return (
      <ErrorBoundary name="writeContact">
        <SelectList
          containerHeight="100%"
          shouldShowOrgContact={shouldShowOrgContact}
          showAddTeamBtn
          showAddOrgBtn
          showSeparator
          showAddPersonalBtn
          showNoDataPlaceholder
          showMailListEye
          useContactId={false}
          type={['personal', 'enterprise', 'team', 'recent']}
          order={['customer', 'recent', 'personal', 'enterprise', 'team']}
          defaultExpandedKeys={[StaticRootNodeKey.ENTERPRISE, StaticRootNodeKey.PERSON]}
          isIM={false}
          showCheckbox={false}
          multiple={false}
          onExpand={onExpand}
          onSelect={handleSelect}
          defaultSearchVal={searchValue}
          useEdm={process.env.BUILD_ISEDM}
          isCustomerFirst={process.env.BUILD_ISEDM}
          searchListProps={{ showAvatar: false }}
          useMultiAccount
          onInputChange={debounceSearch}
          showOrgMemberNum={true}
          flattenPersonalEmails={true}
          deduplicationByEmail={false}
        />
      </ErrorBoundary>
    );
  }, [searchValue]);
};
export default WriteContact;
