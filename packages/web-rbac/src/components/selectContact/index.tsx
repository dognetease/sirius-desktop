import { ContactModel, EntityOrg } from 'api';
import { useAppDispatch } from '@web-common/state/createStore';
import { getEdmUserTreeAsync } from '@web-common/state/reducer/edmUserReducer';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { ContactList } from './selectedList';
import { TreeSelectContact } from './treeSelectContact';

export interface ITreeSelectProps {
  selectedContact?: ContactModel[];
  selectedOrg?: EntityOrg[];
  title?: ReactNode;
  onChange?: (selectedContact: ContactModel[], selectedOrg: EntityOrg[]) => void;
}

export const TreeSelect = (props: ITreeSelectProps) => {
  const [selectedContact, setSelectContact] = useState<ContactModel[]>([]);
  const [selectedOrg, setSelectOrg] = useState<EntityOrg[]>([]);
  const appDispatch = useAppDispatch();

  useEffect(() => {
    props.selectedContact && setSelectContact(props.selectedContact);
  }, [props.selectedContact]);
  useEffect(() => {
    appDispatch(getEdmUserTreeAsync());
  }, []);

  useEffect(() => {
    props.selectedOrg && setSelectOrg(props.selectedOrg);
  }, [props.selectedOrg]);

  const handleDelete = useCallback(
    (item: EntityOrg | ContactModel) => {
      if ('contact' in item) {
        const idx = selectedContact.indexOf(item);
        if (idx !== -1) {
          selectedContact.splice(idx, 1);
          const newContact = [...selectedContact];
          setSelectContact(newContact);
          props.onChange && props.onChange(newContact, selectedOrg);
        }
      } else {
        const idx = selectedOrg.indexOf(item);
        if (idx !== -1) {
          selectedOrg.splice(idx, 1);
          const newOrg = [...selectedOrg];
          setSelectOrg(newOrg);
          props.onChange && props.onChange(selectedContact, newOrg);
        }
      }
    },
    [selectedOrg, selectedContact]
  );

  const data: Array<EntityOrg | ContactModel> = [...selectedOrg, ...selectedContact];

  return (
    <div style={{ display: 'flex', height: 490 }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, borderRight: '1px solid rgba(38, 42, 51, .16)', padding: '12px 12px 0' }}>
        {data.length > 0 && <ContactList selectList={data} showTitle={false} showFooter={false} onDelete={handleDelete} />}
        {data.length === 0 && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ color: 'rgba(38, 42, 51, 0.5)', fontSize: 12 }}>暂未添加任何成员</div>
          </div>
        )}
      </div>
      <div style={{ width: 300 }}>
        <TreeSelectContact
          onSelect={(list, data) => {
            setSelectContact(data);
            props.onChange && props.onChange(data, selectedOrg);
          }}
          onSelectOrg={orgs => {
            setSelectOrg(orgs);
            props.onChange && props.onChange(selectedContact, orgs);
          }}
          defaultSelectList={selectedContact}
          defaultSelectOrgList={selectedOrg}
        />
      </div>
    </div>
  );
};
