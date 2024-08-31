/*
 * @Author: zhangqingsong
 * @Description: 营销任务选择输入框
 */
import React, { FC, useState, useEffect } from 'react';
import classnames from 'classnames';
import { apiHolder, apis, GetAiHostingPlansRes, EdmSendBoxApi, getIn18Text } from 'api';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
// import Divider from '@web-common/components/UI/Divider';
import Divider from '@lingxi-common-component/sirius-ui/Divider';
import { ReactComponent as PlusIcon } from '@/images/icons/edm/yingxiao/plus-icon.svg';
import styles from './SchemeInputBox.module.scss';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

const IntervalUnitMap = {
  DAY: getIn18Text('TIAN'),
  HOUR: getIn18Text('XIAOSHI'),
};

export interface SchemeInputValue {
  schemeId: string;
  schemeName: string;
}

const SchemeInputBox: FC<{
  taskId: string;
  showTotal?: boolean;
  showTag?: boolean;
  showCreate?: boolean;
  errorMsg?: string;
  defaultPlanId?: string;
  // 选中值变化
  onChange: (value: SchemeInputValue) => void;
  // 新建任务
  onCreate?: () => void;
}> = props => {
  const { taskId, showTotal = false, showTag = true, showCreate = false, errorMsg, defaultPlanId, onChange, onCreate } = props;
  // 营销任务列表
  const [schemeFilterConfig, setSchemeFilterConfig] = useState<GetAiHostingPlansRes>([]);
  // 营销任务选中
  const [selectedScheme, setSelectedScheme] = useState<string>(defaultPlanId || '');

  // 获取联系人任务下拉项
  const getContactScheme = async () => {
    if (!taskId) {
      return;
    }
    const contactScheme = await edmApi.getAiHostingPlanList({ taskId, ...(showTotal ? {} : { filterAuto: true }) });
    const contactSchemeList = (showTotal ? [{ planId: '-1', planName: getIn18Text('QUANBU') }] : []) as GetAiHostingPlansRes;
    if (Array.isArray(contactScheme)) {
      contactSchemeList.push(...contactScheme.map(item => ({ ...item, label: item.planName })));
    }
    setSchemeFilterConfig(contactSchemeList);
  };

  useEffect(() => {
    getContactScheme();
  }, []);

  const handleChange = (val: string) => {
    const schemeName = schemeFilterConfig.find(item => item.planId === val)?.planName || '';
    onChange({ schemeId: val, schemeName });
    setSelectedScheme(val);
  };

  // 新建任务
  const createScheme = () => {
    onCreate && onCreate();
  };

  // 返回结构
  return (
    <div className={styles.schemeInputBox}>
      <EnhanceSelect
        className={styles.select}
        showSearch={!showTotal}
        dropdownMatchSelectWidth={false}
        value={selectedScheme || undefined}
        onChange={handleChange}
        placeholder={showTotal ? getIn18Text('YINGXIAORENWU') : getIn18Text('QINGXUANZEYINGXIAORENWU')}
        dropdownRender={option => (
          <>
            {option}
            {showCreate ? (
              <>
                <Divider className={styles.schemeInputOperation} margin={4} />
                <div className={styles.schemeInputCreate} onClick={createScheme}>
                  <span>{getIn18Text('XINJIANRENWU')}</span>
                  <PlusIcon />
                </div>
              </>
            ) : (
              <></>
            )}
          </>
        )}
        filterOption={(searchValue, option) => {
          return option?.label?.indexOf(searchValue) > -1;
        }}
      >
        {schemeFilterConfig.map((item, index) => (
          <InSingleOption key={item.planId} value={item.planId} label={item.planName}>
            <div className={styles.schemeInputItem}>
              <span className={styles.schemeName}>{item.planName}</span>
              {showTag && (!showTotal || (showTotal && index > 0)) ? (
                <span className={classnames(styles.schemeTag, index < 4 ? styles[`schemeTag${index + 1}`] : {})}>
                  {getIn18Text('GONG')}
                  {item.interval}
                  {IntervalUnitMap[item.intervalUnit]}/{item.rounds}
                  {getIn18Text('LUN')}
                </span>
              ) : (
                <></>
              )}
            </div>
          </InSingleOption>
        ))}
      </EnhanceSelect>
      {errorMsg ? <span className={styles.errorTip}>{errorMsg}</span> : <></>}
    </div>
  );
};

export default SchemeInputBox;
