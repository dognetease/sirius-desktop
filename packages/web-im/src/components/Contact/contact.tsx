import React, { useState, useEffect, useRef, useCallback } from 'react';
import classnames from 'classnames';
import { DataNode, TreeProps, EventDataNode } from 'antd/lib/tree';
import debounce from 'lodash/debounce';
import { ContactModel, apiHolder, apis, ContactAndOrgApi } from 'api';
import SiriusContact, { SiriusContactRefProps } from '@web-common/components/UI/SiriusContact/siriusContact';
import { filterContactListByYunxin } from '../../utils/im_team_util';
import {
  ContactDataNode,
  data2Tree,
  data2Leaf,
  updatePersonTreeData,
  updateOrgTreeData,
  getPersonContact,
  getOrgs,
  getContact,
  getSearchContact,
  SearchGroupKey,
  StaticNodeKey,
  contactApi,
} from '@web-common/utils/contact_util';
import { UIContactModel } from '@web-contact/data';
import ContactItem from '../ContactItem/contactItem';
import styles from './contact.module.scss';
import { getIn18Text } from 'api';

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

const LIST_ITEM_HEIGHT = 28;
const originPersonData = [
  {
    key: StaticNodeKey.PERSON,
    title: getIn18Text('GERENTONGXUNLU'),
    children: [{ key: StaticNodeKey.PERSON_ALL, isLeaf: false, title: getIn18Text('SUOYOULIANXIREN') }],
  },
];
const originOrgData = [
  {
    key: StaticNodeKey.CORP,
    title: getIn18Text('QIYETONGXUNLU'),
    children: [],
  },
];
let observerID: any;
export interface CheckboxProps {
  checked: boolean;
  disabled: boolean;
  style: React.CSSProperties;
}
export const Checkbox: React.FC<CheckboxProps> = props => {
  const { checked, style, disabled } = props;
  return (
    <span
      className={classnames([styles.checkbox], {
        [styles.checkboxChecked]: checked,
        [styles.checkboxDisabled]: disabled,
      })}
      style={{ ...style }}
    >
      <span className={styles.checkboxInner} />
    </span>
  );
};
export interface TreeNodeProps {
  node: ContactDataNode;
  chooseMember: (member: ContactModel) => boolean;
  chosen: boolean;
  disabled: boolean;
}
const TreeNode: React.FC<TreeNodeProps> = props => {
  const { node, chooseMember, chosen, disabled } = props;
  const [checked, setChecked] = useState<boolean>(false);
  useEffect(() => {
    setChecked(chosen);
  }, [chosen]);
  if (node.isLeaf) {
    const onNodeClick = () => {
      if (!disabled) {
        setChecked(chooseMember(node.value as ContactModel));
      }
    };
    const checkboxStyle: React.CSSProperties = {
      position: 'absolute',
      left: '16px',
      top: '8px',
    };
    return (
      <div className={styles.treeNode} onClick={onNodeClick}>
        <span>{node.title}</span>
        <Checkbox checked={checked} disabled={disabled} style={checkboxStyle} />
      </div>
    );
  }
  return (
    <div className={styles.treeNode}>
      <span>{node.title}</span>
    </div>
  );
};
export interface ContactProps {
  chooseMember: (member: ContactModel) => boolean;
  chosenMembers?: ContactModel[];
  disabledMembers?: ContactModel[];
}
const Contact: React.FC<ContactProps> = props => {
  const { chooseMember, chosenMembers = [], disabledMembers = [] } = props;
  const [personData, setPersonData] = useState<DataNode[]>(originPersonData);
  const [orgData, setOrgData] = useState<DataNode[]>(originOrgData);
  const [searchValue, setSearchValue] = useState<string>('');
  const [searchContactList, setSearchContactList] = useState<
    | {
        [key in SearchGroupKey]: UIContactModel[];
      }
    | null
  >();
  const [selectedPersonKeys, setSelectedPersonKeys] = useState<string[]>([]);
  const [selectedOrgKeys, setSelectedOrgKeys] = useState<string[]>([]);
  const refSiriusContact = useRef<SiriusContactRefProps>(null);
  const displayContactList = filterContactListByYunxin(((searchContactList && searchContactList[SearchGroupKey.ALL]) || []) as ContactModel[]);
  useEffect(() => {
    const members: ContactModel[] = ([] as ContactModel[]).concat(chosenMembers, disabledMembers);
    const keys = members.map(member => member.contact.id);
    // 这里不能区分企业通讯录和个人通讯录
    setSelectedPersonKeys(keys);
    setSelectedOrgKeys(keys);
  }, [chosenMembers, disabledMembers]);
  const throttleSearch = useCallback(
    debounce((value: any) => {
      getSearchContact(value, true).then(res => {
        if (res) {
          // console.log(value, res);
          setSearchContactList(res);
        }
      });
    }, 300),
    []
  );
  const onLoadData = (node: EventDataNode): Promise<void> => {
    const { key } = node;
    return new Promise<void>(resolve => {
      // 获取企业通讯录组织节点下联系人
      if (String(key) === StaticNodeKey.CORP) {
        // 根节点下无联系人
        resolve();
        return;
      }
      getContact(String(key)).then(list => {
        const filteredList = filterContactListByYunxin(list as ContactModel[]);
        setOrgData(origin =>
          updateOrgTreeData(
            origin,
            key,
            filteredList.map(item => data2Leaf(item, 'yunxin'))
          )
        );
        resolve();
      });
    });
  };
  const onSearch = (keyword: string): void => {
    // console.log(`onSearch keyword is ${keyword}`);
    setSearchValue(keyword);
    throttleSearch(keyword);
    if (!keyword) {
      setSearchContactList(null);
    }
  };
  const renderTitle: TreeProps['titleRender'] = node => {
    // node的key带有上级组织的key，不能直接拿来比较
    const key = contactApi.findContactInfoVal((node as any).value?.contactInfo, 'EMAIL');
    const chosen = chosenMembers.concat(disabledMembers).some(member => {
      return contactApi.findContactInfoVal(member.contactInfo, 'EMAIL') === key;
    });
    const disabled = disabledMembers.some(member => contactApi.findContactInfoVal(member.contactInfo, 'EMAIL') === key);
    return <TreeNode node={node} chooseMember={chooseMember} chosen={chosen} disabled={disabled} />;
  };
  const refresh = () => {
    refSiriusContact.current?.resetContactTree();
    // 获取企业通讯录组织架构层级树
    getOrgs({ isIM: true }).then(orgData => {
      setOrgData(
        originOrgData.map(node => ({
          ...node,
          key: orgData.org.id,
          children: orgData.children.map(data2Tree),
        }))
      );
    });
    // 获取个人通讯录列表数据
    getPersonContact({ isIM: true }).then(list => {
      const filteredList = filterContactListByYunxin(list as ContactModel[]);
      setPersonData(
        updatePersonTreeData(
          originPersonData,
          filteredList.map(item => data2Leaf(item, 'yunxin'))
        )
      );
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
    if (!displayContactList || !displayContactList[index]) {
      return null;
    }
    const item = displayContactList[index];
    const chosen = chosenMembers.concat(disabledMembers).some(member => {
      // member.contactInfo[0]?.contactItemVal === item.contactInfo[0]?.contactItemVal
      return contactApi.findContactInfoVal(member.contactInfo) === contactApi.findContactInfoVal(item.contactInfo);
    });
    const disabled = disabledMembers.some(member => {
      // member.contactInfo[0]?.contactItemVal === item.contactInfo[0]?.contactItemVal
      return contactApi.findContactInfoVal(member.contactInfo) === contactApi.findContactInfoVal(item.contactInfo);
    });
    return (
      <div key={key} style={style}>
        <ContactItem item={item} search={searchValue} chooseMember={chooseMember} chosen={chosen} disabled={disabled} />
      </div>
    );
  };
  // console.log(displayContactList);
  return (
    <SiriusContact
      ref={refSiriusContact}
      onSearch={onSearch}
      searchList={displayContactList}
      searchListItemRender={searchListItemRender}
      searchListItemHeight={LIST_ITEM_HEIGHT}
      renderPersonTitle={renderTitle}
      renderOrgTitle={renderTitle}
      onLoadData={onLoadData}
      personData={personData}
      orgData={orgData}
      selectedPersonKeys={selectedPersonKeys}
      selectedOrgKeys={selectedOrgKeys}
      containerClassName={styles.contactTreeContainer}
    />
  );
};
export default Contact;
