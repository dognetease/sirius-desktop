// 邮箱设置，展示模式是聚合还是智能
import React, { useEffect, useState } from 'react';
import { Radio, Select } from 'antd';
import CheckOutlined from '@ant-design/icons/CheckOutlined';
import { apiHolder as api, apis, DataTrackerApi, MailConfApi as MailConfApiType } from 'api';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import styles from './MailModeMergeOrAI.module.scss';
import classNames from 'classnames';
import { EnumMailListDisplayMode } from '../../enmu';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { useAppDispatch } from '@web-common/state/createStore';
// import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { getIn18Text } from 'api';

export const MailModeMergeOrAI: React.FC<{
  isVisible?: boolean;
  isQuick?: boolean; // 是否是快捷设置
}> = ({ isVisible, isQuick }) => {
  const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApiType;
  const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
  // const [mailListDisplayMode, setMailListDisplayMode] = useState<EnumMailListDisplayMode>(EnumMailListDisplayMode.INT_BOX);
  const [mailListDisplayMode, setMailListDisplayMode] = useState<EnumMailListDisplayMode>(EnumMailListDisplayMode.NORMAL_MODE);
  // const [intBoxModeRule, setIntBoxModeRule] = useState<EnumIntBoxDefaultMailList>();
  // redux数据
  // const [configMailLayout, setConfigMailLayout] = useState2RM('configMailLayout', 'doUpdateConfigMailLayout');
  // const [descChecked, setDescChecked] = useState2RM('configMailListShowDesc', 'doUpdateConfigMailListShowDesc');
  // const [attachmentChecked, setAttachmentChecked] = useState2RM('configMailListShowAttachment', 'doUpdateConfigMailListShowAttachment');
  // const [mailConfigListTightness, setMailConfigListTightness] = useState2RM('configMailListTightness', 'doUpdateConfigMailListTightness');
  // const [showAvator] = useState2RM('configMailListShowAvator', 'doUpdateConfigMailListShowAvator');

  const dispatch = useAppDispatch();

  // 模式修改
  const handleChangeMailListDisplayMode = (e: RadioChangeEvent) => {
    const value = e.target.value;
    const onOkFunc: Function = () => {
      dispatch(Thunks.resetRealListStateAndLoadList({ noLoad: true }));
      // const isIntBoxMode = value === EnumMailListDisplayMode.INT_BOX;
      const isIntBoxMode = value === EnumMailListDisplayMode.NORMAL_MODE;
      mailConfApi.setMailMergeSettings(!isIntBoxMode);
      // mailConfApi.setShowAIMailBox(isIntBoxMode).then(r => {
      //   r &&
      //     isIntBoxMode &&
      //     mailConfApi.getIntBoxDefaultDisplayList().then(v => {
      //       setIntBoxModeRule(v ? EnumIntBoxDefaultMailList.PRIORITY_MAIL : EnumIntBoxDefaultMailList.ALL_MAIL);
      //     });
      // });
      try {
        trackApi.track('pc_mail_mode_switch', {
          switch: !isIntBoxMode ? '切换为聚合' : '切换为普通',
        });
      } catch (error) {}
    };

    setMailListDisplayMode(value);
    onOkFunc();
  };
  // 获取默认值
  useEffect(() => {
    if (isVisible) {
      const mergeMode = mailConfApi.getMailMergeSettings() === 'true';
      // setMailListDisplayMode(mergeMode ? EnumMailListDisplayMode.MERGE_BY_SUMMARY : EnumMailListDisplayMode.INT_BOX);
      setMailListDisplayMode(mergeMode ? EnumMailListDisplayMode.MERGE_BY_SUMMARY : EnumMailListDisplayMode.NORMAL_MODE);
      // if (!mergeMode) {
      //   mailConfApi.getIntBoxDefaultDisplayList().then(value => {
      //     setIntBoxModeRule(value ? EnumIntBoxDefaultMailList.PRIORITY_MAIL : EnumIntBoxDefaultMailList.ALL_MAIL);
      //   });
      // }
    }
  }, [isVisible]);

  // 修改默认展示全部/优先
  // const handleSelect = (value: EnumIntBoxDefaultMailList) => {
  //   try {
  //     trackApi.track('pc_manage_default_list', {
  //       action: value === EnumIntBoxDefaultMailList.PRIORITY_MAIL ? '切换为优先处理邮件' : '切换为全部邮件'
  //     });
  //   } catch (error) {
  //   }
  //   setIntBoxModeRule(value);
  //   mailConfApi.setIntBoxDefaultDisplayList(value === EnumIntBoxDefaultMailList.PRIORITY_MAIL);
  // };

  // 渲染智能模式下，默认展示tab
  // const renderSelect = () => {
  //   const dom = (
  //     <div className={styles.selectWrapper}>
  //       <div className={styles.selectTip}>{getIn18Text('MORENZHANSHI')}</div>
  //       <Select
  //         size={isQuick ? 'middle' : 'small'}
  //         dropdownClassName={styles.selectDropdown}
  //         className={styles.selectMode}
  //         suffixIcon={<i className={styles.expandIcon} />}
  //         onChange={value => {
  //           handleSelect(value);
  //         }}
  //         value={intBoxModeRule}
  //         // dropdownRende
  //         menuItemSelectedIcon={
  //           <CheckOutlined
  //             style={{
  //               color: 'rgb(56 110 231)'
  //             }}
  //           />
  //         }
  //         dropdownMatchSelectWidth={false}
  //         options={[
  //           {
  //             label: getIn18Text('YOUXIANCHULIYOU'),
  //             value: EnumIntBoxDefaultMailList.PRIORITY_MAIL
  //           },
  //           {
  //             label: getIn18Text('QUANBUYOUJIAN'),
  //             value: EnumIntBoxDefaultMailList.ALL_MAIL
  //           }
  //         ]}
  //       />
  //     </div>
  //   );
  //   return mailListDisplayMode === EnumMailListDisplayMode.INT_BOX && intBoxModeRule !== undefined && dom;
  // };

  return (
    <div className={classNames(styles.mailMode, { [styles.isQuick]: isQuick })}>
      <Radio.Group value={mailListDisplayMode} onChange={handleChangeMailListDisplayMode}>
        <div className={styles.radioOuter}>
          <div className={styles.radioLeft}>
            <div className={styles.title}>
              {/* <Radio value={EnumMailListDisplayMode.INT_BOX}>{getIn18Text('normalMode')}</Radio> */}
              <Radio value={EnumMailListDisplayMode.NORMAL_MODE}>{getIn18Text('normalMode')}</Radio>
              {/* 非快捷设置 */}
              {/* {!isQuick && renderSelect()} */}
            </div>
            {/* {!isQuick ?
              <div className={styles.title2}>{getIn18Text('KAIQIHOU\uFF0CYOU11')}</div>
              : <div className={styles.title2}>
                {getIn18Text('mailConfigAITitle')}
                {renderSelect()}
              </div>
            } */}
            <div className={styles.title2}>{getIn18Text('normalModeTip')}</div>
          </div>
          <div className={styles.radioRight}>
            <div className={styles.radioImg1}></div>
          </div>
        </div>
        <div className={styles.radioOuter}>
          <div className={styles.radioLeft}>
            <div className={styles.title}>
              <Radio value={EnumMailListDisplayMode.MERGE_BY_SUMMARY}>{getIn18Text('ANZHUTIJUHE')}</Radio>
            </div>
            {!isQuick ? (
              <div className={styles.title2}>{getIn18Text('KAIQIHOU\uFF0CYOU')}</div>
            ) : (
              <div className={styles.title2}>{getIn18Text('mailConfigAITitle2')}</div>
            )}
          </div>
          <div className={styles.radioRight}>
            <div className={styles.radioImg2}></div>
          </div>
        </div>
      </Radio.Group>
    </div>
  );
};
export default MailModeMergeOrAI;
