import React, { useState, Component } from 'react';
import { Tabs } from 'antd';
import { useLocation } from '@reach/router';
import { useEffect } from 'preact/hooks';
import { getTitleByPath } from '../config/topMenu';

interface TagModel {
  name: string;
  path: string;
  content: typeof Component;
  meta: {
    memo?: false;
  };
}

export interface TagsViewProps {}

export const TagsView = () => {
  const [tags, setTags] = useState<TagModel[]>([]);
  const { hash } = useLocation();

  useEffect(() => {
    //
    if (/#\w+\?page=(\w+)/.test(hash)) {
      setTags(prev => {
        return [
          ...prev,
          {
            name: getTitleByPath(hash),
            path: hash,
          },
        ];
      });
    }
  }, [hash]);
  return (
    <Tabs>
      {tags.map(tag => (
        <Tabs.TabPane destroyInactiveTabPane={tag.meta.memo === false}>
          <tag.content path={tag.path} />
        </Tabs.TabPane>
      ))}
    </Tabs>
  );
};
