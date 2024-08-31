import React, { useState, useEffect } from 'react';
import { Select, InputNumber, Checkbox, DatePicker, Button, message, Switch } from 'antd';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import moment from 'moment';
import styles from './openSeaSetting.module.scss';
import { api, apis, CustomerApi, IOpenSeaSettingRule } from 'api';
import classnames from 'classnames';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { getIn18Text } from 'api';
const openSeaSettingApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const { Option } = Select;
export const OpenSeaSetting = () => {
  const [enableRule, setEnableRule] = useState(false);
  const [showAutoRetreatTip, setShowAutoRetreatTip] = useState(false);
  const [rules, setRules] = useState<IOpenSeaSettingRule[]>([]);
  const [updateSettingLoading, setUpdateSettingLoading] = useState(false);
  useEffect(() => {
    openSeaSettingApi
      .getOpenSeaSetting()
      .then(result => {
        const { enable, params = [] } = result;
        setEnableRule(enable);
        setRules(formatData(params));
      })
      .catch(err => {
        console.log(err);
      });
  }, []);
  const formatData = (array: IOpenSeaSettingRule[]) => {
    return array.map(each => {
      return {
        ...each,
        conditions: each.conditions.map(value => {
          let dst = {
            ...value,
          };
          if (value.checked === null || value.checked === undefined) {
            dst.checked = false;
          }
          if (value.value === null || value.value === undefined) {
            dst.value = '';
          }
          // 防御code 兼容数字类型 理论上这个值不可能为数字
          if (typeof value.value === 'number') {
            dst.value = '' + value.value;
          }
          return dst;
        }),
      };
    });
  };
  const checkFormField = () => {
    for (const eachRule of rules) {
      const { conditions, rule, ruleName } = eachRule;
      switch (rule) {
        case 'autoRetreatEffectTime':
          const value = conditions.length && conditions[0].value;
          if (!value) {
            message.error(`${ruleName}必填`);
            return false;
          }
          const today = moment(moment().format('YYYY-MM-DD'));
          const selectDate = moment(value);
          if (selectDate.isBefore(today)) {
            message.error(getIn18Text('QIYONGSHIBAI\uFF0CSHENGXIAOSHIJIANXUWANYUJINRI'));
            return false;
          }
          break;
        case 'autoRetreatRule':
          // 确保必须有checked项
          if (conditions.length && !conditions.some(each => each.checked)) {
            message.error(`${ruleName}必填`);
            return false;
          }
          // 确保每一个check中的选项均有值
          for (const condition of conditions) {
            if (condition.checked && (condition.value as string).length === 0) {
              message.error(`${ruleName}必填`);
              return false;
            }
          }
          break;
        default:
          return true;
      }
    }
    return true;
  };
  const toggleRule = () => {
    // 在停用规则的情况下，可更新配置字段，需校验字段
    if (!enableRule) {
      if (!checkFormField()) {
        return;
      }
    }
    updateSetting(!enableRule).then(() => {
      setEnableRule(!enableRule);
    });
  };
  const updateSetting = (enable: boolean) => {
    setUpdateSettingLoading(true);
    return openSeaSettingApi
      .updateOpenSeaSetting({
        enable,
        params: rules,
      })
      .then(result => {
        if (result) {
          if (enable) {
            message.success(getIn18Text('GONGHAIGUIZEYIQIYONG'));
          } else {
            message.warn(getIn18Text('GONGHAIGUIZEYITINGYONG'));
          }
        } else {
          throw new Error('config fail!');
        }
      })
      .finally(() => setUpdateSettingLoading(false));
  };
  const onRuleDataChange = (
    rule: string,
    name: string,
    info: {
      value?: string | string[];
      checked?: boolean;
    }
  ) => {
    // antd触发handler传递数字，这里统一处理下，变字符串
    if (info.value === null) {
      info.value = '';
    }
    if (typeof info.value === 'number') {
      info.value = String(info.value);
    }
    const changedRules = rules.reduce((acc: IOpenSeaSettingRule[], cur) => {
      if (cur.rule === rule) {
        cur.conditions = cur.conditions.map(ele => {
          if (ele.name === name) {
            return {
              ...ele,
              ...info,
            };
          }
          return ele;
        });
      }
      acc.push(cur);
      return acc;
    }, []);
    setRules(changedRules);
  };
  const getJSXByRule = ({ rule, ruleName = '', description = '', required = false, conditions = [] }: IOpenSeaSettingRule) => {
    const getHeaderJSX = () => {
      return (
        <div
          className={classnames(styles.header, {
            [styles.required]: required,
          })}
        >
          {ruleName}
          <span className={styles.description}>{description}</span>
        </div>
      );
    };
    switch (rule) {
      case 'autoRetreatEffectTime':
        return (
          <div className={styles.each}>
            {getHeaderJSX()}
            {conditions.map(ele => {
              const { value, name } = ele;
              return (
                <DatePicker
                  value={(value as string).length ? moment(value) : undefined}
                  allowClear={false}
                  onChange={(date, dateString) =>
                    onRuleDataChange(rule, name, {
                      value: dateString,
                    })
                  }
                  key={name}
                  className={styles.field}
                  style={{
                    width: 186,
                    borderRadius: '4px',
                  }}
                  placeholder={getIn18Text('QINGXUANZESHIJIAN')}
                  disabledDate={date => {
                    const beforeDawn = moment(moment().format('YYYY-MM-DD'));
                    return date.isBefore(beforeDawn);
                  }}
                />
              );
            })}
          </div>
        );
      case 'autoRetreatRule':
        return (
          <div className={styles.each}>
            {getHeaderJSX()}
            {conditions.map((ele, idx) => {
              const { checked, value = '0', name } = ele;
              let preText = '';
              let nextText = '';
              switch (name) {
                case 'receiveNoHandle':
                  preText = getIn18Text('ZIFUZERENJIEDAOKEHUHOU');
                  nextText = getIn18Text('TIANWEIJINXINGYOUXIAOGENJIN');
                  break;
                case 'followNoHandle':
                  preText = getIn18Text('ZIKEHUSHANGYICIGENJINHOU');
                  nextText = getIn18Text('TIANWEIJINXINGYOUXIAOGENJIN');
                  break;
                case 'receiveNoDeal':
                  preText = getIn18Text('ZIFUZERENJIEDAOKEHUHOU');
                  nextText = getIn18Text('TIANWEIDAODACHENGJIAOJIEDUAN');
                  break;
                default:
                  break;
              }
              return (
                <div className={styles.row} key={name}>
                  <Checkbox
                    checked={checked}
                    onChange={e => {
                      onRuleDataChange(rule, name, {
                        checked: e.target.checked,
                      });
                    }}
                    disabled={enableRule}
                    className={styles.field}
                  />
                  {preText}
                  <InputNumber
                    value={value as string}
                    min={'1'}
                    size="small"
                    onChange={str =>
                      onRuleDataChange(rule, name, {
                        value: str,
                      })
                    }
                    onStep={value =>
                      onRuleDataChange(rule, name, {
                        value,
                      })
                    }
                    disabled={enableRule}
                    className={classnames([styles.field, styles.inputNumber])}
                  />
                  {nextText}
                  {idx === 0 && (
                    <span className={styles.iconWrapper}>
                      <QuestionCircleOutlined
                        className={styles.questionIcon}
                        onMouseEnter={() => setShowAutoRetreatTip(true)}
                        onMouseLeave={() => setShowAutoRetreatTip(false)}
                      />
                      {showAutoRetreatTip && (
                        <div className={styles.showAutoRetreatTip}>
                          <div className={styles.title}>{getIn18Text('YOUXIAOGENJINBAOHAN\uFF1A')}</div>
                          <div className={styles.list}>
                            <div>{getIn18Text('1.FUZERENGEILIANXIRENFAYOUJIAN')}</div>
                            <div>{getIn18Text('2.FUZERENSHOUDAOLIANXIRENYOUJIAN')}</div>
                            <div>{getIn18Text('3.SHOUTIANGENJINJILU')}</div>
                          </div>
                        </div>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      case 'notifyRule':
        return (
          <div className={styles.each}>
            {getHeaderJSX()}
            {conditions.map(ele => {
              const { checked, value = '0', name } = ele;
              return (
                <div className={styles.row} key={name}>
                  <Checkbox
                    checked={checked}
                    onChange={e => {
                      onRuleDataChange(rule, name, {
                        checked: e.target.checked,
                      });
                    }}
                    disabled={enableRule}
                    className={styles.field}
                  />
                  {getIn18Text('TIQIAN')}
                  <InputNumber
                    value={value as string}
                    min={'1'}
                    size="small"
                    onChange={str =>
                      onRuleDataChange(rule, name, {
                        value: str,
                      })
                    }
                    onStep={value =>
                      onRuleDataChange(rule, name, {
                        value: '' + value,
                      })
                    }
                    disabled={enableRule}
                    className={classnames([styles.field, styles.inputNumber])}
                  />
                  {getIn18Text('TIANTIXINGFUZEREN\uFF0CKEHUJIANGYAOZIDONGTUIHUIGONGHAI')}
                </div>
              );
            })}
          </div>
        );
      case 'drawRule':
        return (
          <div className={styles.each}>
            {getHeaderJSX()}
            {conditions.map(ele => {
              const { checked, value = '0', name } = ele;
              return (
                <div className={styles.row} key={name}>
                  <Checkbox
                    checked={checked}
                    onChange={e => {
                      onRuleDataChange(rule, name, {
                        checked: e.target.checked,
                      });
                    }}
                    disabled={enableRule}
                    className={styles.field}
                  />
                  {getIn18Text('TUIHUIGONGHAIHOU')}
                  <InputNumber
                    value={value as string}
                    min={'1'}
                    size="small"
                    onChange={str =>
                      onRuleDataChange(rule, name, {
                        value: str,
                      })
                    }
                    onStep={value =>
                      onRuleDataChange(rule, name, {
                        value: '' + value,
                      })
                    }
                    disabled={enableRule}
                    className={classnames([styles.field, styles.inputNumber])}
                  />
                  {getIn18Text('TIANNEI\uFF0CQIANFUZERENBUKELINGQU')}
                </div>
              );
            })}
          </div>
        );
      case 'excludeRule':
        return (
          <div className={styles.each}>
            {getHeaderJSX()}
            {conditions.map(ele => {
              const { checked, value = [], name, source = [] } = ele;
              let preText = '';
              let nextText = '';
              switch (name) {
                case 'companyLevelExclude':
                  preText = getIn18Text('KEHUFENJIWEI');
                  nextText = getIn18Text('DEKEHUBUCANYUZIDONGTUIGONGHAIGUIZE');
                  break;
                case 'dealCompanyExclude':
                  preText = getIn18Text('CHENGJIAOKEHUBUCANYUGONGHAIGUIZE(YIGEKEHUDUOGESHANGJI\uFF0CYOUYIGESHANGJICHENGJIAOJISUANWEICHENGJIAOKEHU)');
                  break;
                default:
                  break;
              }
              return (
                <div className={styles.row} key={name}>
                  <Checkbox
                    checked={checked}
                    onChange={e => {
                      onRuleDataChange(rule, name, {
                        checked: e.target.checked,
                      });
                    }}
                    disabled={enableRule}
                    className={styles.field}
                  />
                  {preText}
                  {name === 'companyLevelExclude' && (
                    <Select
                      mode="multiple"
                      maxTagCount="responsive"
                      defaultValue={value}
                      style={{ width: 230 }}
                      showArrow
                      onChange={value =>
                        onRuleDataChange(rule, name, {
                          value,
                        })
                      }
                      disabled={enableRule}
                      className={styles.field}
                    >
                      {source.map(({ label, value }) => {
                        return (
                          <Option key={value} value={value}>
                            {label}
                          </Option>
                        );
                      })}
                    </Select>
                  )}
                  {nextText}
                </div>
              );
            })}
          </div>
        );
      default:
        return '';
    }
  };
  const getFormControlJSX = () => {
    return rules.map(each => <div key={each.rule}>{getJSXByRule(each)}</div>);
  };
  return (
    <PermissionCheckPage resourceLabel="ORG_SETTINGS" accessLabel="OPEN_SEA_SETTING" menu="ORG_SETTINGS_OPEN_SEA_SETTING">
      <div className={styles.container}>
        <div className={styles.openSeaSetting}>
          <div className={styles.header}>
            <div className={styles.name}>
              <div className={styles.text}>{getIn18Text('GONGHAISHEZHI')}</div>
              <div className={styles.description}>{getIn18Text('PEIZHIGONGHAIGUIZE\uFF0CSHIXIANZIDONGTUIGONGHAIJIZHI\uFF0CTISHENGKEHUGENJINXIAOLV\u3002')}</div>
            </div>
            <div style={{ color: enableRule ? 'green' : 'red' }} className={styles.tip}>
              {enableRule ? getIn18Text('GONGHAIGUIZEYIQIYONG') : getIn18Text('GONGHAIGUIZEWEIQIYONG')}
              <Switch style={{ marginLeft: 16 }} size="small" checked={enableRule} onClick={toggleRule}></Switch>
            </div>
          </div>
          <div className={styles.form}>
            {getFormControlJSX()}
            {enableRule && <div className={styles.mask}></div>}
          </div>
        </div>
        {/* <div className={styles.footer}>
          <div className={styles.btnWrapper}>
            <Button type="primary" size="small" className={styles.submitBtn} onClick={toggleRule} loading={updateSettingLoading}>
              {enableRule ? '停用规则' : '启用规则'}
            </Button>
          </div>
        </div> */}
      </div>
    </PermissionCheckPage>
  );
};
