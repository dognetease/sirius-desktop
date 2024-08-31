import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Input, Checkbox, Button } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox';
import { View, ViewChangeParams } from './personalContactPicker';
import usePersonalContactGroup, { PersonalContact } from './usePersonalContactGroup';
import Breadcrumb from './breadcrumb';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import ContactItem from './contactItem';
import CustomerItem from './customerItem';
import { UserGuideContext } from '../components/UserGuide/context';
import style from './personalContactGroupDetailView.module.scss';
import { getIn18Text } from 'api';
interface PersonalContactGroupDetailViewProps {
  groupKey: string;
  groupTitle: string;
  defaultCheckedKeys: string[];
  onPickedChange: (contacts: PersonalContact[]) => void;
  onViewChange: (view: View, params?: ViewChangeParams) => void;
}
const PersonalContactGroupDetailView: React.FC<PersonalContactGroupDetailViewProps> = props => {
  const { groupKey, groupTitle, defaultCheckedKeys: defaultCheckedKeysFromProps, onPickedChange, onViewChange } = props;
  const [searchKey, setSearchKey] = useState<string>('');
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const { state: userGuideState, dispatch: userGuideDispatch = () => {} } = useContext(UserGuideContext);
  const breadcrumbList = [
    { name: getIn18Text('GERENTONGXUNLU'), highlight: true, onClick: () => onViewChange('personal') },
    { name: getIn18Text('TONGXUNLUFENZU'), highlight: true, onClick: () => onViewChange('group') },
    { name: groupTitle },
  ];
  const { personalContactGroupMap } = usePersonalContactGroup();
  const group = useMemo(() => personalContactGroupMap[groupKey], [personalContactGroupMap, groupKey]);
  const filteredContacts = useMemo(() => {
    if (!group) return [];
    return group.contacts.filter(
      contact => contact.contactName.includes(searchKey) || contact.contactEmail.includes(searchKey) || contact.contactPinyin?.includes(searchKey)
    );
  }, [group, searchKey]);
  const defaultCheckedKeys = useMemo(
    () => filteredContacts.filter(contact => defaultCheckedKeysFromProps.includes(contact.contactEmail)).map(contact => contact.contactEmail),
    [defaultCheckedKeysFromProps, filteredContacts]
  );
  const handleCheckAllChange = (event: CheckboxChangeEvent) => {
    if (group) {
      event.target.checked
        ? setCheckedKeys(filteredContacts.filter(contact => !defaultCheckedKeys.includes(contact.contactEmail)).map(contact => contact.contactEmail))
        : setCheckedKeys([]);
    }
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
    <div className={style.personalContactGroupDetailView}>
      <div className={style.header}>
        <Input
          value={searchKey}
          onChange={event => {
            setSearchKey(event.target.value);
            setCheckedKeys([]);
          }}
          placeholder={`请输入联系人信息`}
          prefix={<SearchIcon />}
          allowClear
        />
      </div>
      <Breadcrumb className={style.breadcrumb} list={breadcrumbList} />
      <div className={style.body}>
        {group &&
          (!filteredContacts.length ? (
            <div className={style.empty}>{getIn18Text('ZANWUSHUJU')}</div>
          ) : (
            <div className={style.contacts}>
              <CustomerItem key={group.key} name={group.title} labels={[]}>
                {filteredContacts.map(({ contactEmail, contactName }) => (
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
            </div>
          ))}
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
            userGuideDispatch({ payload: { shouldShow: false, hasOperate: true } });
            onPickedChange(filteredContacts.filter(contact => checkedKeys.includes(contact.contactEmail)));
            setCheckedKeys([]);
          }}
        >
          {getIn18Text('TIANJIA')}
        </Button>
      </div>
    </div>
  );
};
PersonalContactGroupDetailView.defaultProps = {
  defaultCheckedKeys: [],
};
export default PersonalContactGroupDetailView;
