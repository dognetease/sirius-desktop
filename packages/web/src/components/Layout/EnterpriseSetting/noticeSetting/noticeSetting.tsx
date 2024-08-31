import { Button } from 'antd';
import React, { useState, useEffect } from 'react';
import style from './noticeSetting.module.scss';
import { api, apis, EdmNotifyApi, moduleConfigListItem as itemType } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { cloneDeep } from 'lodash';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import SelectRowAction from '@/components/Layout/Customer/components/MultiSelectAction/multiSelectAction';
import BaseTable from './baseTable';
import { getIn18Text } from 'api';
const NotifyApi = api.requireLogicalApi(apis.edmNotifyApiImpl) as EdmNotifyApi;
export const NoticeSetting = () => {
  const [isShow, setIsShow] = useState<boolean>(false);
  const [data, setData] = useState<itemType[]>([]);
  useEffect(() => {
    getConfig();
  }, []);
  const getConfig = () => {
    NotifyApi.getNotifyConfig().then(res => {
      setData(res.moduleConfigList);
    });
  };
  const onChange = (module: string, scene: string, key: string, value: boolean) => {
    let newData = cloneDeep(data).map(item => {
      if (item.module === module) {
        item.notifyConfigs.map(child => {
          if (child.scene === scene) {
            child[key as 'email' | 'im'] = value;
          }
          return child;
        });
      }
      return item;
    });
    setData([...newData]);
    setIsShow(true);
  };
  const onChangeAll = (module: string, key: string, value: boolean) => {
    let newData = cloneDeep(data).map(item => {
      if (item.module === module) {
        item.notifyConfigs.map(child => {
          child[key as 'email' | 'im'] = value;
          return child;
        });
      }
      return item;
    });
    setData([...newData]);
    setIsShow(true);
  };
  const saveChange = () => {
    const saveInfoArr: {
      email: boolean;
      im: boolean;
      scene: string;
    }[] = [];
    data.forEach(item => {
      item.notifyConfigs.forEach(child => {
        saveInfoArr.push({
          email: child.email,
          im: child.im,
          scene: child.scene,
        });
      });
    });
    NotifyApi.updateNotifyConfig({ items: saveInfoArr }).then(res => {
      Toast.success({
        content: getIn18Text('XIUGAICHENGGONG'),
      });
      setIsShow(false);
    });
  };
  return (
    <PermissionCheckPage resourceLabel="ORG_SETTINGS" accessLabel="NOTIFY_SETTING" menu="ORG_SETTINGS_NOTIFY_SETTING">
      <div className={style.pageContainer}>
        <div className={style.pageInner}>
          <h3 className={style.pageTitle}>{getIn18Text('TONGZHISHEZHI')}</h3>
          <p className={style.subtitle}>{getIn18Text('SHEZHIXITONGTONGZHI\uFF0CQUFENYOUJIANHUOIMXIAOXIDEBUTONGLEIXINGTONGZHI\u3002')}</p>
          {data.map((item, index) => (
            <div key={item.module}>
              <p className={style.moduleName}>{item.moduleName}</p>
              <BaseTable
                onChange={onChange}
                onChangeAll={onChangeAll}
                data={item.notifyConfigs}
                module={item.module}
                imEditable={item.imEditable}
                emailEditable={item.emailEditable}
              />
            </div>
          ))}
          <SelectRowAction isShow={isShow}>
            <Button
              style={{ marginLeft: 12 }}
              onClick={() => {
                setIsShow(false);
                getConfig();
              }}
            >
              {getIn18Text('QUXIAO')}
            </Button>
            <Button type="primary" style={{ marginLeft: 12 }} onClick={() => saveChange()}>
              {getIn18Text('BAOCUNSHEZHI')}
            </Button>
          </SelectRowAction>
        </div>
      </div>
    </PermissionCheckPage>
  );
};
