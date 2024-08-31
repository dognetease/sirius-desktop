/*
 * @Author: your name
 * @Date: 2022-03-23 11:07:27
 * @LastEditTime: 2022-03-23 11:14:58
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web/src/components/UI/Modal/lowModal.tsx
 */
import React from 'react';
import { Checkbox, Modal } from 'antd';
import { apiHolder as api, DataStoreApi, apis, DataTrackerApi } from 'api';
import IconCard from '@web-common/components/UI/IconCard';
import style from './lowModal.module.scss';
import { getIn18Text } from 'api';
const trackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
export interface LowModalProps {
  title?: string;
  onOk: () => void;
  onCancel: () => void;
}
const storeApi: DataStoreApi = api.api.getDataStoreApi();
class LowModal {
  public antModal = Modal;
  show(lowModalProps: LowModalProps) {
    const { title, onOk, onCancel } = lowModalProps;
    const onCkConfirm = (close: () => void) => {
      const ckClass = document.getElementById('noRemarkCk')?.parentNode?.className;
      // 有没有选中不再提醒
      let noMoreChecked = false;
      if (ckClass?.includes('checked')) {
        storeApi.put('noMoreLowModal', 'true');
        noMoreChecked = true;
      }
      trackerApi.track('pc_low_priority_window_action', {
        select_no: noMoreChecked ? getIn18Text('SHI') : getIn18Text('FOU'),
        follow_action: getIn18Text('QUEREN'),
      });
      onOk && onOk();
      close();
    };
    const onCkCancel = (close: () => void) => {
      const ckClass = document.getElementById('noRemarkCk')?.parentNode?.className;
      // 有没有选中不再提醒
      let noMoreChecked = false;
      if (ckClass?.includes('checked')) noMoreChecked = true;
      trackerApi.track('pc_low_priority_window_action', {
        select_no: noMoreChecked ? getIn18Text('SHI') : getIn18Text('FOU'),
        follow_action: getIn18Text('QUXIAO'),
      });
      onCancel && onCancel();
      close();
    };
    // 内容
    const cont = () => (
      <div className={style.lowModal}>
        <div className={style.lowTitle}>
          <IconCard className={style.fail} type="downloadFail" />
          {title || getIn18Text('QUEDINGYAOJIANGGAI')}
        </div>
        <p className={style.lowIntro}>{getIn18Text('DIYOULIANXIREN')}</p>
        <Checkbox id="noRemarkCk" className={style.noRemark}>
          {getIn18Text('BUZAITIXING')}
        </Checkbox>
        {/* <div className={style.right}>
                    <Button key="cancel" className={style.cancel} onClick={onCkCancel}>取消</Button>
                    <Button key="confirm" className={style.confirm} onClick={onCkConfirm}>确定</Button>
                  </div> */}
      </div>
    );
    return this.antModal.confirm({
      className: style.modalContainer,
      width: '400px',
      icon: '',
      centered: true,
      content: cont(),
      onOk: onCkConfirm,
      onCancel: onCkCancel,
      okText: getIn18Text('QUEREN'),
      cancelText: getIn18Text('QUXIAO'),
    });
  }
}
export default new LowModal();
