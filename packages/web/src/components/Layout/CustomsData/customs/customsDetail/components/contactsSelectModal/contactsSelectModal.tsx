/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { Checkbox, PaginationProps, Radio, Table } from 'antd';
import ReactDOM from 'react-dom';
import { apis, apiHolder, EdmCustomsApi, customsContactItem, resCustomsContact, GlobalSearchApi, reqCustomsBaseParam, reqCustomsCompanyList } from 'api';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './contactsSelectModal.module.scss';
import { ColumnsType, TableRowSelection } from 'antd/lib/table/interface';
import cloneDeep from 'lodash/cloneDeep';
import LinkedinIcon from '../../../../../globalSearch/assets/linkedin.svg';
import FacebookIcon from '../../../../../globalSearch/assets/facebook.svg';
import TwitterIcon from '../../../../../globalSearch/assets/twitter.svg';
import { filiterCondition } from '@/components/Layout/globalSearch/detail/contactList';
import { getIn18Text } from 'api';
import SocailMediaLink from '@/components/Layout/globalSearch/component/SocialMediaLink/SocialMediaLink';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';

import { ReactComponent as ScreenIcon } from '@/components/Layout/globalSearch/assets/screen.svg';
import { ReactComponent as SelectScreenIcon } from '@/components/Layout/globalSearch/assets/selectedScreen.svg';
// import { Tabs } from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';
// import SiriusTable from '@web-common/components/UI/Table';
import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
export interface ContactItem extends customsContactItem {
  key: string | number;
  socialPlatform?: string;
  whatsApp?: string;
  job?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  type?: string;
  id: string;
}

export interface OutPutContactItem extends customsContactItem {
  social_platform_new?: string;
  whats_app?: string;
  job?: string;
  id: string;
}

interface Props {
  visible: boolean;
  onCancel: () => void;
  onOk: (list: OutPutContactItem[]) => void;
  contactsList: ContactItem[];
  title?: string;
}

const defaultPagination: PaginationProps = {
  defaultPageSize: 30,
  size: 'small',
  showTotal: total => `${getIn18Text('GONG')}${total}${getIn18Text('TIAO')}`,
};

const initContactList = [
  {
    contactName: '',
    email: '',
    main_contact: true,
    telephones: [],
    social_platform: '',
    id: '',
  },
];

const renderSocialMedia = (record: ContactItem) => {
  let socialMedia = [
    {
      key: 'linkedinUrl',
      icon: LinkedinIcon,
      href: '',
    },
    {
      key: 'facebookUrl',
      icon: FacebookIcon,
      href: '',
    },
    {
      key: 'twitterUrl',
      icon: TwitterIcon,
      href: '',
    },
  ];

  let renderData = socialMedia
    .map(item => {
      item.href = record[item.key as keyof ContactItem] as string;
      return item;
    })
    .filter(ele => ele.href);

  if (renderData?.length) {
    return (
      <div style={{ paddingTop: 2 }}>
        {renderData.map(ele => (
          <SocailMediaLink
            tipType={ele.key === 'linkedinUrl' ? 'linkedin' : undefined}
            href={ele.href}
            key={ele.key}
            style={{ marginRight: 8 }}
            target="_blank"
            onClick={ev => {
              ev.stopPropagation();
            }}
            rel="noreferrer"
          >
            <img width={20} height={20} src={ele.icon} alt="icon" />
          </SocailMediaLink>
        ))}
      </div>
    );
  } else {
    return null;
  }
};

export const filterContact = [
  {
    label: '邮箱',
    value: 'email',
  },
  {
    label: '电话',
    value: 'phone',
  },
  {
    label: '其他联系方式',
    value: 'other',
  },
];

