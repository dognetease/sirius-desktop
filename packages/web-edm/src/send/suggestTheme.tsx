import React from 'react';
import { edmDataTracker } from '../tracker/tracker';
import { Subject } from './setting';
import style from './suggestTheme.module.scss';
import { getIn18Text } from 'api';

export const SuggestTheme: React.FC<Subject> = props => {
  const title = props.emailSubject;
  const tags = props.tagList;
  const type = props.subjectType;

  return (
    <div
      className={style.item}
      onClick={() => {
        edmDataTracker.track('pc_markting_edm_subject_dropdown_list_click', {
          click_type: type === 1 ? getIn18Text('GERENLISHIZHUTI') : getIn18Text('XITONGTUIJIANZHUTI'),
          click_content: title || '',
        });
      }}
    >
      {/* Label区域 */}
      <div>
        <div title={title} className={style.title}>
          {title}
        </div>
      </div>
      {/* 标签区域 */}
      <div className={style.tag}>
        {tags &&
          tags.length > 0 &&
          tags.map(item => {
            return (
              <div title={item.tagDesc} className={style.subTitle}>
                {item.tagDesc}
              </div>
            );
          })}
      </div>
    </div>
  );
};
