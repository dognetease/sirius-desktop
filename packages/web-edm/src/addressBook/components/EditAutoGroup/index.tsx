import React, { useState, useEffect } from 'react';
import { Select, Switch, Space } from 'antd';
import { apis, apiHolder, AddressBookApi, IAddressGroupListItem } from 'api';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import style from './index.module.scss';
import { getIn18Text } from 'api';
const { Option } = Select;
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
export interface EditAutoGroupProps {
  visible: boolean;
  title: string;
  existRule: boolean;
  sourceName: string;
  sourceType: number;
  groupIdList: number[];
  enable: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}
const EditAutoGroup: React.FC<EditAutoGroupProps> = props => {
  const { visible, title, existRule, sourceName, sourceType, groupIdList: groupIdListFromProps, enable: enableFromProps, onCancel, onSuccess } = props;
  const [loading, setLoading] = useState<boolean>(false);
  const [groupIdList, setGroupIdList] = useState<number[]>([]);
  const [groups, setGroups] = useState<IAddressGroupListItem[]>([]);
  const [enable, setEnable] = useState<boolean>(false);
  const handleFetchAllGroups = () => {
    addressBookApi.getAddressGroupList().then(nextGroups => {
      setGroups(nextGroups);
    });
  };
  const handleSubmit = () => {
    setLoading(true);
    const params = {
      groupIdList,
      sourceType,
      sourceStatus: +enable,
    };
    const promise = existRule ? addressBookApi.editAutoGroup(params) : addressBookApi.addAutoGroup(params);
    promise
      .then(() => {
        onSuccess();
      })
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(() => {
    if (visible) {
      setGroupIdList(groupIdListFromProps);
      setEnable(enableFromProps);
      handleFetchAllGroups();
    }
  }, [visible]);
  return (
    <Modal
      className={style.editAutoGroup}
      width={480}
      title={title}
      visible={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okButtonProps={{
        loading,
        disabled: !groupIdList.length,
      }}
    >
      <div className={style.tip}>
        {getIn18Text('JIANGCHUANGJIANFANGSHIWEI[')}
        {sourceName}
        {getIn18Text(']DELIANXIRENZIDONGFENZUDAO\uFF1A')}
      </div>
      <Select className={style.select} placeholder={getIn18Text('QINGXUANZEFENZU')} mode="multiple" value={groupIdList} onChange={setGroupIdList} allowClear showSearch>
        {groups.map(item => (
          <Option value={item.groupId}>{item.groupName}</Option>
        ))}
      </Select>
      <Space className={style.ruleSwitch}>
        {getIn18Text('SHIFOUQIYONGGUIZE')}
        <Switch checked={enable} onChange={setEnable} />
      </Space>
    </Modal>
  );
};
export default EditAutoGroup;
