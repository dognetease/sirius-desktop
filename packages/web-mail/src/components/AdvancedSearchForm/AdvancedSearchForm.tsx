import { Button, Checkbox, DatePicker, Form, Select, TreeSelect, Tooltip } from 'antd';
import React, { useState, useRef } from 'react';
import { usePopper } from 'react-popper';
import cnLocale from 'antd/es/date-picker/locale/zh_CN';
import { Moment } from 'moment';
import isEqual from 'lodash/isEqual';
import { apiHolder as api, apis, DataTrackerApi, ProductTagEnum, MailBoxModel, AccountApi } from 'api';
import TriangleDownIcon from '@web-common/components/UI/Icons/svgs/TriangleDown';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import { accountObj } from '../../types';
import styles from './advancedsearchform.module.scss';
import { AdvancedSearchFormProps } from './data';
import { advancedSearchFolderData2Tree, advancedSearchEnable } from '../../util';
import { FLOLDER } from '../../common/constant';
import InputContextMenu from '@web-common/components/UI/InputContextMenu/InputContextMenu';
// import { Input as LxInput } from '@web-common/components/UI/Input';
import LxInput from '@lingxi-common-component/sirius-ui/Input';
import { getIn18Text } from 'api';

const systemApi = api.api.getSystemApi();
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const userInfo = systemApi.getCurrentUser();
const mainAccount = userInfo?.loginAccount || userInfo?.id || '';
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const initValue = {
  to: '',
  from: '',
  subject: '',
  content: '',
  fids: '_ALL_FOLDER_',
  start: null,
  end: null,
  attach: 0,
  redFlag: false,
  account: mainAccount,
};
const AdvancedSearchForm: React.FC<AdvancedSearchFormProps> = ({
  advancedSearchVisible,
  advancedSearchLoading,
  referenceElement,
  onSubmit,
  form,
  onClose,
  treeMap,
  isSearching,
}) => {
  const [popperElement, setPopperElement] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  // 用户选中账号 用于更新文件夹列表
  const [currentAccount, setCurrentAccount] = useState<string>(mainAccount);
  const [totalAccount, setTotalAccount] = useState<accountObj[]>([]);
  const toInputRef = useRef(null);
  const fromInputRef = useRef(null);
  const subjectInputRef = useRef(null);
  const commentInputRef = useRef(null);
  const contentInputRef = useRef(null);

  const {
    styles: popStyles,
    attributes,
    update,
  } = usePopper(referenceElement?.current, popperElement, {
    placement: 'bottom-start',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [4, -16],
        },
      },
    ],
  });

  const getTotalAccount = async () => {
    const totalAccounts = ((await accountApi.getMainAndSubAccounts({ expired: false })) || []).map(item => ({
      key: item.id,
      value: item.agentEmail,
    }));
    setTotalAccount(totalAccounts);
  };

  // 获取所有账号
  React.useEffect(() => {
    advancedSearchVisible && getTotalAccount();
  }, [advancedSearchVisible]);

  React.useEffect(() => {
    if (update) {
      update();
    }
  }, [isSearching, advancedSearchVisible]);

  const handleFinish = (values: any) => {
    if (advancedSearchEnable(values)) {
      setErrorMsg('');
      const { start, end } = values as {
        start: Moment;
        end: Moment;
      };
      if (start && end && end.isBefore(start)) {
        return setErrorMsg(getIn18Text('JIESHUSHIJIANBU'));
      }
      trackApi.track('pcMail_click_search_advancedSearchPage');
      return onSubmit(values);
    }
    setErrorMsg(getIn18Text('QINGZHISHAOSHURU'));
  };

  const getCurrentAccountKey = () => {
    const currentAccountKey = totalAccount.find(item => item.value === currentAccount)?.key;
    return !currentAccountKey || currentAccountKey === mainAccount ? 'main' : currentAccountKey;
  };

  return (
    <div>
      {advancedSearchVisible && (
        <div
          onClick={() => {
            onClose(false);
          }}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
        />
      )}
      <div
        ref={setPopperElement}
        className="u-mail-search-form-container ant-allow-dark"
        style={{
          ...popStyles.popper,
          display: advancedSearchVisible ? 'block' : 'none',
        }}
        {...attributes.popper}
      >
        <ProductAuthTag tagName={ProductTagEnum.ADVANCED_SEARCH} flowTipStyle={{ top: '-15px', left: '30px' }}>
          <p className="u-title-text">{getIn18Text('GAOJISOUSUO')}</p>
        </ProductAuthTag>

        <i className="close-icon dark-invert" onClick={() => onClose(false)} />
        <Form preserve onFinish={handleFinish} form={form} className="u-mail-advanced-search-form" layout="inline" colon={false} initialValues={initValue}>
          <InputContextMenu inputOutRef={toInputRef} changeVal={value => form.setFieldsValue({ to: value })}>
            <Form.Item label={getIn18Text('SHOUJIANREN')} name="to">
              <LxInput ref={toInputRef} placeholder={getIn18Text('QINGSHURUSHOUJIAN')} openFix={false} />
            </Form.Item>
          </InputContextMenu>
          <InputContextMenu inputOutRef={fromInputRef} changeVal={value => form.setFieldsValue({ from: value })}>
            <Form.Item label={getIn18Text('FAJIANREN')} name="from" className="u-mail-advanced-search-form-row-last">
              <LxInput ref={fromInputRef} placeholder={getIn18Text('QINGSHURUFAJIAN')} openFix={false} />
            </Form.Item>
          </InputContextMenu>
          <InputContextMenu inputOutRef={subjectInputRef} changeVal={value => form.setFieldsValue({ subject: value })}>
            <Form.Item label={getIn18Text('YOUJIANZHUTI')} name="subject">
              <LxInput ref={subjectInputRef} placeholder={getIn18Text('QINGSHURUZHUTI')} openFix={false} />
            </Form.Item>
          </InputContextMenu>
          <InputContextMenu inputOutRef={contentInputRef} changeVal={value => form.setFieldsValue({ content: value })}>
            <Form.Item label={getIn18Text('YOUJIANZHENGWEN')} name="content" className="u-mail-advanced-search-form-row-last">
              <LxInput ref={contentInputRef} placeholder={getIn18Text('QINGSHURUZHENGWEN')} openFix={false} />
            </Form.Item>
          </InputContextMenu>
          <Form.Item label={getIn18Text('WENJIANJIA')} initialValue="_ALL_FOLDER_" name="fids">
            <TreeSelect
              virtual={false}
              dropdownMatchSelectWidth={false}
              placeholder={getIn18Text('QUANBU')}
              dropdownClassName="u-mail-advanced-search-folder-dropdown"
              suffixIcon={<i className="expand-icon" />}
              treeIcon
              treeData={[
                {
                  entry: { mailBoxName: getIn18Text('QUANBU'), mailBoxId: '_ALL_FOLDER_' },
                  mailBoxId: '_ALL_FOLDER_',
                  childrenCount: 0,
                } as unknown as MailBoxModel,
                ...(treeMap[getCurrentAccountKey()]?.mailFolderTreeList || []),
              ]
                .filter(mailbox => mailbox.entry.mailBoxId !== FLOLDER.TASK)
                .map(advancedSearchFolderData2Tree)}
              getPopupContainer={() => popperElement}
            />
          </Form.Item>
          <Form.Item label={getIn18Text('SHIJIANFANWEI')} className="u-mail-advanced-search-form-row-last u-mail-advanced-search-form-date-range">
            <Form.Item noStyle name="start">
              <DatePicker
                showToday={false}
                dropdownClassName="u-advanced-form-datePickerDropDown"
                locale={cnLocale}
                suffixIcon={null}
                placeholder={getIn18Text('KAISHISHIJIAN')}
                getPopupContainer={() => popperElement}
                className="u-mail-advanced-search-form-date-picker"
              />
            </Form.Item>
            <span className="u-mail-advanced-search-form-date-picker-split" />
            <Form.Item noStyle name="end">
              <DatePicker
                showToday={false}
                dropdownClassName="u-advanced-form-datePickerDropDown"
                locale={cnLocale}
                suffixIcon={null}
                placeholder={getIn18Text('JIESHUSHIJIAN')}
                getPopupContainer={() => popperElement}
                className="u-mail-advanced-search-form-date-picker"
              />
            </Form.Item>
          </Form.Item>
          <Form.Item label={getIn18Text('FUJIAN')} name="attach">
            <Select
              dropdownClassName="u-advanced-search-form-select-dropdown"
              placeholder={getIn18Text('QUANBU')}
              getPopupContainer={() => popperElement}
              suffixIcon={<i className="expand-icon" />}
            >
              <Select.Option value={0}>{getIn18Text('QUANBU')}</Select.Option>
              <Select.Option value={1}>{getIn18Text('HANFUJIAN')}</Select.Option>
              <Select.Option value={2}>{getIn18Text('BUHANFUJIAN')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={getIn18Text('HONGQI')} valuePropName="checked" name="redFlag" className="u-mail-advanced-search-form-row-last">
            <Checkbox>{getIn18Text('JINHONGQIYOUJIAN')}</Checkbox>
          </Form.Item>
          <InputContextMenu inputOutRef={commentInputRef} changeVal={value => form.setFieldsValue({ memo: value })}>
            <Form.Item label="邮件备注" name="memo">
              <LxInput ref={commentInputRef} placeholder="请输入备注内容" openFix={false} />
            </Form.Item>
          </InputContextMenu>
          {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}
          {totalAccount.length > 1 && (
            <Form.Item label="搜索邮箱:" name="account" className="u-mail-advanced-search-form-account-select">
              <Select
                onChange={setCurrentAccount}
                defaultValue={mainAccount}
                dropdownClassName={styles.selectDropdown}
                suffixIcon={<TriangleDownIcon />}
                className={styles.mailSenderSelect}
              >
                {totalAccount.map(item => (
                  <Select.Option default={item.value === mainAccount} value={item.value}>
                    <Tooltip title={item.value}>{item.value}</Tooltip>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item className={`u-advanced-search-form-button-group ${totalAccount.length <= 1 ? 'u-advanced-search-form-button-group-block' : ''}`} shouldUpdate>
            {({ getFieldsValue }) => {
              // 简单对象复制后，删除account后对比，因为account的切换不影响按钮置灰状态
              const cloneFieldsValue = { ...getFieldsValue() };
              const cloneInitValue = { ...initValue };
              delete cloneFieldsValue.account;
              delete cloneInitValue.account;
              return (
                <>
                  <Button htmlType="reset" disabled={advancedSearchLoading}>
                    {getIn18Text('ZHONGZHI')}
                  </Button>
                  <Button loading={advancedSearchLoading} disabled={advancedSearchLoading || isEqual(cloneFieldsValue, cloneInitValue)} type="primary" htmlType="submit">
                    {`${getIn18Text('SOUSUO')}${advancedSearchLoading ? getIn18Text('ZHONG') : ''}`}
                  </Button>
                </>
              );
            }}
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};
export default AdvancedSearchForm;
