import React, { useEffect, useState, useMemo } from 'react';
import classnames from 'classnames';
import { Switch, Tooltip } from 'antd';
import { apiHolder, apis, CustomerDiscoveryApi, AutoTaskRuleRes } from 'api';
import SendIcon from '@/images/icons/regularcustomer/send.svg';
import ReplyIcon from '@/images/icons/regularcustomer/reply.svg';
import CalendarIcon from '@/images/icons/regularcustomer/calendar.svg';
import PushNumIcon from '@/images/icons/regularcustomer/pushnum.svg';
import { regularCustomerTracker } from '../../report';
import style from './style.module.scss';
import { getIn18Text } from 'api';
interface Prop {
  onAdd?: () => any;
}
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
const OP_MAP: Record<string, string> = {
  lt: '<',
  le: '<=',
  gt: '>',
  ge: '>=',
};
interface RuleDetail {
  recCount: number;
  recCountOp: string;
  sendCountOp: string;
  sendCount: number;
}
export const OverView: React.FC<Prop> = () => {
  const [rule, setRule] = useState<AutoTaskRuleRes>({} as AutoTaskRuleRes);
  const [loading, setLoading] = useState(true);
  const [switchLoading, setSwitchLoading] = useState(false);
  async function fetchAutoTaskRule() {
    const res = await customerDiscoveryApi.getAutoTaskRule();
    setRule(res || {});
    setLoading(false);
  }
  const changeState = async () => {
    try {
      setSwitchLoading(true);
      await customerDiscoveryApi.changeAutoTaskStatus(!rule.isOpen);
      regularCustomerTracker.trackSwitch(!rule.isOpen);
      setRule({ ...rule, isOpen: !rule.isOpen });
    } finally {
      setSwitchLoading(false);
    }
  };
  const ruleDetail: RuleDetail = useMemo(() => {
    const { conditionList } = rule;
    const res = (conditionList || []).reduce((map, cur) => {
      Object.assign(map, {
        [cur.field as string]: cur.value,
        [`${cur.field}Op`]: OP_MAP[cur.op as string],
      });
      return map;
    }, {}) as RuleDetail;
    return res;
  }, [rule.conditionList]);
  useEffect(() => {
    fetchAutoTaskRule();
  }, []);
  return (
    <div className={classnames([style.overView, style.flex])}>
      <div className={style.col}>
        <Tooltip title={rule.emailRuleDescription}>
          <div className={style.cellContent}>
            <img src={SendIcon} alt="" />
            <div>
              <div className={style.label}>
                <span>{getIn18Text('FASONGSHU')}</span>
              </div>
              <div className={style.value}>
                {ruleDetail.sendCountOp}
                {ruleDetail.sendCount}
              </div>
            </div>
          </div>
        </Tooltip>
      </div>

      <div className={style.col}>
        <Tooltip title={rule.emailRuleDescription}>
          <div className={style.cellContent}>
            <img src={ReplyIcon} alt="" />
            <div>
              <div className={style.label}>
                <span>{getIn18Text('HUIFUSHU')}</span>
              </div>
              <div className={style.value}>
                {ruleDetail.recCountOp}
                {ruleDetail.recCount}
              </div>
            </div>
          </div>
        </Tooltip>
      </div>

      <div className={style.col}>
        <Tooltip title={rule.screenDescription}>
          <div className={style.cellContent}>
            <img src={CalendarIcon} alt="" />
            <div>
              <div className={style.label}>
                <span>{getIn18Text('SHAIXUANZHOUQI')}</span>
              </div>
              <div className={style.value}>
                {rule.interval || '--'}
                {getIn18Text('TIAN')}
              </div>
            </div>
          </div>
        </Tooltip>
      </div>

      <div className={style.col}>
        <div className={style.cellContent}>
          <img src={PushNumIcon} alt="" />
          <div>
            <div className={style.label}>
              <span>{getIn18Text('ZONGSHAIXUANLIANG')}</span>
            </div>
            <div className={style.value}>{rule.limit || '--'}</div>
          </div>
        </div>
      </div>

      <div className={classnames([style.col])}>
        <div className={style.cellContent}>
          <div>
            <div className={style.label}>
              <span>{getIn18Text('SHIFOUKAIQI')}</span>
            </div>
            <div className={style.value}>
              <Switch checked={rule.isOpen} loading={switchLoading} onClick={changeState} disabled={loading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
