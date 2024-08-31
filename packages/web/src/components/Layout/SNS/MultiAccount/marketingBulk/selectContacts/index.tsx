import React, { useState, useEffect } from 'react';
import { useMount } from 'ahooks';
import { TongyongTianjia } from '@sirius/icons';
import { api, apis, InsertWhatsAppApi } from 'api';
import ContactsModal from './contactModal';
import style from './index.module.scss';
import useWAGetData from '../../hooks/useWAGetData';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

interface Props {
  value?: string[];
  onChange?: (whatsApps: string[]) => void;
}

const ContactButton: React.FC<Props> = ({ value, onChange }) => {
  const { sessionWhatsAppNumbers, taskParmas, initParams } = useWAGetData();
  const [open, setOpen] = useState<boolean>(false);
  const [selectNums, setSelectNums] = useState<number>(0);
  const [remainCount, setSendNums] = useState<number>(0);

  useEffect(() => {
    if ((sessionWhatsAppNumbers?.length || taskParmas?.taskId || taskParmas?.groupId) && remainCount) {
      setOpen(true);
    }
  }, [sessionWhatsAppNumbers, taskParmas, remainCount]);

  useMount(() => {
    whatsAppApi.getWaMultiSendQuota().then(res => {
      setSendNums(res.remainCount || 0);
    });
  });

  return (
    <div className={style.container}>
      {value?.length ? (
        <div className={style.contacts}>
          {value?.map(number => (
            <span className={style.tag} key={number}>
              {number}
            </span>
          ))}
        </div>
      ) : null}
      <div className={style.selectBtn} onClick={() => setOpen(true)}>
        <TongyongTianjia /> <span>添加联系人</span>
      </div>
      <ContactsModal
        open={open}
        remainCount={remainCount}
        onClose={() => {
          setOpen(false);
          initParams();
        }}
        sessionWhatsAppNumbers={sessionWhatsAppNumbers}
        taskParmas={taskParmas}
        onContactsChange={whatsapp => {
          onChange && onChange(whatsapp);
          setSelectNums(whatsapp.length);
        }}
      />
      <div className={style.nums}>{`（已选择${selectNums}）`}</div>
    </div>
  );
};

export default ContactButton;
