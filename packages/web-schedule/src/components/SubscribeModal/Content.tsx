import { EntityCatalog } from 'api';
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import styles from './subscribemodal.module.scss';
import ContactEmpty from '@web-contact/component/Empty/empty';
import ListItem from './ListItem';
import { SpinIcon } from '@web-common/components/UI/Icons/icons';
import { queryContactCatalog, subscribeCatalog, unsubscribeCatalog } from '../../service';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { getCatalogPrivilegeText } from '../../util';
import { useNetStatus } from '@web-common/components/UI/NetWatcher';
import SelectList from '@web-common/components/UI/SiriusContact/selectList';
import { ContactItem } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';
const CatalogCard: React.FC<{
  catalog: EntityCatalog;
  onSubscribe?(): void;
}> = ({ catalog: cata, onSubscribe }) => {
  const [subscribe, setSubscribe] = useState<boolean>(cata.subscribeStatus === 1);
  const [toggling, setToggling] = useState<boolean>(false);
  const online = useNetStatus();
  const handleToggleSubscribe = async () => {
    if (toggling) {
      return;
    }
    if (!online) {
      SiriusMessage.netWorkError();
      return;
    }
    setToggling(!0);
    let success: boolean = false;
    if (subscribe) {
      success = await unsubscribeCatalog(cata);
    } else {
      success = await subscribeCatalog(cata);
    }
    if (success) {
      setSubscribe(!subscribe);
      if (onSubscribe) {
        onSubscribe();
      }
      SiriusMessage.success({ content: subscribe ? getIn18Text('TUIDINGCHENGGONG') : getIn18Text('DINGYUECHENGGONG') });
    } else {
      SiriusMessage.error({ content: subscribe ? getIn18Text('TUIDINGSHIBAI') : getIn18Text('DINGYUESHIBAI') });
    }
    setToggling(false);
  };
  return (
    <div key={cata.id} className={styles.catalogCard}>
      <div className={styles.metaContainer}>
        <p>{cata.name}</p>
        <p className={styles.subdesc}>{getCatalogPrivilegeText(cata.privilege)}</p>
      </div>
      <div className={styles.buttonContainer}>
        {toggling ? (
          <SpinIcon style={{ fontSize: 16 }} className="sirius-spin" />
        ) : (
          <button
            type="button"
            className={classNames({
              [styles.primary]: !subscribe,
            })}
            onClick={handleToggleSubscribe}
          >
            {subscribe ? getIn18Text('TUIDING') : getIn18Text('DINGYUE')}
          </button>
        )}
      </div>
    </div>
  );
};
const ContactDetail: React.FC<{
  selectedContact?: ContactItem;
  onSubscribe?(): void;
}> = ({ selectedContact, onSubscribe }) => {
  const [catalogList, setCatalogList] = useState<EntityCatalog[]>();
  useEffect(() => {
    if (selectedContact !== undefined) {
      setCatalogList([]);
      queryContactCatalog(selectedContact.email).then(setCatalogList);
    }
  }, [selectedContact]);
  if (!selectedContact) {
    return <ContactEmpty style={{ paddingTop: 120 }} imgClassName={styles.emptyImg} text={getIn18Text('QINGXUANZELIANXI')} />;
  }
  return (
    <>
      {catalogList && catalogList.length > 0 && <ListItem style={{ marginTop: 8 }} contact={selectedContact} />}
      <div className={styles.catalog} key={selectedContact.id}>
        {catalogList && catalogList.length > 0 && (
          <>
            {catalogList.map(cata => (
              <CatalogCard onSubscribe={onSubscribe} key={cata.id} catalog={cata} />
            ))}
          </>
        )}
        {catalogList && catalogList.length === 0 && (
          <ContactEmpty style={{ marginTop: catalogList.length === 0 ? 130 : 80 }} imgClassName={styles.emptyImg} text={getIn18Text('ZANWUKEDINGYUE')} />
        )}
      </div>
    </>
  );
};
const SubscribeContent: React.FC<{
  onSubscribe?(): void;
}> = ({ onSubscribe }) => {
  const [selectedContact, setSelectedContact] = useState<ContactItem>();
  const handleSelect = (item: ContactItem[]) => {
    const [aim] = item;
    // 注意: item是唯一值 这边得到的list 因为multiple是单个的，如果调用是多个的话，可能是重复的contactModel 需要通过(contactModel.contact.hitQueryEmail)区分
    setSelectedContact(aim);
  };
  const handleInputChange = (value: string) => {
    if (!value) {
      setSelectedContact(undefined);
    }
  };
  return (
    <div className={styles.content}>
      <div className={styles.col}>
        <SelectList
          excludeSelf
          isIM={!0}
          multiple={false}
          onSelect={handleSelect}
          onInputChange={handleInputChange}
          showCheckbox={false}
          showAddOrgBtn={false}
          showAddTeamBtn={false}
          type={['enterprise']}
          noRelateEnterprise={true}
        />
      </div>
      <OverlayScrollbarsComponent className={styles.col} style={{ flex: 1, maxWidth: 400 }}>
        <ContactDetail onSubscribe={onSubscribe} selectedContact={selectedContact} />
      </OverlayScrollbarsComponent>
    </div>
  );
};
export default SubscribeContent;
