import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Tooltip, Button } from 'antd';
import { DataNode, TreeProps, EventDataNode } from 'antd/lib/tree';
import throttle from 'lodash/throttle';
const debounce = throttle;
import { apis, ContactModel, apiHolder, ContactApi, OrgApi, DataTrackerApi, EntityOrgTeamContact, EntityTeamOrg } from 'api';

import {
  data2Tree,
  data2Leaf,
  updatePersonTreeData,
  updateOrgTreeData,
  getAllPersonContact,
  getPersonContact,
  getOrgs,
  getContact,
  getSearchContact,
  SearchGroupKey,
  StaticNodeKey,
} from '@web-common/utils/contact_util';
import ContactItem from '../ContactItem/contactItem';
import { UIContactModel } from '@web-contact/data';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import SiriusContact, { SiriusContactRefProps } from '@web-common/components/UI/SiriusContact/siriusContact';

import styles from './writeContact.module.scss';
import { TempContactActions, ContactActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { WriteContext } from '@web-setting/Mail/components/CustomTemplate/template_add_modal';
import { getIn18Text } from 'api';

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactApi & OrgApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
enum TreeType {
  PERSON,
  ORG,
  GROUP,
}

// 将多邮箱用户拆分成多个contact
const flattenContactList = (contactList: UIContactModel[]): UIContactModel[] =>
  contactList
    .map(item => {
      const emails = item.contactInfo.filter(info => info.contactItemType === 'EMAIL' && info.contactItemVal);
      if (emails.length) {
        return emails.map(emailInfo => ({
          ...item,
          contactInfo: [emailInfo],
        }));
      }
      return [];
    })
    .flat();

const ContactWidth = 220;
const LIST_ITEM_HEIGHT = 28;
const originPersonData = [
  {
    key: StaticNodeKey.PERSON,
    title: getIn18Text('GERENTONGXUN'),
    children: [{ key: StaticNodeKey.PERSON_ALL, isLeaf: false, title: getIn18Text('SUOYOULIANXIREN11') + '（0）' }],
  },
];

const originOrgData = [
  {
    key: StaticNodeKey.CORP,
    title: getIn18Text('QIYETONGXUN'),
    children: [],
  },
];

const originGroupData = [
  {
    key: StaticNodeKey.GROUP,
    title: getIn18Text('WODEQUN'),
    children: [],
  },
];

let observerID: any;

interface Props {}

const WriteContact: React.FC<Props> = () => {
  const { isMailTemplate } = useContext(WriteContext);

  const [personData, setPersonData] = useState<DataNode[]>(originPersonData);
  const [orgData, setOrgData] = useState<DataNode[]>(originOrgData);
  const [groupData, setGroupData] = useState<DataNode[]>(originGroupData);
  const [searchValue, setSearchValue] = useState<string>('');
  const [searchContactList, setSearchContactList] = useState<{ [key in SearchGroupKey]: UIContactModel[] } | null>();
  const displayContactList = searchContactList && searchContactList[SearchGroupKey.ALL];
  const flatContactList = flattenContactList(displayContactList || []);
  const refSiriusContact = useRef<SiriusContactRefProps>(null);

  const onContactActions = isMailTemplate ? TempContactActions : ContactActions;
  const { doAddItemToSelector } = useActions(onContactActions);
  const mailStatus = useAppSelector(state => (isMailTemplate ? state.mailTemplateReducer.mailTemplateContent.status : state.mailReducer.currentMail.status));

  useEffect(() => {
    if (mailStatus) {
      const { keyword } = mailStatus;
      if (keyword !== searchValue) {
        setSearchValue(keyword);
      }
    }
  }, [mailStatus]);

  const throttleSearch = useCallback(
    debounce((value: string) => {
      getSearchContact(value).then(res => {
        if (res) {
          // @ts-ignore
          setSearchContactList(res);
        }
      });
    }, 700),
    []
  );

  const onGroupLoadData = (node: EventDataNode): Promise<void> => {
    const { key } = node;
    return new Promise<void>(resolve => {
      if (String(key) === StaticNodeKey.GROUP) {
        resolve();
        return;
      }
      contactApi
        .doGetOrgContactListByTeamId({
          idList: [String(key)],
          needContactModelData: true,
        })
        .then(list => {
          const memberList = list as EntityOrgTeamContact[];
          setGroupData(data => {
            const res = [...data];
            const curNode = res[0]?.children?.find(item => item.key === key);
            if (curNode) {
              curNode.children = memberList.map(item => ({
                title: item?.model?.contact.contactName,
                key: item.id,
                value: item?.model,
                isLeaf: true,
              }));
            }
            return res;
          });
          resolve();
        });
    });
  };

  const onSearch = (keyword: string): void => {
    trackApi.track('pcMail_searchContacts_Address_writeMailPage');
    setSearchValue(keyword);
    throttleSearch(keyword);
    if (!keyword) {
      setSearchContactList(null);
    }
  };

  const onLoadData: TreeProps['loadData'] = useCallback(
    ({ key }) =>
      new Promise<void>(resolve => {
        // 获取企业通讯录组织节点下联系人
        if (String(key) === StaticNodeKey.CORP) {
          // 根节点下无联系人
          resolve();
          return;
        }
        getContact(String(key)).then(list => {
          setOrgData(origin =>
            updateOrgTreeData(
              origin,
              key,
              list.map(item => data2Leaf(item, 'EMAIL'))
            )
          );
          resolve();
        });
      }),
    []
  );

  const dispatchPendingItem = useCallback(
    debounce(
      item => {
        doAddItemToSelector({
          add: true,
          pendingItem: item,
        });
      },
      200,
      { leading: true, trailing: false }
    ),
    []
  );

  const dispatchPendingList = useCallback(
    debounce(
      node => {
        getAllPersonContact(node).then(list =>
          doAddItemToSelector({
            add: true,
            pendingItem: list,
          })
        );
      },
      200,
      { leading: true, trailing: false }
    ),
    []
  );

  const dispatchGroupList = useCallback(
    debounce(
      node => {
        contactApi.doGetOrgContactListByTeamId({ idList: [node.key], needContactModelData: true }).then(list => {
          // debugger;
          const memberList = list as EntityOrgTeamContact[];
          doAddItemToSelector({
            add: true,
            pendingItem: memberList.map(item => item.model),
          });
        });
      },
      200,
      { leading: true, trailing: false }
    ),
    []
  );

  const renderTitle = (node, type: TreeType) => {
    if (node.isLeaf) {
      return (
        <Tooltip
          title={node.value?.contact?.accountName}
          destroyTooltipOnHide={{ keepParent: false }}
          placement="bottomLeft"
          overlayClassName="contact-tooltip"
          mouseLeaveDelay={0}
        >
          <div className={styles.treeNode} onClick={() => dispatchPendingItem(node.value)}>
            <span>{node.title}</span>
          </div>
        </Tooltip>
      );
    }
    if (node.key === StaticNodeKey.GROUP || type === TreeType.PERSON || node.key === StaticNodeKey.CORP || node.key === '-1') {
      return (
        <div className={styles.treeNode}>
          <span>{node.title}</span>
        </div>
      );
    }
    return (
      <div className={styles.treeNode}>
        <span>{node.title}</span>
        <Button
          className="treenode-btn"
          onClick={e => {
            e.stopPropagation();
            trackApi.track('pcMail_click_fillDepartmentContacts_enterpriseAddress__writeMailPage');
            if (type === TreeType.GROUP) {
              dispatchGroupList(node);
            } else {
              dispatchPendingList(node);
            }
          }}
        >
          {type === TreeType.GROUP ? '填入群组' : '填入部门'}
        </Button>
      </div>
    );
  };

  const renderPersonTitle: TreeProps['titleRender'] = useCallback(node => renderTitle(node, TreeType.PERSON), []);

  const renderOrgTitle: TreeProps['titleRender'] = useCallback(node => renderTitle(node, TreeType.ORG), []);

  const renderGroupTitle: TreeProps['titleRender'] = useCallback(node => renderTitle(node, TreeType.GROUP), []);

  const refresh = () => {
    // mlzou 通讯录组织更新（重置状态：当前不重置）
    refSiriusContact.current?.resetContactTree();
    // 获取企业通讯录组织架构层级树
    getOrgs().then(orgModel => {
      setOrgData(
        originOrgData.map(node => ({
          ...node,
          key: orgModel.org.id === '-1' ? StaticNodeKey.CORP : orgModel.org.id,
          value: orgModel.org,
          children: orgModel.children.map(data2Tree),
        }))
      );
    });
    // 获取个人通讯录列表数据
    getPersonContact().then(list => {
      setPersonData(
        updatePersonTreeData(
          originPersonData,
          list.map(item => data2Leaf(item, 'EMAIL'))
        )
      );
    });
    // 获取群组通讯录
    contactApi.doGetOrgList({ typeList: [2000] }).then(orgList => {
      const list = orgList as EntityTeamOrg[];
      setGroupData(data => {
        const res = [...data];
        res[0].children = list.map(item => ({
          ...item,
          key: item.id,
          title: item.orgName + '(' + item.memberNum + '人)',
          children: [],
        }));
        return res;
      });
    });
  };

  useEffect(() => {
    refresh();
    if (observerID !== undefined) {
      apiHolder.api.getEventApi().unregisterSysEventObserver('contactNotify', observerID);
    }
    observerID = apiHolder.api.getEventApi().registerSysEventObserver('contactNotify', {
      func: diff => {
        if (diff && diff.eventData.hasDiff) {
          refresh();
        }
      },
    });
    return () => {
      apiHolder.api.getEventApi().unregisterSysEventObserver('contactNotify', observerID);
    };
  }, []);

  const searchListItemRender = ({ index, key, style }) => {
    if (!flatContactList || !flatContactList[index]) {
      return null;
    }
    const item = flatContactList[index];
    return (
      <div key={key} style={style} onClick={() => dispatchPendingItem(item)}>
        <ContactItem key={key} item={item} search={searchValue} />
      </div>
    );
  };

  const personExpand = expendKeys => {
    // const expendKeysT = Array.isArray(expendKeys) || [];
    trackApi.track('pcMail_click_allContacts_personalAddress_writeMailPage', {
      status: expendKeys.length ? '收起' : '展开',
    });
  };

  const OrgExpand = status => {
    trackApi.track('pcMail_click_department_enterpriseAddress_writeMailPage', {
      status: status ? '展开' : '收起',
    });
  };

  const GroupExpand = status => {
    trackApi.track('pcMail_click_department_groupAddress_writeMailPage', {
      status: status ? '展开' : '收起',
    });
  };

  return (
    <SideContentLayout className={styles.contactTreeContainer} defaultWidth={ContactWidth} resizeHandles={[]}>
      <SiriusContact
        ref={refSiriusContact}
        onSearch={onSearch}
        personExpand={personExpand}
        OrgExpand={status => {
          OrgExpand(status);
        }}
        GroupExpand={status => {
          GroupExpand(status);
        }}
        personNodeSelect={() => {
          trackApi.track('pcMail_click_anyContacts_personalAddress_writeMailPage');
        }}
        nodeSelect={() => {
          trackApi.track('pcMail_click_anyContacts_enterpriseAddress_writeMailPage');
        }}
        keyword={searchValue}
        searchList={flatContactList as ContactModel[]}
        searchListItemRender={searchListItemRender}
        searchListItemHeight={LIST_ITEM_HEIGHT}
        renderPersonTitle={renderPersonTitle}
        renderOrgTitle={renderOrgTitle}
        renderGroupTitle={renderGroupTitle}
        onLoadData={onLoadData}
        personData={personData}
        orgData={orgData}
        groupData={groupData}
        onGroupLoadData={onGroupLoadData}
      />
    </SideContentLayout>
  );
};

export default WriteContact;
