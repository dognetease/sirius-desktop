/*
 * @Author: zhangqingsong
 * @Description: 分组选择输入框
 */
import React, { useState, useEffect, useRef, useImperativeHandle } from 'react';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import { apiHolder, apis, EdmSendBoxApi, GetAiHostingGroupItemRes } from 'api';
// import Divider from '@web-common/components/UI/Divider';
import Divider from '@lingxi-common-component/sirius-ui/Divider';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import { ReactComponent as PlusIcon } from '@/images/icons/edm/yingxiao/plus-icon.svg';
import styles from './GroupInputBox.module.scss';
import { getIn18Text } from 'api';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export interface GroupInputValue {
  groupId: string;
  groupName: string;
}

interface GroupInputBoxProps {
  taskId: string;
  initGroupId?: string;
  initGroup?: boolean;
  showTotal?: boolean;
  showAdd?: boolean;
  errorMsg?: string;
  // 选中值变化
  onChange: (val: GroupInputValue) => void;
}

const GroupInputBox = React.forwardRef((props: GroupInputBoxProps, ref) => {
  const { taskId, initGroupId, initGroup = false, showTotal = false, showAdd = true, errorMsg, onChange } = props;
  const selectRef = useRef();
  // 筛选分组列表
  const [groupFilterConfig, setGroupFilterConfig] = useState<GetAiHostingGroupItemRes[]>([]);
  // 筛选分组选中
  const [contactGroup, setContactGroup] = useState<string>();
  // 展示新建分组输入框
  const [groupAddVisible, setGroupAddVisible] = useState<boolean>(false);
  // 新建分组名称
  const [groupName, setGroupName] = useState<string>('');
  // 新建分组提示
  const [errorTip, setErrorTip] = useState<string>('');
  // 分组新建中
  const [creating, setCreating] = useState<boolean>(false);

  const createGroup = () => {
    setGroupAddVisible(true);
  };

  const handleSelect = (val: string) => {
    const groupName = groupFilterConfig.find(item => item.id === val)?.name || '';
    onChange({ groupId: val, groupName });
    setContactGroup(val);
  };

  const handleInputConfirm = async () => {
    if (creating) {
      return;
    }
    // 检验及接口调用
    const trimGroupName = groupName.trim();
    if (!trimGroupName) {
      setErrorTip(getIn18Text('FENZUMINGCHENGBUNENGWEI'));
      return;
    }
    const repeat = groupFilterConfig.some(item => item.name === trimGroupName);
    if (repeat) {
      setErrorTip(getIn18Text('FENZUMINGCHENGZHONGFU！'));
      return;
    }
    setCreating(true);
    const result = await edmApi.createAiHostingGroup({ taskId, name: trimGroupName });
    const groupId = result?.groupId;
    if (groupId) {
      await getContactGroup();
      handleInputCancel();
    } else {
      setErrorTip(getIn18Text('XINJIANFENZUSHIBAI，'));
      setCreating(false);
    }
    selectRef.current?.blur();
  };

  const handleInputChange = e => {
    setErrorTip('');
    setGroupName(e.target.value);
  };

  const handleInputCancel = () => {
    setGroupAddVisible(false);
    setGroupName('');
    setErrorTip('');
  };

  // 获取联系人分组下拉项
  const getContactGroup = async () => {
    if (!taskId) {
      return;
    }
    const contactGroup = await edmApi.getAiHostingGroupList({ taskId });
    const contactGroupList = showTotal ? [{ id: '-1', name: getIn18Text('QUANBU') }] : [];
    if (Array.isArray(contactGroup.groupList)) {
      contactGroupList.push(...contactGroup.groupList);
    }
    setGroupFilterConfig([...contactGroupList]);
  };

  // 初始化获取
  useEffect(() => {
    // 添加联系人后分组默认选中【未分组】，由于【未分组】是接口返回，与服务端协定默认分组id始终为'0'
    if (initGroup && taskId) {
      handleSelect('0');
    } else {
      onChange({});
    }
    getContactGroup();
  }, []);

  useImperativeHandle(ref, () => ({
    getContactGroup,
  }));

  useEffect(() => {
    if (creating && groupFilterConfig?.length) {
      handleSelect(groupFilterConfig[groupFilterConfig.length - 1].id);
      setCreating(false);
    } else if (initGroupId && groupFilterConfig?.length) {
      handleSelect(initGroupId);
    }
  }, [groupFilterConfig]);

  // 返回结构
  return (
    <div className={styles.groupInputBox}>
      <EnhanceSelect
        className={styles.select}
        ref={selectRef}
        value={contactGroup}
        placeholder={showTotal ? getIn18Text('LIANXIRENFENZU') : getIn18Text('QINGXUANZELIANXIRENFEN')}
        onSelect={handleSelect}
        dropdownMatchSelectWidth={false}
        dropdownRender={option => (
          <>
            {option}
            {showAdd && taskId ? (
              <>
                <div className={styles.dropdownOperation}>
                  {groupAddVisible ? (
                    <>
                      <Input className={styles.dropdownInput} placeholder={getIn18Text('QINGSHURUXINJIANFENZU')} onChange={handleInputChange} maxLength={10} />
                      {errorTip ? <span className={styles.errorTip}>{errorTip}</span> : <></>}
                      <div className={styles.dropdownBtns}>
                        <span onClick={handleInputConfirm}>{getIn18Text('QUEDING')}</span>
                        <span onClick={handleInputCancel}>{getIn18Text('QUXIAO')}</span>
                      </div>
                    </>
                  ) : (
                    <></>
                  )}
                  <Divider margin={4} />
                </div>
                <div className={styles.dropdownCreate} onClick={createGroup}>
                  <span>{getIn18Text('XINJIANGERENFEN')}</span>
                  <PlusIcon />
                </div>
              </>
            ) : (
              <></>
            )}
          </>
        )}
      >
        {groupFilterConfig.map(item => (
          <InSingleOption key={item.id} value={item.id}>
            {item.name}
          </InSingleOption>
        ))}
      </EnhanceSelect>
      {errorMsg ? <span className={styles.errorTip}>{errorMsg}</span> : <></>}
    </div>
  );
});

export default GroupInputBox;
