import React, { useState, useEffect } from 'react';
import classnames, { Argument as ClassnamesType } from 'classnames';
import { Checkbox } from 'antd';
import { apiHolder, Session, NIMApi } from 'api';
import { useObservable } from 'rxjs-hooks';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import pinyin from 'tiny-pinyin';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { useYunxinAccounts } from '@web-im/common/hooks/useYunxinAccount';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import style from './forwardPicker.module.scss';

const PICKED_MAX_LENGTH = 10;

export interface PickedItem {
  account: string;
  scene: string;
}

interface ForwardPickerProps {
  className?: ClassnamesType;
  title?: string;
  visible?: boolean;
  okText?: string;
  cancelText?: string;
  onFinish: (picked: PickedItem[]) => void;
  onCancel: () => void;
}

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

const ForwardPicker: React.FC<ForwardPickerProps> = props => {
  const { className, title, visible, okText, cancelText, onCancel, onFinish } = props;

  const sessionList = useObservable(() => {
    const $sessionStream = nimApi.sessionStream.getSubject() as Observable<Session[]>;
    return $sessionStream.pipe(map(list => list.filter(item => !/lx_sys/.test(item.to))));
  }, [] as Session[]);

  const userMap = useYunxinAccounts(sessionList.filter(item => item.scene === 'p2p').map(item => item.to));

  sessionList.forEach((item: any) => {
    const { account, avatar = '', nick: name = '', color } = userMap[item.to] || {};

    item.userInfo = {
      account,
      avatar,
      name,
      color,
    };
  });

  const [searchKey, setSearchKey] = useState<string>('');
  const [picked, setPicked] = useState<string[]>([]);

  const sessionListFilter = item => {
    if (item.scene !== 'p2p') return false;
    if (typeof userMap[item.to] === 'undefined') return false;
    if (searchKey.trim() === '') return true;

    const { name } = item.userInfo;
    const pinyinname = pinyin.convertToPinyin(name).toLocaleLowerCase();

    return name.includes(searchKey) || pinyinname.includes(searchKey.toLocaleLowerCase());
  };

  const sessionPickedFilter = item => {
    if (item.scene !== 'p2p') return false;

    return picked.includes(item.userInfo.account);
  };

  const handlePickerChange = (checked, account) => {
    if (checked) {
      if (picked.length < PICKED_MAX_LENGTH) {
        setPicked(previous => [...previous, account]);
      } else {
        Toast.error({ content: `最多选择${PICKED_MAX_LENGTH}位联系人` });
      }
    } else {
      setPicked(previous => previous.filter(pickedItem => pickedItem !== account));
    }
  };

  const handleOk = () => {
    if (!picked.length) {
      Toast.error({ content: '请选择联系人' });
    } else {
      const pickedParams = sessionList
        .filter(item => picked.includes(item.to))
        .map(item => ({
          account: item.to,
          scene: item.scene,
        }));

      onFinish(pickedParams);
    }
  };

  useEffect(() => {
    !visible && setPicked([]);
  }, [visible]);

  return (
    <Modal
      className={classnames(style.forwardPicker, className)}
      title={title}
      visible={visible}
      okText={okText}
      cancelText={cancelText}
      onCancel={onCancel}
      onOk={handleOk}
    >
      <div className={style.picker}>
        <div className={style.searchFilter}>
          <Input placeholder="搜索联系人" value={searchKey} onChange={event => setSearchKey(event.target.value)} />
        </div>
        <div className={style.recentContact}>最近会话</div>
        <div className={style.pickerList}>
          {sessionList.filter(sessionListFilter).map((item: any) => {
            const { name, avatar, color } = item.userInfo;

            return (
              <Checkbox
                key={item.to}
                className={style.pickerItem}
                checked={picked.includes(item.to)}
                onChange={event => handlePickerChange(event.target.checked, item.to)}
              >
                <div className={style.avatar}>
                  <AvatarTag size={28} user={{ name, avatar, color }} />
                </div>
                <div className={style.name}>{name}</div>
              </Checkbox>
            );
          })}
        </div>
      </div>
      <div className={style.picked}>
        <div className={style.pickedCount}>
          已选：
          {picked.length}/{PICKED_MAX_LENGTH}
        </div>
        <div className={style.pickedList}>
          {sessionList.filter(sessionPickedFilter).map((item: any) => {
            const { name, avatar, color } = item.userInfo;

            return (
              <div key={item.to} className={style.pickedItem}>
                <div className={style.avatar}>
                  <AvatarTag size={28} user={{ name, avatar, color }} />
                </div>
                <div className={style.name}>{name}</div>
                <div className={style.remove} onClick={() => handlePickerChange(false, item.to)} />
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

ForwardPicker.defaultProps = {
  className: '',
  title: '转发到',
  visible: false,
  okText: '确定',
  cancelText: '取消',
  onCancel: () => {},
  onFinish: () => {},
};

export default ForwardPicker;
