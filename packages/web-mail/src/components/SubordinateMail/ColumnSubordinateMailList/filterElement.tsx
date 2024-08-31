import React, { useContext, useState } from 'react';
import classnames from 'classnames';

import { Thunks } from '@web-common/state/reducer/mailReducer';
import { useAppDispatch } from '@web-common/state/createStore';
import { LIST_MODEL } from '@web-mail/common/constant';

import FilterTab from '@web-mail/components/MailColumnEntry/filterTab';
import MailMultiOperation from '@web-mail/components/SubordinateMail/ColumnSubordinateMailList/MaiMultiOperation/MailMultiOperation';
import { SdSliceContext, useState2SubordinateSlice } from '@web-mail/hooks/useState2SliceRedux';

const FilterTabCm: React.FC = () => {
  const sliceId = useContext(SdSliceContext);

  const dispatch = useAppDispatch();

  // 是否点击批量操作取消按钮
  const [clickCancel, setClickCancel] = useState(false);
  // 邮件列表-筛选菜单
  const [condition] = useState2SubordinateSlice('mailTabs');
  // 邮件列表-上部-二级tab选中
  const [selected, setSelected] = useState2SubordinateSlice('mailListStateTab');
  // 快捷键状态
  const [listModel] = useState2SubordinateSlice('defaultMailListSelectedModel');
  const [selectedKeys] = useState2SubordinateSlice('selectedKeys');

  // 点击批量操作取消
  const handleCancel = () => {
    setClickCancel(true);
    setTimeout(() => {
      setClickCancel(false);
    }, 1000);
  };

  // 点击tab
  const clickTab = async (item: any) => {
    setSelected(item.type);
    if (selectedKeys && selectedKeys?.id) {
      dispatch(
        Thunks.loadMailList_edm({
          showLoading: true,
          noCache: false,
          refresh: true,
          sliceId,
          type: 'subordinate',
        })
      );
    }
  };

  return (
    <>
      <div
        style={{ height: '0px' }}
        className={classnames(['m-list-operation', 'm-list-operation1'], {
          ['m-list-operation100']: listModel == LIST_MODEL.MULTIPLE,
          ['m-list-cancel']: clickCancel,
        })}
      >
        <MailMultiOperation cancelFn={handleCancel} />
      </div>
      <FilterTab list={condition} clickItem={clickTab} selectedType={selected} />
    </>
  );
};
export default FilterTabCm;
