import React, { useState, useEffect } from 'react';
import { ModalHeader } from '../../components/ModalHeader/index';
import styles from './index.module.scss';
import { Button, Tag, Col, Row, Divider, Tabs, Dropdown, Menu, Tooltip, Table } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { IBaseModalType } from '../baseType';
import { ReactComponent as EmailIcon } from '../../assets/emailIcon.svg';
import { apiHolder, apis, AddressBookApi, MailApi, IAddressBookOpenSeaDetail, IAddressBookOpenSeaReturnRecordItem } from 'api';
import NationFlag from '@/components/Layout/CustomsData/components/NationalFlag/index';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
const COUNTRY_MAP = require('../ContactDetail/countryMap.json');
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
export interface IContactDetailProps extends IBaseModalType {
  contactId: number;
  onDelete: () => void;
  onAssign: () => void;
  onReceive: () => void;
}
const originMap: {
  [key: number]: string;
} = {
  1: getIn18Text('YONGHUTIANJIA'),
  2: getIn18Text('WENJIANDAORU'),
  101: getIn18Text('GERENTONGXUNLU'),
  102: getIn18Text('WAIMAOTONGZHUSHOU'),
  103: getIn18Text('QUANQIUSOU'),
  104: getIn18Text('HAIGUANSHUJU'),
  110: getIn18Text('ZHINENGTUIJIAN'),
};
export function ContactDetail(props: IContactDetailProps) {
  const hasOp = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ADDRESS_OPEN_SEA', 'OP'));
  const hasAllot = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ADDRESS_OPEN_SEA', 'ALLOT'));
  const hasDelete = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'ADDRESS_OPEN_SEA', 'DELETE'));
  const { visible, contactId, onClose, onError, onSuccess, id } = props;
  const [activeTab, setActiveTab] = useState<string>('returnOpenSea');
  const [avatarInfo, setAvatarInfo] = useState<{
    name: string;
    mail: string;
    groups: string[];
    groupIds: number[];
  }>({
    name: '',
    mail: '',
    groups: [],
    groupIds: [],
  });
  const [baseInfo, setBaseInfo] = useState<{
    social: string;
    mobile: string;
    origin: string;
    country: string;
    companyName: string;
    companySite: string;
    remark: string;
    continent: string;
    id: number;
  }>({
    social: '',
    mobile: '',
    origin: '',
    country: '',
    companyName: '',
    companySite: '',
    remark: '',
    continent: '',
  });
  const [returnOpenSeaList, setReturnOpenSeaList] = useState<IAddressBookOpenSeaReturnRecordItem[]>([]);
  const writeEmail = () => {
    if (avatarInfo.mail && avatarInfo.mail !== '-') {
      const contacts = [avatarInfo.mail];
      mailApi.doWriteMailToContact(contacts);
    }
  };
  const returnOpenSeaColumns = [
    {
      dataIndex: 'changeManagerName',
      key: 'changeManagerName',
      title: getIn18Text('QIANFUZEREN'),
    },
    {
      dataIndex: 'reason',
      key: 'reason',
      title: getIn18Text('TUIGONGHAIYUANYIN'),
    },
    {
      dataIndex: 'remark',
      key: 'remark',
      title: getIn18Text('TUIGONGHAIBEIZHU'),
    },
  ];
  const getContactDetail = () => {
    addressBookApi
      .addressBookOpenSeaDetail({
        id: contactId,
      })
      .then((resp: IAddressBookOpenSeaDetail) => {
        const { addressInfo, contactInfo, groupInfos } = resp;
        setAvatarInfo({
          name: contactInfo.contactName,
          groups: groupInfos.map(each => each.groupName).filter(el => el !== undefined),
          groupIds: groupInfos.map(el => el.groupId).filter(el => el !== undefined),
          mail: addressInfo.contactAddressInfo || '-',
        });
        const { snsInfos = [], tels = [], remark, country, companyName, companySite, continent } = contactInfo;
        const { contactSourceType } = addressInfo;
        setBaseInfo({
          social: snsInfos.map(el => el.name).join(','),
          mobile: tels.length ? tels[0] : '-',
          origin: originMap[contactSourceType],
          companyName,
          companySite,
          country,
          remark,
          continent,
          id: contactId,
        });
      });
  };
  const getReturnOpenSea = () => {
    addressBookApi
      .addressBookOpenSeaReturnRecordList({
        id: contactId,
        page: 1,
        pageSize: 100,
      })
      .then(res => {
        setReturnOpenSeaList(res.list);
      });
  };
  useEffect(() => {
    if (props.visible) {
      getContactDetail();
      getReturnOpenSea();
    }
  }, [props.visible]);
  const dropdownMenu = (
    <Menu>
      <Menu.Item onClick={props.onDelete} danger key="delete">
        {getIn18Text('SHANCHULIANXIREN')}
      </Menu.Item>
    </Menu>
  );
  const countryInEnglish: string | undefined = COUNTRY_MAP[baseInfo.country];
  return (
    <Modal
      visible={visible}
      title={<ModalHeader title={getIn18Text('LIANXIRENXIANGQING')} onClick={() => onClose(id)} />}
      closable={false}
      maskClosable={false}
      footer={null}
      width={813}
      className={styles.detail}
      onCancel={() => onClose(id)}
    >
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderBasic}>
          <div className={styles.email}>
            <div className={styles.emailInfo}>{avatarInfo.mail}</div>
            <div className={styles.emailIcon} onClick={writeEmail}>
              <Tooltip title={getIn18Text('XIEYOUJIAN')} placement="topLeft">
                <EmailIcon />
              </Tooltip>
            </div>
          </div>
          <div className={styles.base}>
            <div className={styles.baseName}>{avatarInfo.name}</div>
            <Divider type="vertical" style={{ height: 20, color: '#F0F3F5', margin: '0 16px' }} />
            <div className={styles.baseGroup}>
              {avatarInfo.groups.slice(0, 4).map(label => {
                return <Tag key={label}>{label}</Tag>;
              })}
            </div>
          </div>
        </div>
        <div className={styles.detailHeaderBtn}>
          {hasDelete && (
            <Dropdown placement="bottomLeft" overlay={dropdownMenu} overlayClassName="address_contact_dropdown" className={styles.dropdown}>
              <Button>···</Button>
            </Dropdown>
          )}
          <PrivilegeCheck accessLabel="ALLOT" resourceLabel="ADDRESS_OPEN_SEA">
            <Button className={styles.transfer} onClick={props.onAssign}>
              {getIn18Text('FENPEI')}
            </Button>
          </PrivilegeCheck>
          <PrivilegeCheck accessLabel="OP" resourceLabel="ADDRESS_OPEN_SEA">
            <Button type="primary" className={styles.add} onClick={props.onReceive}>
              {getIn18Text('LINGQU')}
            </Button>
          </PrivilegeCheck>
        </div>
      </div>
      <div className={styles.detailBody}>
        <Row gutter={[16, 16]}>
          {/* <Col>
<div className={styles.detailBodyItem}>
<div className={styles.label}>类型：</div>
<div className={styles.value}>{baseInfo.origin}</div>
</div>
</Col> */}
          <Col span={8}>
            <div className={styles.detailBodyItem}>
              <div className={styles.label}>{getIn18Text('LIANXIDIANHUA\uFF1A')}</div>
              <div className={styles.value}>{baseInfo.mobile}</div>
            </div>
          </Col>
          <Col span={8}>
            <div className={styles.detailBodyItem}>
              <div className={styles.label}>{getIn18Text('SHEJIAOPINGTAI\uFF1A')}</div>
              <div className={styles.value}>{baseInfo.social}</div>
            </div>
          </Col>
          <Col span={8}>
            <div className={styles.detailBodyItem}>
              <div className={styles.label}>{getIn18Text('CHUANGJIANFANGSHI\uFF1A')}</div>
              <div className={styles.value}>{baseInfo.origin}</div>
            </div>
          </Col>
          <Col span={8}>
            <div className={styles.detailBodyItem}>
              <div className={styles.label}>{getIn18Text('GUOJIA\uFF1A')}</div>
              <div className={styles.value}>{countryInEnglish ? <NationFlag name={countryInEnglish} /> : <span>{baseInfo.country}</span>}</div>
            </div>
          </Col>
          <Col span={8}>
            <div className={styles.detailBodyItem}>
              <div className={styles.label}>{getIn18Text('GONGSIMINGCHENG\uFF1A')}</div>
              <div className={styles.value}>{baseInfo.companyName}</div>
            </div>
          </Col>
          <Col span={8}>
            <div className={styles.detailBodyItem}>
              <div className={styles.label}>{getIn18Text('GONGSIGUANWANG\uFF1A')}</div>
              <div className={styles.value}>{baseInfo.companySite}</div>
            </div>
          </Col>
          <Col span={8}>
            <div className={styles.detailBodyItem}>
              <div className={styles.label}>{getIn18Text('BEIZHU\uFF1A')}</div>
              <div className={styles.value}>{baseInfo.remark}</div>
            </div>
          </Col>
        </Row>
      </div>
      <Divider style={{ color: '#F0F3F5' }} />
      <div className={styles.detailRemark}>
        <Tabs activeKey={activeTab} onChange={key => setActiveTab(key)} destroyInactiveTabPane>
          <Tabs.TabPane tab={getIn18Text('TUIGONGHAIJILU')} key="returnOpenSea">
            <div className={styles.table}>
              <Table columns={returnOpenSeaColumns} dataSource={returnOpenSeaList} scroll={{ x: 'max-content', y: 220 }} pagination={false} />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </Modal>
  );
}
