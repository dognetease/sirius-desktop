import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Input, Checkbox, Button } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox';
import { View, ViewChangeParams } from './personalContactPicker';
import usePersonalContactGroup, { PersonalContactGroupItem, PersonalContact } from './usePersonalContactGroup';
import Breadcrumb from './breadcrumb';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import LabelItem from './labelItem';
import { UserGuideContext } from '../components/UserGuide/context';
import style from './personalContactGroupView.module.scss';
import { getIn18Text } from 'api';
interface PersonalContactGroupViewProps {
  onPickedChange: (contacts: PersonalContact[]) => void;
  onViewChange: (view: View, params?: ViewChangeParams) => void;
}
const PersonalContactGroupView: React.FC<PersonalContactGroupViewProps> = props => {
  const { onPickedChange, onViewChange } = props;
  const [searchKey, setSearchKey] = useState<string>('');
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const { state: userGuideState, dispatch: userGuideDispatch = () => {} } = useContext(UserGuideContext);
  const { personalContactGroup: allGroups } = usePersonalContactGroup();
  const filteredGroups = useMemo<PersonalContactGroupItem[]>(() => allGroups.filter(group => group.title.includes(searchKey)), [allGroups, searchKey]);
  const breadcrumbList = [{ name: getIn18Text('GERENTONGXUNLU'), highlight: true, onClick: () => onViewChange('personal') }, { name: getIn18Text('TONGXUNLUFENZU') }];
  const handleCheckAllChange = (event: CheckboxChangeEvent) => {
    event.target.checked ? setCheckedKeys(filteredGroups.map(group => group.key)) : setCheckedKeys([]);
  };
  const handleLabelCheckedChange = (groupKey: string) => {
    checkedKeys.includes(groupKey) ? setCheckedKeys(checkedKeys.filter(key => key !== groupKey)) : setCheckedKeys([...checkedKeys, groupKey]);
  };
  const handleSubmit = () => {
    const pickedContacts: PersonalContact[] = [];
    filteredGroups
      .filter(group => checkedKeys.includes(group.key))
      .forEach(group => {
        group.contacts.forEach(contact => {
          if (pickedContacts.every(item => item.contactEmail !== contact.contactEmail)) {
            pickedContacts.push(contact);
          }
        });
      });
    onPickedChange(pickedContacts);
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
    <div className={style.personalContactGroupView}>
      <div className={style.header}>
        <Input
          value={searchKey}
          onChange={event => {
            setSearchKey(event.target.value);
            setCheckedKeys([]);
          }}
          placeholder={getIn18Text('QINGSHURUFENZUXINXI')}
          prefix={<SearchIcon />}
          allowClear
        />
      </div>
      <Breadcrumb className={style.breadcrumb} list={breadcrumbList} />
      <div className={style.body}>
        {!filteredGroups.length && <div className={style.empty}>{getIn18Text('ZANWUSHUJU')}</div>}
        <div className={style.labels}>
          {filteredGroups.map(group => (
            <LabelItem
              key={group.key}
              name={group.title}
              count={group.contacts.length}
              checkable
              checked={checkedKeys.includes(group.key)}
              onCheckedChange={() => handleLabelCheckedChange(group.key)}
              onClick={() => {
                userGuideDispatch({ payload: { shouldShow: false, hasOperate: true } });
                onViewChange('groupDetail', {
                  groupKey: group.key,
                  groupTitle: group.title,
                });
              }}
            />
          ))}
        </div>
      </div>
      <div className={style.footer}>
        <Checkbox
          checked={checkedKeys.length > 0 && checkedKeys.length === filteredGroups.length}
          indeterminate={checkedKeys.length > 0 && checkedKeys.length < filteredGroups.length}
          disabled={filteredGroups.length === 0}
          onChange={handleCheckAllChange}
        >
          {getIn18Text('QUANXUAN')}
        </Checkbox>
        <Button type="primary" disabled={!checkedKeys.length} onClick={handleSubmit}>
          {getIn18Text('TIANJIA')}
        </Button>
      </div>
    </div>
  );
};
export default PersonalContactGroupView;
