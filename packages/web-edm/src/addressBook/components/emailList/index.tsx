import React, { useState, useEffect, useRef } from 'react';
import { List, Avatar, message } from 'antd';
import style from './index.module.scss';
import { ReactComponent as LoadMoreICon } from '@/images/icons/edm/load-more.svg';
import { apiHolder, apis, ContactApi, MailConfApi, ContactModel, AddressBookApi } from 'api';
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
import UserOutlined from '@ant-design/icons/UserOutlined';
import { getIn18Text } from 'api';

export interface IEmailListProps {
  addressId: number;
}

interface IEmailListItem {
  id: string;
  subject: string;
  sentDate: string;
  modifiedDate: string;
  from: string;
  to: string;
  receivedDate: string;
  name?: string;
}

const parseContactStr = (listStr: any, type: string) => {
  var items = typeof listStr === 'string' ? listStr.split(',') : listStr;
  interface parsed {
    name: string;
  }
  let parsed: parsed[] = [];

  if (!items || items.length == 0) {
    return parsed;
  }

  let contactPattern = {
    withName: /^\s*(\w+|"([^"]+)")\s*<([\w\-.]+@[\w.\-]+)>/i,
    withoutName: /^\s*([\w\-._#]+)@[\w.\-_]+/i,
  };

  items.forEach(function (item: any) {
    if (item && item.length > 2) {
      var exec = contactPattern.withoutName.exec(item);
      if (exec) {
        parsed.push({
          name: '',
        });
      } else {
        var exec1 = contactPattern.withName.exec(item);

        if (exec1) {
          parsed.push({
            name: exec1[2] || exec1[1],
          });
        } else {
          parsed.push({
            name: type === '' ? getIn18Text('WUFAJIANREN') : getIn18Text('WUSHOUJIANREN'),
          });
        }
      }
    }
  });
  return parsed;
};

export const EmailList = (props: IEmailListProps) => {
  const { addressId } = props;

  const [hasMore, setHasMore] = useState(false);
  const [emailList, setEmailList] = useState<IEmailListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const listScrollerRef = useRef<HTMLDivElement>(null);

  const getEmailList = () => {
    if (!addressId) {
      return;
    }

    setLoading(true);
    addressBookApi
      .addressBookGetEmailList({
        addressId,
      })
      .then(res => {
        const list = res.map(item => {
          let newItem = {
            ...item,
            name: '',
          };
          try {
            let nameArr = parseContactStr(newItem.to, '');
            if (nameArr && nameArr.length) {
              newItem.name = nameArr[0].name;
            } else {
              newItem.name = '';
            }
          } catch (err) {
            newItem.name = '';
          }
          return newItem;
        });
        if (list.length > 0) {
          setHasMore(true);
        }
        setEmailList(list);
      })
      .catch(err => {
        message.error({
          content: err as string,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getEmailList();
  }, [addressId]);

  const gotoDetail = (item: IEmailListItem) => {
    let emailStr = String(item.to).trim();
    let email = '';
    if (emailStr.includes(' ')) {
      const list = emailStr.split(' ').filter(str => str.length > 0);
      email = list[list.length - 1];
    } else {
      email = emailStr;
    }

    // 匹配出邮箱
    if (email && email.length) {
      getModelInfo(email);
    }
  };

  const getModelInfo = async (email: string) => {
    let info = [{ mail: email, contactName: '' }];
    const contactInfo = await contactApi.doGetContactByEmails(info, '');
    checkMailRelated(contactInfo[0].contact);
  };

  // 查看往来邮件
  const checkMailRelated = (data: ContactModel) => {
    mailConfApi.doOpenRelatedPage(data);
  };

  const onLoadMore = () => {
    gotoDetail(emailList[0]);
  };

  const loadMore = hasMore ? (
    <div
      style={{
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 1,
      }}
    >
      <span style={{ color: '#A8AAAD', cursor: 'pointer' }} onClick={onLoadMore}>
        <LoadMoreICon style={{ verticalAlign: 'middle', marginRight: 6 }} />
        {getIn18Text('JIAZAIGENGDUO')}
      </span>
    </div>
  ) : null;

  const itemRender = (item: IEmailListItem) => {
    const { name = '未知' } = item;
    // const randomColor = ColorList[Math.floor(Math.random() * ColorList.length)];
    return (
      <List.Item
        onClick={() => {
          gotoDetail(item);
        }}
        key={item.id}
      >
        <List.Item.Meta
          avatar={
            <Avatar size={32} style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />}>
              {{ name }}
            </Avatar>
          }
          title={<a>{item.subject}</a>}
          description={item.to}
        />
        <div style={{ color: '#7D8085' }}>{item.modifiedDate}</div>
      </List.Item>
    );
  };

  return (
    <div className={style.content}>
      <div ref={listScrollerRef} className={style.clientList}>
        <List dataSource={emailList} loadMore={loadMore} loading={loading} renderItem={itemRender}></List>
      </div>
    </div>
  );
};
