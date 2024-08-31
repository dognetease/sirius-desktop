import React, { useImperativeHandle, useState, useRef, useEffect, useCallback } from 'react';
import { Form, TimePicker, Input, Select, Button, message, Tooltip } from 'antd';
import { isElectron, isEdm, api as masterApi, apis, DbApiV2, AccountApi, DbRefer, ContactAndOrgApi, MailApi, MailConfApi } from 'api';
import dayjs from 'dayjs';
import zipWith from 'lodash/zipWith';
import lodashGet from 'lodash/get';
import { config } from 'env_def';
import styles from './feedbackContent.module.scss';
import { getIn18Text } from 'api';

const systemApi = masterApi.getSystemApi();
const accountApi = masterApi.requireLogicalApi(apis.accountApiImpl) as unknown as AccountApi;
const dbApi = masterApi.requireLogicalApi(apis.dbInterfaceApiImpl) as unknown as DbApiV2;
const contactApi = masterApi.requireLogicalApi(apis.contactApiImpl) as unknown as ContactAndOrgApi;
const mailApi = masterApi.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const mailConfApi = masterApi.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;

export const LagBasicContent = React.forwardRef((props, ref) => {
  const [inElectron] = useState(isElectron());
  const [lagModuleNames] = useState(() => {
    const basicModules = ['邮箱', '通讯录', '日历', '消息', '云文档'];
    if (isEdm()) {
      return [...basicModules, '营销', '客户'].map(item => ({
        label: item,
        value: item,
        key: item,
      }));
    }
    return basicModules.map(item => ({
      label: item,
      value: item,
      key: item,
    }));
  });

  const [checkedLagModule, setCheckedLagModule] = useState('邮箱');

  const [lagTimeRange, setLagTimeRange] = useState(() => {
    const now = Date.now();
    return [dayjs(now - 1000 * 60 * 60), dayjs(now)];
  });

  const [browserName, setBrowserName] = useState(() => systemApi.getBrowserInfo().name);
  const [browserVersion, setBrowserVersion] = useState(() => systemApi.getBrowserInfo().version);

  const [lagDesc, setLagDesc] = useState('');

  const getContent = () => {
    let content1 = `
    卡顿时间点：${lagTimeRange.map(lagTimeItem => lagTimeItem.format('HH:mm')).join('-')}
    卡顿功能模块：${checkedLagModule}。
  `;

    if (!inElectron) {
      content1 += `浏览器信息：${browserName} ${browserVersion}`;
    }

    content1 += '描述：' + lagDesc + '。';

    return content1;
  };

  useImperativeHandle(ref, () => ({
    getContent,
  }));

  return (
    <Form labelCol={{ span: 5 }} style={{ padding: '10px' }}>
      <Form.Item label="卡顿时间点：">
        <TimePicker.RangePicker
          className={styles.lagBasicControl}
          value={lagTimeRange}
          format="HH:mm"
          onChange={dateArr => {
            setLagTimeRange(dateArr);
          }}
        />
      </Form.Item>
      <Form.Item label="卡顿功能模块：">
        <Select
          className={styles.lagBasicControl}
          options={lagModuleNames}
          value={checkedLagModule}
          onChange={args => {
            setCheckedLagModule(args);
          }}
        />
      </Form.Item>
      {!inElectron ? (
        <Form.Item label="浏览器信息：">
          <div className={styles.lagBrowserInfoGroup}>
            <Tooltip title="如浏览器名称信息错误，请修改">
              <Input
                className={styles.lagBasicControl}
                value={browserName}
                placeholder="请输入浏览器名称"
                onChange={e => {
                  setBrowserName(e.target.name);
                }}
              />
            </Tooltip>
            <Tooltip title="如浏览器版本信息错误，请修改">
              <Input
                className={styles.lagBasicControl}
                value={browserVersion}
                placeholder="请输入浏览器版本号"
                onChange={e => {
                  setBrowserVersion(e.target.name);
                }}
              />
            </Tooltip>
          </div>
        </Form.Item>
      ) : null}
      <Form.Item label="卡顿描述：">
        <Input.TextArea
          placeholder={getIn18Text('QINGXIANGXIMIAOSHU')}
          value={lagDesc}
          showCount
          maxLength={1000}
          onChange={e => {
            setLagDesc(e.target.value);
          }}
        />
      </Form.Item>
    </Form>
  );
});

