import { useAppDispatch } from '@web-common/state/createStore';
import { getEdmUserTreeAsync } from '@web-common/state/reducer/edmUserReducer';
import { AdminAccountInfo, apiHolder, apis, ContactApi, ContactModel, EntityOrg, MEMBER_TYPE, OrgApi } from 'api';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import React, { useCallback, useEffect, useState } from 'react';
import { MiniMemberItem } from '../../roleManager/roleDetail';
import { TreeSelectContact } from './treeSelectContact';

export const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;

export interface ITreeSelectMiniProps {
  members: AdminAccountInfo[];
  onChange?: (members: AdminAccountInfo[]) => void;
  readonly?: boolean;
  className?: string;
  selectedClass?: string;
}

export const TreeSelectMini = (props: ITreeSelectMiniProps) => {
  const [selectedContact, setSelectContact] = useState<ContactModel[]>([]);
  const [selectedOrg, setSelectOrg] = useState<EntityOrg[]>([]);
  const appDispatch = useAppDispatch();

  useEffect(() => {
    const orgIds = props.members.filter(i => i.memberType === MEMBER_TYPE.ORG).map(i => i.memberAccId);
    const contactIds = props.members.filter(i => i.memberType === MEMBER_TYPE.ACC).map(i => i.memberAccId);

    if (orgIds.length > 0) {
      contactApi
        .doGetOrgList({
          originIdList: orgIds,
        })
        .then(res => {
          console.log('miniSelectContact', res);
          setSelectOrg(res);
        });
    } else {
      setSelectOrg([]);
    }
    if (contactIds.length) {
      contactApi.doGetContactById(contactIds).then(setSelectContact);
    } else {
      setSelectContact([]);
    }
  }, [props.members]);

  useEffect(() => {
    appDispatch(getEdmUserTreeAsync());
  }, []);

  const handleChange = useCallback(
    (selectedContact: ContactModel[], selectedOrg: EntityOrg[]) => {
      const contactMember = selectedContact.map(i => ({
        memberAccId: i.contact.accountOriginId!,
        memberType: MEMBER_TYPE.ACC,
      }));
      const orgMember = selectedOrg.map(i => ({
        memberType: MEMBER_TYPE.ORG,
        memberAccId: i.originId,
      }));
      const members = [...orgMember, ...contactMember];
      props.onChange && props.onChange(members);
    },
    [props.onChange]
  );

  const orgItems = selectedOrg.map(i => <MiniMemberItem key={i.id} item={i} />);
  const contactItems = selectedContact.map(i => <MiniMemberItem key={i.contact.accountId} item={i} />);
  const allItems = orgItems.concat(contactItems);

  return (
    <div className={props.className}>
      <OverlayScrollbarsComponent options={{ scrollbars: { autoHide: 'leave', autoHideDelay: 0 } }} className={props.selectedClass}>
        {allItems}
      </OverlayScrollbarsComponent>
      <div style={{ width: 300, height: 400, marginTop: -12 }}>
        <TreeSelectContact
          onSelect={(list, data) => {
            setSelectContact(data);
            handleChange(data, selectedOrg);
          }}
          onSelectOrg={orgs => {
            setSelectOrg(orgs);
            handleChange(selectedContact, orgs);
          }}
          defaultSelectList={selectedContact}
          defaultSelectOrgList={selectedOrg}
        />
      </div>
    </div>
  );
};
