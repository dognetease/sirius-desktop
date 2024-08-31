import React, { useEffect, useState } from 'react';
import { HorizontalCoordinator } from './Horizontal';
import { apiHolder, ContactApi, ContactModel } from 'api';

const contactApi = apiHolder.api.requireLogicalApi('contactApi') as ContactApi;

export interface Cursor {
  borderColor: string;
  userID: string;
  userName: string;
  avatar?: string;
}

export interface CoordinatorProps {
  cursors: Cursor[];
}

export const Coordinator: React.FC<CoordinatorProps> = ({ cursors }) => {
  const [list, setList] = useState<ContactModel[]>([]);
  const [id2CursorColor, setId2CursorColor] = useState<Record<string, string>>({});
  useEffect(() => {
    const id2CursorColor: Record<string, string> = cursors.reduce((acc, cur) => {
      const { userID, borderColor } = cur;
      acc[userID] = borderColor;
      return acc;
    }, {});
    setId2CursorColor(id2CursorColor);
    contactApi.doGetContactById(cursors.map(val => val.userID)).then(infos => {
      setList(infos);
    });
  }, [cursors]);

  return <HorizontalCoordinator list={list} id2CursorColor={id2CursorColor} />;
};