export const LagCollectionContent = React.forwardRef((props, ref) => {
  const [collectionStatus, setCollectionStatus] = useState<'init' | 'ing'>('init');
  const [collectionContent, setCollectionContent] = useState('');

  useImperativeHandle(ref, () => ({
    getContent() {
      return {
        status: collectionStatus,
        content: collectionContent,
      };
    },
  }));

  const collectionTableCount = useCallback(async () => {
    const accounts = await accountApi.getMainAndSubAccounts();
    const dbReferList = accounts.flatMap(accountItem => [
      {
        dbName: 'contact_dexie',
        tableName: 'contactItem',
        _dbAccount: accountItem.accountMd5,
      } as DbRefer,
    ]);
    dbReferList.push({
      dbName: 'contact_global',
      tableName: 'contact',
      _dbAccount: systemApi.getCurrentUser()!.accountMd5,
    } as DbRefer);
    const tableCounts = await Promise.all(dbReferList.map(dbRefer => dbApi.getTableCount(dbRefer)));

    const dbCountInfo = zipWith(dbReferList, tableCounts, (dbRefer, count) => ({
      [`${[dbRefer.dbName, dbRefer.tableName, dbRefer._dbAccount].join('.')}`]: count,
    }));
    let _content = '本地数据库count:';
    _content += JSON.stringify(dbCountInfo);
    setCollectionContent(content => content + _content + '。');
  }, []);

  const performanceRef = useRef<PerformanceObserver | undefined>();

  const getLongTask = () => {
    const performanceObserver = new PerformanceObserver(list => {
      let _content = 'longtask:';
      const longTaskEntries = list.getEntries();
      longTaskEntries
        .filter(item => item.duration >= 80)
        .forEach(item => {
          _content += `name:${item.name}.range:${item.duration}`;
        });

      longTaskEntries.length && setCollectionContent(content => content + _content + '。');
    });
    performanceRef.current = performanceObserver;
    console.log('[lagTest]getLongTask', performanceObserver);
    performanceObserver.observe({ entryTypes: ['longtask'] });
  };

  // 采集10s帧率
  const frameRateRef = useRef(0);
  const collectionFrameRate = useCallback(
    () =>
      new Promise(r => {
        // todo:这个还得继续补充 这种场景只能matchweb. app的话需要events通知来启动/回传帧率探测
        let count = 0;
        const loop = () => {
          count += 1;
          // 防止溢出
          if (count >= 300) {
            return;
          }
          frameRateRef.current = window.requestAnimationFrame(loop);
        };
        loop();

        setTimeout(() => {
          const frameRate = Math.floor(count / 5);
          setCollectionContent(content => content + `渲染帧率：${frameRate}。`);
          frameRateRef.current && window.cancelAnimationFrame(frameRateRef.current);
          r(undefined);
        }, 5 * 1000);
      }),
    []
  );
  useEffect(
    () => () => {
      frameRateRef.current && window.cancelAnimationFrame(frameRateRef.current);
      performanceRef.current && performanceRef.current.disconnect();
    },
    []
  );

  const collectionSlowFunc = useCallback(async () => {
    const syncStatus = contactApi.syncAll(true);
    // 查询syncAll期间的长任务
    getLongTask();
    try {
      await syncStatus;
    } catch (ex) {
    } finally {
      performanceRef.current && performanceRef.current.disconnect();
    }

    // 查询一下几个函数
    const _point1 = Date.now();
    try {
      await mailApi.doListMailBoxEntities({ id: 1, count: 100 });
    } catch (ex) {
      setCollectionContent(content => content + `doListMailBoxEntities失败:${lodashGet(ex, 'message', 'unknown')}`);
    }
    const _point2 = Date.now();
    setCollectionContent(content => content + `doListMailBoxEntities耗时:${_point2 - _point1}ms。`);
    try {
      await accountApi.getCurrentAccountInfo(lodashGet(systemApi.getCurrentUser(), 'id', ''));
    } catch (ex) {
      setCollectionContent(content => content + `getCurrentAccountInfo失败:${lodashGet(ex, 'message', 'unknown')}`);
    }
    const _point3 = Date.now();
    setCollectionContent(content => content + `getCurrentAccountInfo耗时:${_point3 - _point2}ms。`);
    try {
      await mailConfApi.loadMailConf();
    } catch (ex) {
      setCollectionContent(content => content + `loadMailConf失败:${lodashGet(ex, 'message', 'unknown')}`);
    }
    const _point4 = Date.now();
    setCollectionContent(content => content + `loadMailConf耗时:${_point4 - _point3}ms。`);
  }, []);

  const collectionNetwork = async () => {
    if (!isElectron()) {
      return true;
    }
    const path = (config('host') || '') as string;
    const host = new URL(path).hostname;
    const res = window.electronLib.appManage.getNetState(host);
    const post = {
      host,
      electron_online: navigator.onLine,
      dns_lookup_v4: res[0],
      dns_lookup_v6: res[1],
      dns_resolveAny: res[2],
      traceroute: res[3],
    };

    setCollectionContent(content => content + '网络探测：' + JSON.stringify(post) + '。');
  };

  const [collectionStep, setCollectionStep] = useState(0);
  const [totalStep] = useState(4);

  const startCollection = async () => {
    try {
      setCollectionStatus('ing');
      setCollectionStep(0);
      // 开始采集业务指标
      // 先查询DB数量
      await collectionTableCount();
      setCollectionStep(1);
      // todo:网络探测
      await collectionNetwork();
      setCollectionStep(2);

      // 慢函数查询
      await collectionSlowFunc();
      setCollectionStep(3);

      // 帧率采集
      await collectionFrameRate();

      message.success('采集完成');
    } catch (ex) {
      console.error('startCollection.error:', ex);
    } finally {
      setCollectionStatus('init');
    }
  };

  return (
    <div>
      <Button onClick={startCollection} type="primary" disabled={collectionStatus === 'ing'}>
        {collectionStatus === 'init' ? '点此一键采集' : `采集中...${collectionStep}/${totalStep}`}
      </Button>
    </div>
  );
});
