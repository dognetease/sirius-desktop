import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';
import { Button, Tag } from 'antd';
import { ModalHeader } from '../../components/ModalHeader/index';
import { CheckboxSelect } from '../../components/CheckboxSelect/index-new';
import classnames from 'classnames';
import { apis, apiHolder, AddressBookNewApi, IAddCotactsToGroup, ITransferContactsToGroup } from 'api';
import { IBaseModalType } from '../baseType';
import { useSelectCheckBox } from '../../hooks/selectCheckBoxHooks-new';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';

const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;

export interface ITransferGroupProps extends IBaseModalType {
  visible: boolean;
  title: string | React.ReactNode;
  isTransfer: boolean;
  sourceGroup: string[];
  addressIds: number[];
  checkedIds?: number[];
}
export function TransferGroup(props: ITransferGroupProps) {
  const { visible, title, isTransfer, sourceGroup, onClose, id, onError, onSuccess, addressIds, checkedIds } = props;
  const [loading, setLoading] = useState(false);
  const { options, changeCheckState, unCheckAllOptions, addGroupIfNeed, addOptions, updateOptionsByIds } = useSelectCheckBox(checkedIds);

  const addContact2Group = (params: IAddCotactsToGroup) => {
    return addressBookNewApi
      .addContact2Group(params)
      .then(() => {
        message.success(`已经将${addressIds.length}个联系人添加${options.filter(el => el.checked).map(el => `[${el.label}]`)}`);
      })
      .catch(err => {
        message.error(getIn18Text('TIANJIASHIBAI\uFF0CQINGZHONGSHI'));
        throw new Error(err);
      });
  };

  const transferOtherGroup = (params: ITransferContactsToGroup) => {
    return addressBookNewApi
      .transferContact2Group(params)
      .then(() => {
        message.success(`已经将${addressIds.length}个联系人添加${options.filter(el => el.checked).map(el => `[${el.label}]`)}`);
      })
      .catch(err => {
        throw new Error(err);
      });
  };

  const changeGroup = async () => {
    if (options.filter(el => el.checked).length === 0) {
      message.error(getIn18Text('QINGXUANZEFENZU'));
      return;
    }
    setLoading(true);
    // update 分组
    try {
      await addGroupIfNeed();
    } catch {
      setLoading(false);
      return;
    }
    let transfer: (params: ITransferContactsToGroup) => Promise<void>;
    if (isTransfer) {
      transfer = transferOtherGroup;
    } else {
      transfer = addContact2Group;
    }
    const params = {
      contact_ids: addressIds,
      target_group_ids: options.filter(el => el.checked).map(el => el.id),
    };
    transfer(params)
      .then(() => {
        onSuccess && onSuccess(id);
      })
      .catch(err => {
        onError && onError(id, err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const resetState = () => {
    unCheckAllOptions();
  };

  useEffect(() => {
    if (checkedIds) {
      updateOptionsByIds(checkedIds);
    }
  }, [checkedIds]);

  return (
    <Modal
      width={480}
      visible={visible}
      title={
        <div className={styles.transferHeader}>
          <ModalHeader title={title} onClick={() => onClose(id)} />
          <div className={styles.transferHeaderTip}>
            {isTransfer
              ? getIn18Text('ZHUANYIZHIXINFENZUHOU\uFF0CLIANXIRENBUZAIZHANSHIDAOYUANFENZUZHONG')
              : getIn18Text('TIANJIAZHIXINFENZUHOU\uFF0CLIANXIRENRENGHUIZHANSHIZAIYUANFENZUZHONG')}
          </div>
        </div>
      }
      footer={[
        [
          <Button onClick={() => onClose(id)} className={classnames(styles.btn, styles.cancel)}>
            {getIn18Text('QUXIAO')}
          </Button>,
          <Button onClick={changeGroup} className={classnames(styles.btn, styles.confirm)} loading={loading} type="primary">
            {getIn18Text('QUEDING')}
          </Button>,
        ],
      ]}
      closable={false}
      className={styles.transfer}
      destroyOnClose={true}
      afterClose={resetState}
    >
      <div className={styles.transferBody}>
        {isTransfer ? (
          <div className={styles.transferBodyMove}>
            <div className={styles.source}>
              <div className={styles.label} style={{ alignSelf: 'flex-start' }}>
                {getIn18Text('YUANFENZU')}
              </div>
              <div className={styles.sourceValue} style={sourceGroup && sourceGroup.length ? { marginBottom: '-8px' } : {}}>
                {sourceGroup.map(str => {
                  return (
                    <Tag key={str} className={styles.sourceGroupVal} color={'rgba(192, 200, 214, 0.2)'}>
                      {str}
                    </Tag>
                  );
                })}
              </div>
            </div>
            <div className={styles.target}>
              <div className={styles.label}>{getIn18Text('XIANFENZU')}</div>
              <div className={styles.targetValue}>
                <CheckboxSelect
                  options={options}
                  addGroup={addOptions}
                  checkOption={changeCheckState}
                  uncheckAll={unCheckAllOptions}
                  placeholder={getIn18Text('QINGXUANZEFENZU')}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.transferBodyNew}>
            <CheckboxSelect
              placeholder={getIn18Text('QINGXUANZEFENZU')}
              options={options}
              addGroup={addOptions}
              checkOption={changeCheckState}
              uncheckAll={unCheckAllOptions}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