const ContactsSelectModal = ({ visible, onCancel, onOk, contactsList: propContactList, title }: Props) => {
  // const contactApi = id ? gloablSearchApiContact.bind(globalSearchApi)
  //   : isGlobal ? edmCustomsApi.globalSearchContact.bind(edmCustomsApi) : edmCustomsApi.customsContact.bind(edmCustomsApi);
  // const [recordParams, setRecordParams] = useState<reqCustomsBaseParam>({
  //   from: 1,
  //   size: 30,
  //   companyName: '',
  //   country: '',
  // });
  const [contactsList, setContactsList] = useState(propContactList.slice());

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [currentFilter, setCurrentFilter] = useState<'ALL' | 'SALE' | 'LEADERS' | 'MANAGER' | 'COMMON' | 'NULL'>('ALL');

  const [screenSelect, setScreenSelect] = useState<CheckboxValueType[]>([]);

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    let cloneSelectData = [];
    let nowAllRowKeys = contactsList.map(item => item.key);
    let yesRowKeys = selectedRowKeys?.filter(item => nowAllRowKeys.includes(item)) || [];
    if (yesRowKeys.length > newSelectedRowKeys?.length) {
      const differentValues = yesRowKeys.filter(element => !newSelectedRowKeys.includes(element)) || [];
      cloneSelectData = cloneDeep(selectedRowKeys)?.filter(item => !differentValues.some(i => i === item)) || [];
    } else {
      cloneSelectData = cloneDeep(selectedRowKeys) || [];
    }
    let concaRowKeys = [...new Set([...newSelectedRowKeys, ...(cloneSelectData || [])])];
    setSelectedRowKeys(concaRowKeys);
  };
  const rowSelection: TableRowSelection<any> = {
    selectedRowKeys,
    onChange: onSelectChange,
    selections: [Table.SELECTION_ALL],
  };

  useEffect(() => {
    // 联系人分类，采购（SALE），老板高层（LEADERS），管理者（MANAGER），其他（COMMON/null ）
    let finallyArr: Array<ContactItem> = [];
    if (currentFilter === 'ALL') {
      //表格外部的职位筛选
      finallyArr = propContactList;
    } else if (currentFilter === 'NULL') {
      finallyArr = propContactList.filter(item => !item.type || item.type === 'COMMON');
    } else {
      finallyArr = propContactList.filter(item => item.type === currentFilter);
    }
    if (screenSelect.length > 0) {
      // 列表表头筛选
      let filterArr: Array<ContactItem> = [];
      screenSelect.forEach(item => {
        let concantArr: Array<ContactItem> = [];
        if (item === 'email') {
          concantArr = finallyArr.filter(v => v.email);
        } else if (item === 'phone') {
          concantArr = finallyArr.filter(v => v.telephones?.length > 0 && v.telephones[0]);
        } else if (item === 'other') {
          concantArr = finallyArr.filter(v => v.twitterUrl || v.facebookUrl || v.linkedinUrl);
        }
        filterArr = filterArr.concat(concantArr);
      });
      finallyArr = filterArr;
    }
    setContactsList(finallyArr.filter((item, index, self) => self.findIndex(el => el.key === item.key) === index));
  }, [currentFilter, propContactList, screenSelect]);

  const onOkEvent = async () => {
    if (selectedRowKeys.length > 0) {
      console.log(
        propContactList.filter(el => {
          return selectedRowKeys.includes(el.key as string);
        })
      );

      const contacts = propContactList
        .filter(el => {
          return selectedRowKeys.includes(el.key as string);
        })
        .map(item => {
          const re: OutPutContactItem = {
            contactName: item.contactName,
            email: item.email,
            telephones: item.telephones.map(item => item.replace(/\D/g, '')),
            job: item.job,
            id: item.id,
          };
          if (item.socialPlatform) {
            re.social_platform_new = item.socialPlatform;
          } else {
            const platforms = [];
            if (item.linkedinUrl) {
              platforms.push(`Linkedin:${item.linkedinUrl}`);
            }
            if (item.facebookUrl) {
              platforms.push(`Facebook:${item.facebookUrl}`);
            }
            if (item.twitterUrl) {
              platforms.push(`Twitter:${item.twitterUrl}`);
            }
            if (platforms.length > 0) {
              re.social_platform_new = platforms.join('; ');
            }
          }
          return re;
        });
      onOk(contacts);
    } else {
      onOk(initContactList);
    }
  };

  const columns: ColumnsType<ContactItem> = [
    {
      title: getIn18Text('XINGMINGZHIWEI'),
      dataIndex: 'contactName',
      key: 'contactName',
      ellipsis: true,
      render: (text: string, record) => (
        <div>
          <EllipsisTooltip>{text || '-'}</EllipsisTooltip>
          {record.job && (
            <div>
              <EllipsisTooltip>
                <span className={style.jobname}>{record.job}</span>
              </EllipsisTooltip>
            </div>
          )}
          {renderSocialMedia(record)}
        </div>
      ),
    },
    {
      title: getIn18Text('LIANXIFANGSHI'),
      dataIndex: 'email',
      // key: 'email',
      // ellipsis: true,
      filterDropdown: ({}) => {
        return (
          <div>
            <Checkbox.Group
              className={style.checkGroup}
              options={filterContact}
              onChange={value => {
                setScreenSelect(value);
              }}
            />
          </div>
        );
      },
      filterIcon: (filtered: boolean) => {
        return screenSelect.length > 0 ? <SelectScreenIcon /> : <ScreenIcon />;
      },
      render: (text: string, record) => {
        const tel = record.telephones ? record.telephones.join(';') : '';
        return (
          <div>
            <div className={style.iconWrapper}>
              <i className={style.emailIocn}></i>
              {/* <EllipsisTooltip>
                
              </ EllipsisTooltip> */}
              <span style={{ maxWidth: '240px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{text || '-'}</span>
            </div>
            {tel && (
              <div className={style.iconWrapper}>
                <i className={style.phoneIocn}></i>
                <span>{tel}</span>
              </div>
            )}
          </div>
        );
      },
    },
  ];
  return (
    <Modal
      className={style.modalWrap}
      title={title || getIn18Text('LURUKEHU')}
      width={706}
      bodyStyle={{ minHeight: 308, padding: ' 0px' }}
      visible={visible}
      destroyOnClose
      onCancel={onCancel}
      onOk={onOkEvent}
      getContainer={document.body}
      zIndex={1001}
    >
      <div className={style.modalContent} style={{ position: 'relative' }}>
        <div className={style.selectAll}>
          <Tabs
            activeKey={currentFilter}
            bgmode="white"
            size="small"
            type="capsule"
            onChange={key => {
              setCurrentFilter(key as any);
              // setSelectKey(key as any);
              // setContactPage(1);
              // globalSearchDataTracker.trackJobtitleFilter(key as 'ALL' | 'MANAGER' | 'SALE' | 'COMMON');
            }}
          >
            {filiterCondition.map(item => (
              <Tabs.TabPane key={item.key} className={style.tab} tab={item.label} />
            ))}
          </Tabs>
        </div>
        <SiriusTable
          className={style.table}
          rowSelection={rowSelection}
          columns={columns}
          rowKey="key"
          dataSource={contactsList}
          pagination={defaultPagination}
          // tableLayout="fixed"
          // scroll={{ y: 300 }}
        />
        <div className={style.selectCount} style={{ position: 'absolute', bottom: '16px', left: '20px' }} hidden={selectedRowKeys.length === 0}>
          {getIn18Text('YIXUANZE')}
          {selectedRowKeys.length}
          {getIn18Text('GELIANXIREN')}
        </div>
      </div>
    </Modal>
  );
};
export default ContactsSelectModal;

export const showContactsSelectModal = (props: Props) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const cancelHandler = () => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  };
  const onCancel = () => {
    props.onCancel();
    cancelHandler();
  };
  const onOk = (list: OutPutContactItem[]) => {
    props.onOk(list);
    cancelHandler();
  };
  ReactDOM.render(<ContactsSelectModal {...props} onCancel={onCancel} onOk={onOk} visible />, container);
};
