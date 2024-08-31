/* eslint-disable @typescript-eslint/no-shadow */
import React, { useEffect, useImperativeHandle, useState } from 'react';
import { api, apis, CustomerApi, FollowsType, ResponseFollowList, getIn18Text } from 'api';
import classnames from 'classnames';
import Select from '@/components/Layout/Customer/components/UI/Select/customerSelect';
import { FollowEditor } from '../../../moments/followEditor';
import { FollowContext } from '../../../moments/follows';
import { FollowList } from './list';
import style from './follows.module.scss';

const customerApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
export interface MailSidebarFollowProps {
  visible: boolean;
  resource: {
    id: string;
    customerType: FollowsType;
  };
  isEdit?: boolean;
  onEditorClose?: () => void;
  disabled?: boolean;
  hasBusiness?: boolean;
}
const FollowsTypeOptions = [
  {
    label: getIn18Text('GENJIN'),
    value: '0',
  },
  {
    label: getIn18Text('FAJIAN'),
    value: '1',
  },
  {
    label: getIn18Text('SHOUJIAN'),
    value: '2',
  },
  {
    label: getIn18Text('RICHENG'),
    value: '3',
  },
  // {
  //   label: getIn18Text('SHANGJI'),
  //   value: '4',
  // },
];

export const MailSidebarFollows = React.forwardRef((props: MailSidebarFollowProps, ref) => {
  const { resource, visible, isEdit, onEditorClose, disabled, hasBusiness } = props;
  const { id, customerType } = resource;
  const [list, setList] = useState<ResponseFollowList>();
  const [editorOptioins, setEditorOptions] = useState({ autoOpen: !!isEdit });
  const [filter, setFilter] = useState<string[]>();
  const fetchData = (id: string, type: FollowsType, category?: string[]) => {
    customerApi
      .getFollowList({
        id,
        type,
        follow_type_list: category ? category.map(v => +v) : undefined,
      })
      .then(data => {
        setList(data);
      })
      .catch(e => {
        console.error(e, 'customerApi getFollowList');
      });
  };
  const handleAdded = () => {
    fetchData(id, customerType, filter);
    onEditorClose && onEditorClose();
  };
  useEffect(() => {
    if (id && customerType) {
      fetchData(id, customerType, filter);
    }
  }, [resource, filter]);
  useEffect(() => {
    visible && setEditorOptions({ autoOpen: !!isEdit });
  }, [!!isEdit, visible]);
  useImperativeHandle(ref, () => ({
    refresh() {
      fetchData(id, customerType, filter);
    },
  }));
  const typeFilterOptions = FollowsTypeOptions.slice(0, hasBusiness ? undefined : -1);
  return (
    <div className={style.followWrap}>
      <FollowContext.Provider value={{ visible: true, id, type: customerType }}>
        <div className={classnames(style.followListScroller, 'sirius-scroll')}>
          {!disabled && (
            <FollowEditor className={style.editor} options={editorOptioins} onSave={handleAdded} onCancelEdit={onEditorClose} foldClassName={style.editorFoldInput} />
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              margin: disabled ? 0 : '16px 0 0',
              alignItems: 'center',
            }}
          >
            <span>{getIn18Text('GENJINJILU')}</span>
            <Select
              options={typeFilterOptions}
              value={filter}
              onChange={v => setFilter(v as string[])}
              mode="multiple"
              // 当前antd版本resposive在按退格键会导致失效
              maxTagCount={1}
              placeholder={getIn18Text('QUANBU')}
              style={{ width: 160, flex: 1, marginLeft: 24 }}
              showSearch={false}
              allowClear
              showArrow
            />
          </div>
          <FollowList data={list?.follow_list} />
        </div>
      </FollowContext.Provider>
    </div>
  );
});
