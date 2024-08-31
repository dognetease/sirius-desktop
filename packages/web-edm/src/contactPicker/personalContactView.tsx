import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Input, Checkbox, Button } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox';
import { View, ViewChangeParams } from './personalContactPicker';
import usePersonalContactGroup, { PersonalContactGroupItem, PersonalContact } from './usePersonalContactGroup';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import LabelItem from './labelItem';
import ContactItem from './contactItem';
import CustomerItem from './customerItem';
import { UserGuideContext } from '../components/UserGuide/context';
import style from './personalContactView.module.scss';
import { getIn18Text } from 'api';
interface PersonalContactViewProps {
  defaultCheckedKeys: string[];
  onPickedChange: (contacts: PersonalContact[]) => void;
  onViewChange: (view: View, params?: ViewChangeParams) => void;
}
const PersonalContactView: React.FC<PersonalContactViewProps> = props => {
  const { defaultCheckedKeys: defaultCheckedKeysFromProps, onPickedChange, onViewChange } = props;
  const { personalContactGroup: allGroups, personalContacts: allContacts } = usePersonalContactGroup();
  const [searchKey, setSearchKey] = useState<string>('');
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const { state: userGuideState, dispatch: userGuideDispatch = () => {} } = useContext(UserGuideContext);
  const { filteredLabels, filteredGroups, filteredContacts } = useMemo<{
    filteredLabels: PersonalContactGroupItem[];
    filteredGroups: PersonalContactGroupItem[];
    filteredContacts: PersonalContact[];
  }>(() => {
    const filteredLabels: PersonalContactGroupItem[] = [];
    const filteredGroups: PersonalContactGroupItem[] = [];
    const filteredContacts: PersonalContact[] = [];
    allGroups.forEach(group => {
      if (group.title.includes(searchKey)) {
        filteredLabels.push(group);
      }
      const filteredGroupContacts: PersonalContact[] = [];
      group.contacts.forEach(contact => {
        if (filteredContacts.every(filteredContact => filteredContact.contactEmail !== contact.contactEmail)) {
          filteredContacts.push(contact);
        }
        if (contact.contactName.includes(searchKey) || contact.contactEmail.includes(searchKey) || contact.contactPinyin?.includes(searchKey)) {
          filteredGroupContacts.push(contact);
        }
      });
      if (filteredGroupContacts.length) {
        filteredGroups.push({
          ...group,
          contacts: filteredGroupContacts,
        });
      }
    });
    return { filteredLabels, filteredGroups, filteredContacts };
  }, [allGroups, searchKey]);
  const defaultCheckedKeys = useMemo(
    () => filteredContacts.filter(contact => defaultCheckedKeysFromProps.includes(contact.contactEmail)).map(contact => contact.contactEmail),
    [defaultCheckedKeysFromProps, filteredContacts]
  );
  const handleCheckAllChange = (event: CheckboxChangeEvent) => {
    event.target.checked
      ? setCheckedKeys(filteredContacts.filter(contact => !defaultCheckedKeys.includes(contact.contactEmail)).map(contact => contact.contactEmail))
      : setCheckedKeys([]);
  };
  const handleContactClick = (contactEmail: string) => {
    checkedKeys.includes(contactEmail) ? setCheckedKeys(checkedKeys.filter(key => key !== contactEmail)) : setCheckedKeys([...checkedKeys, contactEmail]);
  };
  useEffect(() => {
    if (userGuideState?.currentStep >= 1) {
      return;
    }
    if (checkedKeys.length) {
      userGuideDispatch({ payload: { shouldShow: true, currentStep: 1, hasOperate: false } });
    }
  }, [checkedKeys]);
  return (
    <div className={style.personalContactView}>
      <div className={style.header}>
        <Input
          value={searchKey}
          onChange={event => {
            setSearchKey(event.target.value);
            setCheckedKeys([]);
          }}
          placeholder={getIn18Text('QINGSHURULIANXIRENXINXIHUOFENZUMINGCHENG')}
          prefix={<SearchIcon />}
          allowClear
        />
      </div>
      <div className={style.body}>
        {!filteredLabels.length && !filteredGroups.length && <div className={style.empty}>{getIn18Text('ZANWUSHUJU')}</div>}
        <div className={style.labels}>
          {searchKey ? (
            filteredLabels.map(group => (
              <LabelItem
                key={group.key}
                name={group.title}
                count={group.contacts.length}
                onClick={() => {
                  userGuideDispatch({ payload: { shouldShow: false, hasOperate: true } });
                  onViewChange('groupDetail', {
                    groupKey: group.key,
                    groupTitle: group.title,
                  });
                }}
              />
            ))
          ) : (
            <LabelItem
              key="group"
              name={getIn18Text('TONGXUNLUFENZU')}
              count={allContacts.length}
              onClick={() => {
                userGuideDispatch({ payload: { shouldShow: false, hasOperate: true } });
                onViewChange('group');
              }}
            />
          )}
        </div>
        <div className={style.contacts}>
          {filteredGroups.map(group => (
            <CustomerItem key={group.key} name={group.title} labels={[]}>
              {group.contacts.map(({ contactEmail, contactName }) => (
                <ContactItem
                  key={contactEmail}
                  name={contactName}
                  email={contactEmail}
                  interactive
                  checkable
                  checked={defaultCheckedKeys.includes(contactEmail) || checkedKeys.includes(contactEmail)}
                  disabled={defaultCheckedKeys.includes(contactEmail)}
                  onClick={() => handleContactClick(contactEmail)}
                />
              ))}
            </CustomerItem>
          ))}
        </div>
      </div>
      <div className={style.footer}>
        <Checkbox
          checked={checkedKeys.length > 0 && checkedKeys.length + defaultCheckedKeys.length === filteredContacts.length}
          indeterminate={checkedKeys.length > 0 && checkedKeys.length + defaultCheckedKeys.length < filteredContacts.length}
          disabled={defaultCheckedKeys.length === filteredContacts.length || filteredContacts.length === 0}
          onChange={handleCheckAllChange}
        >
          {getIn18Text('QUANXUAN')}
        </Checkbox>
        <Button
          type="primary"
          loading={false}
          disabled={!checkedKeys.length}
          onClick={() => {
            onPickedChange(filteredContacts.filter(contact => checkedKeys.includes(contact.contactEmail)));
            setCheckedKeys([]);
            userGuideDispatch({ payload: { shouldShow: false, hasOperate: true } });
          }}
        >
          {getIn18Text('TIANJIA')}
        </Button>
      </div>
    </div>
  );
};
PersonalContactView.defaultProps = {
  defaultCheckedKeys: [],
};
export default PersonalContactView;
