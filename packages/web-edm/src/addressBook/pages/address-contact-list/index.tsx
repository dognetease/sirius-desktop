import React, { useState, useEffect, useRef } from 'react';
import ContactTable from './../index_new/contact-table';
import Styles from './index.module.scss';
import { navigate } from '@reach/router';
// import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Breadcrumb from '@lingxi-common-component/sirius-ui/Breadcrumb';
import type { AddressBookContactsParams } from 'api';
import type { IJumpToAddressListOption } from './../../utils';

interface IAddressContactListProps {
  qs?: { [key: string]: any };
}

let timer: NodeJS.Timeout | null = null;

const AddressContactList: React.FC<IAddressContactListProps> = props => {
  const { qs } = props;
  const [isInit, setIsInited] = useState(false);

  const [backName, setBackName] = useState<string>('');
  const [backUrl, setBackUrl] = useState<string>('');
  const [listName, setListName] = useState<string>('');
  const [initParams, setInitParams] = useState<AddressBookContactsParams | undefined>(undefined);
  const [initGroupId, setInitGroupId] = useState<string>('');
  const [refresh, setRefresh] = useState<boolean>(true);
  const [contactOverviewTabScrollY, setContactOverviewTabScrollY] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    timer = setTimeout(() => {
      setRefresh(!refresh);
    }, 0);
    var handler = function () {
      if (scrollRef.current) {
        setContactOverviewTabScrollY(scrollRef.current?.scrollTop);
      }
    };
    if (scrollRef.current) {
      scrollRef.current.addEventListener('scroll', handler);
    }
    return function () {
      timer && clearTimeout(timer);
      timer = null;
      if (scrollRef.current) {
        scrollRef.current.removeEventListener('scroll', handler);
      }
    };
  }, [scrollRef.current]);

  useEffect(() => {
    if (qs && qs.keyName) {
      const keyName = qs.keyName;
      const keyValue = localStorage.getItem(keyName);
      if (keyValue) {
        try {
          const info: IJumpToAddressListOption = JSON.parse(keyValue);
          if (info.backName) {
            setBackName(info.backName);
          }
          if (info.backUrl) {
            setBackUrl(info.backUrl);
          }
          if (info.listName) {
            setListName(info.listName);
          }
          if (info.groupIds && info.groupIds.length === 1) {
            setInitGroupId(info.groupIds[0]);
          } else {
            setInitGroupId('');
          }
          if (info.filter) {
            setInitParams({
              groupFilter: info.filter,
            });
          }
          localStorage.removeItem(keyName);
        } catch (ex) {
          console.error('parse obj error', ex);
        }
      }
    }
    setIsInited(true);
  }, [qs?.keyName]);

  const handleToback = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate('#edm?page=addressBookIndex');
    }
  };

  const renderBreadcrumb = () => {
    if (!backName && !listName) return null;
    return (
      <Breadcrumb separator="">
        {' '}
        {backName && (
          <>
            <Breadcrumb.Item onClick={handleToback} className={Styles.clickBreadCrumb}>
              {backName}
            </Breadcrumb.Item>
            <Breadcrumb.Separator>/</Breadcrumb.Separator>
          </>
        )}
        {listName && <Breadcrumb.Item>{listName}</Breadcrumb.Item>}
      </Breadcrumb>
    );
  };

  if (!isInit) return null;

  return (
    <>
      <div className={Styles.root}>
        <div className={Styles.breadcrumb}>{renderBreadcrumb()}</div>
        <div className={Styles.listContainer} ref={scrollRef}>
          <ContactTable tabScrollY={contactOverviewTabScrollY} startFilterFixedHeight={1} initParam={initParams} initGroupId={initGroupId} />
        </div>
      </div>
    </>
  );
};

export default AddressContactList;
