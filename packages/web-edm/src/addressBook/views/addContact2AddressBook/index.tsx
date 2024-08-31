import React, { useState, useEffect } from 'react';
import { Select, Button, Checkbox, Tooltip } from 'antd';
import { ModalHeader } from '../../components/ModalHeader/index';
import { CheckboxSelect } from '../../components/CheckboxSelect/index';
import { useSelectCheckBox } from '../../hooks/selectCheckBoxHooks';
import { IBaseModalType } from '../baseType';
import styles from './index.module.scss';
import classnames from 'classnames';
import { api, apis, apiHolder, AddressBookApi, GlobalSearchApi, DataStoreApi } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as SyncClueTip } from '@/images/icons/edm/addressBook/sync-clue-tip.svg';
import { GrubProcessCodeEnum, GrubProcessTypeEnum } from '@/components/Layout/globalSearch/search/GrubProcess/constants';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';
import { useAddressRepeatedAction } from '../../hooks/useAddressRepeatedAction';
import { getContactMergeTypeByAction } from './utils';
import { asyncTaskMessage$ } from '../../../../../web/src/components/Layout/globalSearch/search/GrubProcess/GrubProcess';
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const globalSearchApi = apiHolder.api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
export interface IAddContact2AddressBookProps extends IBaseModalType {
  title: string | React.ReactNode;
  origin: string | number;
  contacts: {
    type: number;
    info: string;
    name?: string;
    companyName?: string;
    companySite?: string;
    country?: string;
    phone?: string[];
    socials?: {
      accountId?: string;
      type: number;
    }[];
    verifyStatus?: number;
  }[];
  from?: 'globalSearch';
  idList?: string[];
  tab?: string;
  syncClueVisible?: boolean;
  onSuccess?: (id: number | string, syncClue: boolean) => void;
}
const originOptions: {
  label: string;
  value: number;
}[] = require('../../views/originMap.json');
export function AddContact2AddressBook(props: IAddContact2AddressBookProps) {
  const [isStop, setIsStop] = useState(false);
  const { action, ActionRadioGroup } = useAddressRepeatedAction({ disabled: isStop });
  const { title, visible, onSuccess, id, onError, onClose, origin, contacts, from, idList, tab, syncClueVisible } = props;
  const { options, changeCheckState, unCheckAllOptions, addGroupIfNeed, addOptions } = useSelectCheckBox();
  const [loading, setLoading] = useState(false);
  const [syncClue, setSyncClue] = useState(true);
  const addContact2Book = async () => {
    setLoading(true);
    try {
      await addGroupIfNeed();
    } catch {
      setLoading(false);
      return;
    }
    const groupIds = options.filter(el => el.checked).map(el => el.id);
    if (from === 'globalSearch' && idList) {
      globalSearchApi
        .globalBatchAddAddressBookV1({
          idList,
          groupIds,
          sourceType: transformOrigin(origin as number),
          contactMergeType: getContactMergeTypeByAction(action),
        })
        .then(res => {
          setLoading(false);
          onSuccess && onSuccess(id, syncClue);
          if (res.asyncId) {
            const sendEvent = () => {
              asyncTaskMessage$.next({
                eventName: 'globalSearchGrubTaskAdd',
                eventData: {
                  type: GrubProcessTypeEnum.addressBook,
                  data: {
                    id: res.asyncId,
                    name: `共${idList.length}家公司的联系人`,
                    code: origin === 104 ? GrubProcessCodeEnum.customBatchAddBooks : GrubProcessCodeEnum.globalBatchAddBooks,
                    grubStatus: 'GRUBBING',
                  },
                },
              });
            };
            if (window?.requestIdleCallback) {
              window.requestIdleCallback(
                deadline => {
                  if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
                    sendEvent();
                  }
                },
                { timeout: 500 }
              );
            } else {
              setTimeout(() => {
                sendEvent();
              }, 500);
            }
            message.warning({
              content: getIn18Text('YOUYUJIARUYINGXIAODIZHIBUSHUJUJIAODUO,XUYAOJIAOCHANGSHIJIANWANCHENG'),
            });
          } else {
            message.success(getTransText('DAORUDIZHICHENGGONG'));
          }
        })
        .catch(() => {
          message.error(getTransText('LURUSHIBAI'));
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      console.log(contacts, 'contacts');
      addressBookApi
        .addContact2AddressBook({
          addressRepeatedAction: action,
          contactAddressInfos: contacts.map(el => {
            const { info, type, name, socials = [], companyName, companySite, country, phone, verifyStatus } = el;
            return {
              addressInfos: [
                {
                  contactAddressInfo: info,
                  contactAddressType: type,
                  contactSourceType: Number(origin),
                  groupIds,
                  verifyStatus,
                },
              ],
              contactInfo: {
                companyName,
                companySite,
                country,
                tels: phone,
                contactName: name,
                snsInfos: socials.filter(el => el.accountId && el.accountId.length > 0),
              },
            };
          }),
        })
        .then(() => {
          message.success(`已加入${contacts.length}个联系人`);
          onSuccess && onSuccess(id, syncClue);
        })
        .catch(err => {
          onError && onError(id, err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };
  const transformOrigin = (value: number) => {
    switch (value) {
      case 103: {
        return 0;
      }
      case 104: {
        return 1;
      }
      case 109: {
        return tab === 'company' ? 21 : 2;
      }
      // 智能推荐
      case 110:
        // to modify
        return 110;
      default:
        return 0;
    }
  };

  useEffect(() => {
    addressBookApi.getStopService().then(isStop => {
      setIsStop(isStop);
    });
  }, []);

  return (
    <Modal
      // zIndex={}
      width={417}
      title={<ModalHeader title={title} onClick={() => onClose(id)} />}
      closable={false}
      maskClosable={false}
      visible={visible}
      onCancel={() => onClose(id)}
      className={styles.modal}
      footer={[
        [
          <Button onClick={() => onClose(id)} className={classnames(styles.btn, styles.cancel)}>
            {getIn18Text('QUXIAO')}
          </Button>,
          <Button onClick={addContact2Book} className={classnames(styles.btn, styles.confirm)} loading={loading} type="primary" disabled={isStop}>
            {getIn18Text('QUEDING')}
          </Button>,
        ],
      ]}
    >
      {isStop && <div className={styles.stopTip}>地址簿功能正在升级，暂不支持录入。您可以选择录入线索或直接发起一键营销。</div>}
      <div className={classnames(styles.modalLabel, styles.modalOrigin)}>{getIn18Text('CHUANGJIANFANGSHI')}</div>
      <div className={styles.modalValue}>
        <Select disabled={true} open={false} value={+origin} style={{ width: '100%' }}>
          {originOptions.map(el => {
            return (
              <Select.Option key={el.value} value={el.value}>
                {el.label}
              </Select.Option>
            );
          })}
        </Select>
      </div>
      <div className={classnames(styles.modalLabel, styles.modalAdd)}>{getIn18Text('TIANJIAZHIFENZU')}</div>
      <div className={styles.modalValue}>
        <CheckboxSelect options={options} addGroup={addOptions} checkOption={changeCheckState} uncheckAll={unCheckAllOptions} disabled={isStop} />
      </div>
      <ActionRadioGroup className={styles.actionRadioGroup} />
      {syncClueVisible && (
        <Checkbox className={styles.syncClue} checked={syncClue} disabled={isStop} onChange={e => setSyncClue(e.target.checked)}>
          <div className={styles.checkedboxInner}>
            <span>{getIn18Text('ZIDONGBAOCUNWEIXIANSUO')}</span>
            <Tooltip overlayClassName={styles.syncClueTooltip} title={getIn18Text('GOUXUANHOUSUOXUANGONGSI')}>
              <SyncClueTip className={styles.syncClueTip} />
            </Tooltip>
          </div>
        </Checkbox>
      )}
    </Modal>
  );
}
