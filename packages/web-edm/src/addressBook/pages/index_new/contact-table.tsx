import React, { useState, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { apiHolder, apis, IAddressBookContactListItem, AddressBookFilterType, AddressBookContactsParams, AddressBookNewApi } from 'api';
import { Space, Menu } from 'antd';
import Contacts from '../../components/Contacts/index-new';
import Dropdown from '@web-common/components/UI/Dropdown/index';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
// import variables from '@web-common/styles/export.module.scss';
import classnames from 'classnames';
import addressBookStyle from '../../addressBook.module.scss';
import { ReactComponent as ArrowIcon } from '@/images/icons/edm/btn-white-arrow-icon.svg';
import { UniDrawerContactDetail, UniDrawerLeadsDetail } from '@/components/Layout/CustomsData/components/uniDrawer/index';
import { TableId, SiriusImportButton } from '@lxunit/app-l2c-crm';
import debounce from 'lodash/debounce';
import { edmDataTracker, contactBookActionTrackKey } from './../../../tracker/tracker';
import Button from '@web-common/components/UI/Button';
import { navigate } from '@reach/router';
import style from './contact-table.module.scss';
import { getIn18Text } from 'api';

const newAddressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;

interface IContactsProps {
  initParam?: AddressBookContactsParams;
  initGroupId?: string;
  isOverview?: boolean;
  tabScrollY?: number;
  startFilterFixedHeight?: number;
}

interface IRefType {
  refreshListWithParam(param?: AddressBookContactsParams): void;
}

const AddressBookIndex = forwardRef<IRefType, IContactsProps>((props: IContactsProps, refFromProps) => {
  const { initParam, initGroupId, isOverview = false, tabScrollY, startFilterFixedHeight } = props;
  const [data, setData] = useState<IAddressBookContactListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const contactsRef = useRef<any>(null);
  const [addContactVisible, setAddContactVisible] = useState<boolean>(false);
  const [addNewClueContactVisible, setAddNewClueContactVisible] = useState<boolean>(false);

  const handleCreateNewContact = () => {
    setAddContactVisible(true);
    edmDataTracker.track(contactBookActionTrackKey, { action: 'newContact' });
  };

  const handleCreateNewClueContact = () => {
    setAddNewClueContactVisible(true);
    edmDataTracker.track(contactBookActionTrackKey, { action: 'newClue' });
  };

  const refreshListWithParam = (param?: AddressBookContactsParams) => {
    if (contactsRef && contactsRef.current) {
      contactsRef.current.refreshByParams(param);
    }
  };

  const refreshSearchContactCount = () => {
    if (contactsRef && contactsRef.current) {
      contactsRef.current.refreshSearchContactCount();
    }
  };

  useImperativeHandle(refFromProps, () => {
    return {
      refreshListWithParam,
    };
  });

  const onFetch = useCallback(
    debounce((_: AddressBookFilterType, params: AddressBookContactsParams) => {
      setLoading(true);
      newAddressBookApi
        .searchContactList(params)
        .then(res => {
          setData(res.list);
          setTotal(res.totalCount);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 100),
    []
  );

  const refreshList = () => {
    refreshListWithParam({
      resetFormFilter: true,
    });
    refreshSearchContactCount();
  };

  return (
    <>
      <div className={classnames(style.container, addressBookStyle.addressBook, addressBookStyle.contactListContainer)} style={{ padding: '0' }}>
        <Contacts
          ref={contactsRef}
          data={data}
          total={total}
          isOverview={isOverview}
          initParam={initParam}
          initGroupId={initGroupId}
          loading={loading}
          onFetch={onFetch}
          tabScrollY={tabScrollY}
          startFilterFixedHeight={startFilterFixedHeight}
          onFetchBatchDataList={params =>
            newAddressBookApi.searchContactList(params).then(res => ({
              dataList: res.list || [],
              total: res.totalCount || 0,
            }))
          }
        >
          {(filter, operations, table) => {
            return (
              <>
                {filter}
                <div
                  style={{
                    padding: '0 16px 16px 16px',
                  }}
                >
                  <div className={style.operations}>
                    <div className={style.left}>{operations}</div>
                    <div className={style.right}>
                      <Space>
                        <PrivilegeCheck accessLabel="OP" resourceLabel="CHANNEL">
                          <SiriusImportButton tableId={TableId.LeadsContact} closeHandler={() => {}}>
                            {getIn18Text('DAORULIANXIREN')}
                          </SiriusImportButton>
                        </PrivilegeCheck>
                        <PrivilegeCheck accessLabel="OP" resourceLabel="CHANNEL">
                          <Dropdown
                            trigger={['hover']}
                            placement="bottomRight"
                            overlay={
                              <Menu>
                                <Menu.Item onClick={handleCreateNewClueContact}>{getIn18Text('CREATE_NEW_CLUE_CONTACT')}</Menu.Item>
                                <Menu.Item onClick={handleCreateNewContact}>{getIn18Text('CREATE_CLUE_CONTACT')}</Menu.Item>
                              </Menu>
                            }
                          >
                            <Button btnType="primary" className={style.arrowBtn}>
                              <span>{getIn18Text('XINJIANLIANXIREN')}</span>
                              <span className={style.iconWrapper}>
                                <ArrowIcon />
                              </span>
                            </Button>
                          </Dropdown>
                        </PrivilegeCheck>
                      </Space>
                    </div>
                  </div>
                  {table}
                </div>
              </>
            );
          }}
        </Contacts>
        {addContactVisible && (
          <UniDrawerContactDetail
            visible={true}
            onClose={() => {
              setAddContactVisible(false);
            }}
            onSuccess={() => {
              setAddContactVisible(false);
              refreshList();
            }}
            source="addressBook"
            contactTableId={TableId.LeadsContact}
          ></UniDrawerContactDetail>
        )}
        {addNewClueContactVisible && (
          <UniDrawerLeadsDetail
            visible={true}
            onClose={() => {
              setAddNewClueContactVisible(false);
            }}
            onSuccess={() => {
              setAddNewClueContactVisible(false);
              refreshList();
            }}
            source="addressBook"
            contactList={[]}
            usageScene="address_list"
          ></UniDrawerLeadsDetail>
        )}
      </div>
    </>
  );
});

export default AddressBookIndex;
