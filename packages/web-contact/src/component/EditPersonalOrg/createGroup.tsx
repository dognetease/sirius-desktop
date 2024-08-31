import React, { useEffect, useState, useImperativeHandle, useRef } from 'react';
import style from './chooseGroup.module.scss';
import classnames from 'classnames/bind';
import { Checkbox, Input } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { api, apis, ContactAndOrgApi, InsertPersonalOrgRes, AccountApi } from 'api';
import lodashGet from 'lodash/get';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactAndOrgApi;
const ErrorDesc = {
  0: '',
  1: getIn18Text('ZUIDUOKESHURU'),
  2: getIn18Text('FENZUMINGCHENGYI'),
  3: '',
};
export interface CreateGroupRef {
  addBlurCreateLock?(): void;
  createNewGroup(): Promise<boolean>;
}
const systemApi = api.getSystemApi();
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
export const CreatePersonalGroup = React.forwardRef(
  (
    props: {
      count?: number;
      ref?: CreateGroupRef;
      _account?: string;
      customInputClass?: string;
      groupNames: string[];
      success(data: InsertPersonalOrgRes, checked: boolean): void;
      cancel(): void;
    },
    ref
  ) => {
    const { groupNames, cancel, success, customInputClass, _account = systemApi.getCurrentUser()?.id || '' } = props;
    // 0-success 1-字数超限 2-重名 3-服务端错误
    const [errorCode, setErrorCode] = useState<number>(0);
    const [isChecked, setIsChecked] = useState(true);
    const [groupName, setGroupName] = useState('');
    const blurCreatelockRef = useRef(false);
    useImperativeHandle(ref, () => {
      return {
        addBlurCreateLock() {
          blurCreatelockRef.current = true;
        },
        createNewGroup: createNewGroup,
      };
    });
    const changeGroupName: React.ChangeEventHandler<HTMLInputElement> = e => {
      setGroupName(e.target.value);
    };
    // 创建新分组期间上锁
    const [disable, setDisable] = useState(false);
    const createNewGroupByBlur = async () => {
      if (blurCreatelockRef.current === true) {
        blurCreatelockRef.current = false;
        return;
      }
      return createNewGroup();
    };
    const createNewGroup: () => Promise<boolean> = async () => {
      if (!groupName || !groupName.length) {
        cancel();
        return true;
      }
      const zhReg = /[\u4e00-\u9fa5]/g;
      const rules = [
        {
          rule(str: string) {
            const zhLen = lodashGet(str.match(zhReg), 'length', 0) as number;
            const totalLength = zhLen + str.length;
            return totalLength <= 40;
          },
          code: 1,
        },
        {
          rule(str: string) {
            return !groupNames.includes(str);
          },
          code: 2,
        },
      ];
      const errorCode = rules.reduce((total, current) => {
        if (total !== 0) {
          return total;
        }
        const { rule, code } = current;
        const flag = rule(groupName);
        return flag ? 0 : code;
      }, 0);
      setErrorCode(errorCode);
      if (errorCode !== 0) {
        return false;
      }
      setDisable(true);
      try {
        // accountApi.setCurrentAccount({ email: _account });
        const res = await contactApi.doInsertPersonalOrg({
          groupName: groupName.trim(),
          _account,
        });
        setDisable(false);
        if (!res.success) {
          setErrorCode(3);
          message.error(res.message);
          return false;
        }
        success(res.data as InsertPersonalOrgRes, isChecked);
        return true;
      } catch (ex) {
        setErrorCode(3);
        return false;
      }
    };
    const inputRef = React.useRef<any>(null);
    useEffect(() => {
      inputRef.current!.focus({
        cursor: 'start',
      });
    }, []);
    useEffect(() => {
      errorCode !== 0 &&
        inputRef.current!.focus({
          cursor: 'all',
        });
    }, [errorCode]);
    return (
      <div
        className={realStyle('orgItem', 'newCreateOrgItem')}
        onMouseDown={e => {
          (lodashGet(e, 'target.className', '') as string).toLowerCase().includes('checkbox') && (blurCreatelockRef.current = true);
        }}
      >
        <Checkbox
          checked={isChecked}
          onChange={e => {
            blurCreatelockRef.current = true;
            setIsChecked(e.target.checked);
          }}
        >
          <p className={realStyle('newGroupLabel')}>
            <Input
              onBlur={() => {
                return createNewGroupByBlur();
              }}
              disabled={disable}
              value={groupName}
              onPressEnter={() => {
                createNewGroup();
              }}
              onChange={changeGroupName}
              data-test-id="contact_personalOrg_input"
              className={realStyle('newGroupInput', { error: errorCode !== 0 }, customInputClass)}
              maxLength={40}
              ref={inputRef}
            />
            <span className={realStyle('errorTips', { visible: [1, 2].includes(errorCode) })}>{lodashGet(ErrorDesc, errorCode, '')}</span>
          </p>
        </Checkbox>
      </div>
    );
  }
);
