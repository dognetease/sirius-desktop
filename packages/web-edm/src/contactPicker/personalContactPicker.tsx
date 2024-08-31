import React, { useState } from 'react';
import classnames from 'classnames';
import { PersonalContact as PersonalContactType } from './usePersonalContactGroup';
import PersonalContactView from './personalContactView';
import PersonalContactGroupView from './personalContactGroupView';
import PersonalContactGroupDetailView from './personalContactGroupDetailView';
import style from './PersonalContactPicker.module.scss';

export type View = 'personal' | 'group' | 'groupDetail';

export type ViewChangeParams = {
  groupKey: string;
  groupTitle: string;
};

interface PersonalContactPickerProps {
  className?: string;
  style?: React.CSSProperties;
  pickedContacts: PersonalContactType[];
  onPickedChange: (contacts: PersonalContactType[]) => void;
}

const PersonalContactPicker: React.FC<PersonalContactPickerProps> = props => {
  const { className, style: styleFromProps, pickedContacts, onPickedChange } = props;

  const [view, setView] = useState<View>('personal');
  const [activeGroupKey, setActiveGroupKey] = useState<string>('');
  const [activeGroupTitle, setActiveGroupTitle] = useState<string>('');

  const handleViewChange = (nextView: View, params?: ViewChangeParams) => {
    setView(nextView);

    if (nextView === 'groupDetail' && params) {
      setActiveGroupKey(params.groupKey);
      setActiveGroupTitle(params.groupTitle);
    }
  };

  return (
    <div className={classnames(style.personalContactPicker, className)} style={styleFromProps}>
      {view === 'personal' && (
        <PersonalContactView defaultCheckedKeys={pickedContacts.map(contact => contact.contactEmail)} onPickedChange={onPickedChange} onViewChange={handleViewChange} />
      )}
      {view === 'group' && <PersonalContactGroupView onPickedChange={onPickedChange} onViewChange={handleViewChange} />}
      {view === 'groupDetail' && (
        <PersonalContactGroupDetailView
          defaultCheckedKeys={pickedContacts.map(contact => contact.contactEmail)}
          groupKey={activeGroupKey}
          groupTitle={activeGroupTitle}
          onPickedChange={onPickedChange}
          onViewChange={handleViewChange}
        />
      )}
    </div>
  );
};

export default PersonalContactPicker;
