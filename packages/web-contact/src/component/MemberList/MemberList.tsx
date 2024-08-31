import React, { useState, useEffect, useRef } from 'react';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import './mumberList.scss';
import { Spin, Tree, Divider, Button } from 'antd';
import { DataNode, TreeProps } from 'antd/lib/tree';
import ItemCard from '@web-mail/components/ItemCard';
import { apiHolder, apis, apiHolder as api, ContactApi, OrgApi, ContactModel, MailApi as MailApiType, AccountApi } from 'api';
import { mailListMemberResultData, memberList } from 'api/dist/api/logical/contactAndOrg';
import { getIn18Text } from 'api';
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApiType;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
interface MyDataNode extends DataNode {
  email?: string;
  contact?: ContactModel;
}
// 宽高
const MODAL_WIDTH = 400;
const MODAL_HEIGHT = 480;
interface MumberListProps {
  user: string;
  contactName: string;
  showDetail?: boolean; // 是否现实
  showModel?: boolean;
  showClose?: boolean; // 是否展示关闭按钮
  closeModel?: () => void;
  _account?: string;
}
const { TreeNode } = Tree;
const MumberList: React.FC<MumberListProps> = ({ user, contactName, showDetail = true, showModel = false, _account, showClose = true, closeModel }) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contentCode, setContentCode] = useState('default');
  const [memberList, setMemberList] = useState<memberList[]>([]);
  const [unitList, setUnitList] = useState<MyDataNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Array<string | number>>([]);
  const onShow = event => {
    setVisible(true);
    event.stopPropagation();
  };
  const onHide = () => {
    // 重置状态
    setVisible(false);
    setContentCode('default');
    setMemberList([]);
    setUnitList([]);
    closeModel && closeModel();
    // event.stopPropagation();
  };
  const getUnitList = async unitList => {
    const originIdList = await Promise.all(
      unitList.map(async (unit: any) => {
        let contactList = await contactApi.doGetOrgList({ originIdList: [unit.unit_id], showDisable: false, _account });
        let contactModelList: ContactModel[] = await contactApi.doGetContactByOrgId({ orgId: [contactList[0].id], _account });
        let children: MyDataNode[] = [];
        contactModelList.forEach(item => {
          children.push({
            title: item.contact.contactName,
            key: item.contact.accountId,
            email: item.contact.accountName,
            contact: item,
          });
        });
        return {
          title: unit.unit_path,
          key: unit.unit_id,
          children: children,
        };
      })
    );
    return originIdList;
  };
  const getMemberList = async memberList => {
    const originIdList = await Promise.all(
      memberList.map(async (member: any) => {
        let value = member.account_name + '@' + member.domain;
        const contactData = await contactApi.doGetContactByItem({
          type: 'EMAIL',
          value: [value],
          filterType: 'enterprise',
          _account,
        });
        member.contact = contactData[0];
        if (contactData.length === 0) {
          const newContact = mailApi.buildRawContactItem({
            item: value,
            email: value,
            type: 'to',
            name: member.account_name,
          });
          member.contact = newContact.contact;
        }
        return member;
      })
    );
    return originIdList;
  };
  const getUnitCount = unitList => {
    let count = 0;
    unitList.forEach(item => {
      count = count + item.children.length;
    });
    return count;
  };
  const renderEmail = (contact: MyDataNode) => {
    if (showDetail) {
      return (
        <ItemCard placement="rightTop" contact={contact.contact} type="avatar" trigger="click" domName="body" onNotifyParent={onHide}>
          <div className="content-email content-email-item">
            <span className="content-name">{nameLengthHandle(String(contact.title), 13)}</span>
            <span className="content-domain">{contact.email}</span>
          </div>
        </ItemCard>
      );
    }
    return (
      <div className="content-email content-email-item">
        <span className="content-name">{nameLengthHandle(String(contact.title), 13)}</span>
        <span className="content-domain">{contact.email}</span>
      </div>
    );
  };
  const renderNode = (data: MyDataNode, parentKey: string, isRoot: boolean = true) => {
    let title = isRoot ? `${data.title}(${data.children.length})` : renderEmail(data);
    return (
      <TreeNode key={data.key + '_' + parentKey} title={title} selectable={isRoot}>
        {data.children?.length && data.children.map(item => renderNode(item, String(data.key), false))}
      </TreeNode>
    );
  };
  const handleSelectNode: TreeProps['onSelect'] = (_, { node }) => {
    const expandedKeysSet = new Set(expandedKeys);
    if (node.expanded) {
      expandedKeysSet.delete(node.key);
    } else {
      expandedKeysSet.add(node.key);
    }
    setExpandedKeys(Array.from(expandedKeysSet));
  };
  const getData = async () => {
    setContentCode('default');
    setLoading(true);
    // accountApi.setCurrentAccount({ email: _account });
    // TODO guochao 待确认
    await contactApi.getMaillistMember(user).then(
      res => {
        if (res.errorCode) {
          setContentCode(res.errorCode as string);
          setLoading(false);
          return;
        }
        let { unit_list, member_list } = res?.data as mailListMemberResultData;
        Promise.all([getUnitList(unit_list), getMemberList(member_list)])
          .then(res => {
            setUnitList(res[0] as MyDataNode[]);
            setMemberList(res[1] as memberList[]);
            setContentCode('SUCCESS');
            setLoading(false);
          })
          .catch(error => {
            setContentCode('reqFailed');
            setLoading(false);
          });
      },
      err => {
        setContentCode('overtime');
        setLoading(false);
      }
    );
  };
  const nameLengthHandle = (nickName: string, len: number = 15) => {
    if (nickName.length > len) {
      return nickName.substring(0, len) + '…';
    }
    return nickName;
  };
  useEffect(() => {
    setVisible(showModel);
  }, [showModel]);
  useEffect(() => {
    if (!visible) return;
    getData();
  }, [visible]);
  return (
    <>
      <span onClick={onShow}>{getIn18Text('CHAKAN')}</span>
      <Modal
        bodyStyle={{ height: MODAL_HEIGHT, padding: 0, overflow: 'hidden' }}
        getContainer={() => document.body}
        className="MemberList"
        zIndex={1030}
        wrapClassName="scheduleModalWrap"
        footer={null}
        destroyOnClose
        centered
        closable={showClose}
        width={MODAL_WIDTH}
        visible={visible}
        onCancel={onHide}
      >
        <Spin spinning={loading} tip={getIn18Text('CHENGYUANHUOQUZHONG')}>
          <div
            className="sirius-no-drag container"
            onClick={e => {
              e.stopPropagation();
            }}
          >
            <div className="title">
              {contactName}
              {contentCode === 'SUCCESS' && <span>({getUnitCount(unitList) + memberList.length})</span>}
            </div>
            <div className="content">
              {contentCode === 'ERR.MAILLIST.MEMBER.INVISIBLE' && (
                <div className="no-content">
                  <div>{getIn18Text('CHENGYUANBUKEJIAN')}</div>
                  <div className="no-content-light">{getIn18Text('GUANLIYUANWEIKAI')}</div>
                </div>
              )}

              {contentCode === 'SUCCESS' && (
                <>
                  <div className="content-title">
                    {getIn18Text('BUMENCHENGYUAN')}
                    <span>({getUnitCount(unitList)})</span>
                  </div>
                  <Tree blockNode onSelect={handleSelectNode} expandedKeys={expandedKeys} onExpand={setExpandedKeys}>
                    {unitList.map(item => renderNode(item, 'root'))}
                  </Tree>

                  <Divider />
                  <div className="content-title">
                    {getIn18Text('GETICHENGYUAN(')}
                    {memberList.length})
                  </div>
                  {memberList.map((member, index) => {
                    return showDetail ? (
                      <ItemCard key={index} placement="rightTop" contact={member.contact} type="avatar" trigger="click" domName="body" onNotifyParent={onHide}>
                        <div className="content-email content-member-email">
                          <span className="content-name">{nameLengthHandle(member.nickname)}</span>
                          <span className="content-domain">{member.account_name + '@' + member.domain}</span>
                        </div>
                      </ItemCard>
                    ) : (
                      <div className="content-email content-member-email" key={index}>
                        <span className="content-name">{nameLengthHandle(member.nickname)}</span>
                        <span className="content-domain">{member.account_name + '@' + member.domain}</span>
                      </div>
                    );
                  })}
                </>
              )}
              {!['ERR.MAILLIST.MEMBER.INVISIBLE', 'SUCCESS', 'default'].includes(contentCode) && (
                <div className="no-content">
                  <div>{getIn18Text('ZAOGAO\uFF0CCHENGYUAN')}</div>
                  <div className="no-content-btn">
                    {' '}
                    <Button onClick={getData}>{getIn18Text('ZHONGSHI')}</Button>{' '}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Spin>
      </Modal>
    </>
  );
};
export default MumberList;
