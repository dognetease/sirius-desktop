import React, { useState, useEffect } from 'react';
import { apis, apiHolder, WhatsAppApi, WhatsAppPhoneAllotAccount } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
// import { Checkbox } from '@web-common/components/UI/Checkbox';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { TongyongGuanbiMian } from '@sirius/icons';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import Notice from '../../SNS/WhatsAppV2/components/notice/notice';
import style from './BizWaAllotV2.module.scss';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

interface BizWaAllotV2Props {
  visible: boolean;
  phone: string | null;
  onCancel: () => void;
  onFinish: () => void;
}

export const BizWaAllotV2: React.FC<BizWaAllotV2Props> = props => {
  const { visible, phone, onCancel, onFinish } = props;
  const [list, setList] = useState<WhatsAppPhoneAllotAccount[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const handleItemCheck = (accId: string) => {
    if (checkedIds.includes(accId)) {
      setCheckedIds(checkedIds.filter(item => item !== accId));
    } else {
      setCheckedIds([...checkedIds, accId]);
    }
  };

  const handleItemDelete = (accId: string) => {
    setCheckedIds(checkedIds.filter(item => item !== accId));
  };

  const handleAllot = () => {
    if (!phone) return;

    setSubmitting(true);

    whatsAppApi
      .allotPhoneToAccounts({ phone, allotAccIds: checkedIds })
      .then(() => {
        onCancel();
      })
      .finally(() => {
        setSubmitting(false);
        onFinish();
      });
  };

  useEffect(() => {
    if (visible && phone) {
      Promise.all([whatsAppApi.getPhoneAllotAccounts({ phone }), whatsAppApi.getPhoneAllotSelect({ phone })]).then(res => {
        const checkedItems = res[0] || [];
        const uncheckedItems = res[1] || [];

        const nextList: WhatsAppPhoneAllotAccount[] = [...checkedItems, ...uncheckedItems].sort((a, b) => a.accountInfo.accEmail.localeCompare(b.accountInfo.accEmail));

        setList(nextList);
        setCheckedIds(checkedItems.map(item => item.accountInfo.accId));
      });
    } else {
      setList([]);
      setCheckedIds([]);
    }
  }, [visible, phone]);

  return (
    <Modal className={style.bizWaAllotV2} title="管理人员" width={685} visible={visible} okButtonProps={{ loading: submitting }} onCancel={onCancel} onOk={handleAllot}>
      <Notice className={style.notice} type="info">
        同一个账号可提供给多个业务员同时使用
      </Notice>
      <div className={style.container}>
        <div className={style.all}>
          <div className={style.title}>业务员</div>
          <div className={style.list}>
            {list.map(item => {
              const { accId, accName, accEmail } = item.accountInfo;

              return (
                <div className={style.item} key={accId} onClick={() => handleItemCheck(accId)}>
                  <Checkbox className={style.checkbox} checked={checkedIds.includes(accId)} />
                  <AvatarTag className={style.avatar} user={{ name: accName, email: accEmail }} size={32} />
                  <div className={style.name}>
                    {accName} ({accEmail})
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className={style.picked}>
          <div className={style.title}>已添加 ({checkedIds.length})</div>
          <div className={style.list}>
            {list
              .filter(item => checkedIds.includes(item.accountInfo.accId))
              .map(item => {
                const { accId, accName, accEmail } = item.accountInfo;

                return (
                  <div className={style.item} key={accId}>
                    <AvatarTag className={style.avatar} user={{ name: accName, email: accEmail }} size={32} />
                    <div className={style.name}>
                      {accName} ({accEmail})
                    </div>
                    <TongyongGuanbiMian className={style.delete} size={16} onClick={() => handleItemDelete(accId)} />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
