import React, { useCallback, useEffect, useState, useRef } from 'react';
import style from './chooseGroup.module.scss';
import classnames from 'classnames/bind';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import { Button, Checkbox } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { api, apis, ContactAndOrgApi, EntityPersonalOrg, InsertPersonalOrgRes } from 'api';
import lodashGet from 'lodash/get';
import { CreatePersonalGroup } from './createGroup';
import { getIn18Text } from 'api';

const realStyle = classnames.bind(style);
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactAndOrgApi;
interface FooterProps {
  confirmCallback(): void;
  cancelCallback(): void;
  createGroupCallback(): void;
}
export const Footer: React.FC<FooterProps> = props => {
  const { confirmCallback, cancelCallback, createGroupCallback } = props;
  return (
    <div className={realStyle('footerWrapper')}>
      <div className={realStyle('actionGroup')}>
        <Button data-test-id="modal_choose_personalOrg_btn_add" type="link" className={realStyle('createGroupBtn')} onMouseDown={createGroupCallback}>
          {getIn18Text('TIANJIAGERENFEN')}
        </Button>
      </div>
      <div className={realStyle('actionGroup')}>
        <Button data-test-id="modal_choose_personalOrg_btn_cancel" onMouseDown={cancelCallback} className={realStyle('cancelBtn')}>
          {getIn18Text('QUXIAO')}
        </Button>
        <Button data-test-id="modal_choose_personalOrg_btn_save" onMouseDown={confirmCallback} type="primary">
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    </div>
  );
};
interface Props {
  disableOrgIds?: string[];
  confirmCallback(ids: string[]): void;
  cancelCallback(): void;
  _account?: string;
}
export const ChooseGroupModal: React.FC<Props> = props => {
  const { confirmCallback: _confirmCallback, cancelCallback: _cancelCallback, disableOrgIds = [], _account } = props;
  const createGroupRef = useRef<{
    addBlurCreateLock(): void;
    createNewGroup(): Promise<boolean>;
  }>();
  const [personalOrgList, setPersonalOrgList] = useState<InsertPersonalOrgRes[]>([]);
  const [checkedGroupIds, setCheckedGroupIds] = useState<string[]>([]);
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const confirmCallback = useCallback(async () => {
    // 如果当前窗口在等待分组创建成功
    if (isCreatingNewGroup && createGroupRef.current && createGroupRef.current.addBlurCreateLock) {
      // 添加阻塞
      createGroupRef.current!.addBlurCreateLock();
      await createGroupRef.current!.createNewGroup();
    }
    setCheckedGroupIds(ids => {
      if (ids.length === 0) {
        message.error(getIn18Text('QINGXUANZEFENZU'));
      } else {
        _confirmCallback(ids);
      }
      return ids;
    });
  }, [checkedGroupIds.length, isCreatingNewGroup]);
  const cancelCallback = useCallback(() => {
    if (isCreatingNewGroup && createGroupRef.current) {
      createGroupRef.current.addBlurCreateLock();
    }
    _cancelCallback();
  }, [isCreatingNewGroup]);
  const [groupDefaultIndex, setGroupDefaultIndex] = useState(0);
  const createGroupCallback = async () => {
    if (isCreatingNewGroup && createGroupRef.current) {
      createGroupRef.current.addBlurCreateLock();
      await createGroupRef.current.createNewGroup();
    }
    setGroupDefaultIndex(groupDefaultIndex + 1);
    setIsCreatingNewGroup(true);
  };
  useEffect(() => {
    contactApi.doGetPersonalOrg({ _account }).then(res => {
      const list = (lodashGet(res, 'data', []) as unknown as EntityPersonalOrg[]).map(item => {
        return { name: item.orgName, id: item.id };
      });
      setPersonalOrgList(list);
    });
  }, [_account]);
  const toggleCheckbox = (flag: boolean, itemId: string) => {
    setCheckedGroupIds(ids => {
      const idSets = new Set(ids);
      if (flag) {
        idSets.add(itemId);
      } else {
        idSets.delete(itemId);
      }
      return [...idSets];
    });
  };
  // 新增分组成功
  const createGroupSuccess = useCallback(async (data: InsertPersonalOrgRes, isChecked: boolean) => {
    // 刷新分组
    setPersonalOrgList(list => {
      list.push(data);
      return list;
    });
    setCheckedGroupIds(ids => {
      if (isChecked) {
        ids.push(data.id);
      }
      return ids;
    });
    setIsCreatingNewGroup(false);
  }, []);
  const renderList = personalOrgList.filter(item => !disableOrgIds.includes(item.id));
  return (
    <SiriusHtmlModal
      title={<span data-test-id="modal_choose_personalOrg_title">{getIn18Text('JIANGLIANXIRENFEN12')}</span>}
      visible={true}
      onCancel={cancelCallback}
      footer={
        <Footer
          confirmCallback={() => {
            confirmCallback();
          }}
          cancelCallback={cancelCallback}
          createGroupCallback={createGroupCallback}
        />
      }
    >
      <div className={realStyle('chooseWrapper')} data-test-id="modal_choose_personalOrg_content">
        {renderList.length || isCreatingNewGroup ? (
          <>
            {renderList.map(item => {
              const checked = checkedGroupIds.includes(item.id);
              return (
                <div className={realStyle('orgItem')} key={item.id} data-test-id="modal_choose_personalOrg_item">
                  <Checkbox
                    data-test-id="modal_choose_personalOrg_item_checkbox"
                    data-test-check={checked}
                    value={item.id}
                    onChange={e => {
                      toggleCheckbox(e.target.checked, e.target.value);
                    }}
                    checked={checked}
                  >
                    {item.name}
                  </Checkbox>
                </div>
              );
            })}
            {isCreatingNewGroup && (
              <CreatePersonalGroup
                count={groupDefaultIndex}
                success={createGroupSuccess}
                cancel={() => {
                  setIsCreatingNewGroup(false);
                }}
                groupNames={personalOrgList.map(item => {
                  return item.name;
                })}
                _account={_account}
                ref={createGroupRef}
              ></CreatePersonalGroup>
            )}
          </>
        ) : (
          <div className={style.noDataWrap}>
            <div className={classnames('sirius-empty', style.noDataImg)} />
            <div className={style.noDataTxt}>{getIn18Text('ZANWUKEXUANFEN')}</div>
          </div>
        )}
      </div>
    </SiriusHtmlModal>
  );
};
