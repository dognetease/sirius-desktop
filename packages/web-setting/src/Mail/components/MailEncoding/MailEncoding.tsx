import React, { useState, useEffect } from 'react';
import './MailEncoding.scss';
import { apiHolder, apis, MailConfApi, MailSettingKeys, getIn18Text } from 'api';
import { Select } from 'antd';
const { Option } = Select;

const mailConfApi: MailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;

interface Option {
  value: string;
  label: string;
}

const OPTION_KEY_AUTO = '0'; // 默认不编码
const OPTION_KEY_UTF8 = '1'; // 默认编码
const DefaultOrignData = '0000000000000000'; // 默认原始数据

const MailEncoding: React.FC<any> = ({}) => {
  const [value, setValue] = useState<string>(OPTION_KEY_AUTO);
  const [originData, setOriginData] = useState<string>(DefaultOrignData); // 原始数据

  // 获取数据
  const getData = () => {
    const EcodingKey = MailSettingKeys.nForward;
    mailConfApi.doGetUserAttr([EcodingKey]).then(res => {
      if (res?.ntes_option) {
        // 判断是否是初始化
        if (res?.ntes_option == 'Null' || res?.ntes_option == null || res?.ntes_option?.length != 16) {
          setOriginData(DefaultOrignData);
          setValue(OPTION_KEY_AUTO);
        } else {
          // 对值进行对齐，非1一律转0，这样可以洗掉脏数据
          const formatedValue = [...res?.ntes_option].map(item => (item == '1' ? '1' : '0')).join('');
          setOriginData(formatedValue);
          const key = res?.ntes_option[5];
          setValue(key == '0' ? '0' : '1');
        }
      }
    });
  };

  // 保存数据
  const saveData = (key: string) => {
    const subData = [...originData];
    subData[5] = key;
    // 请求接口
    return mailConfApi.setMailDefaultEncoding(subData.join('')).then(res => {
      if (res) {
        getData();
      }
      return res;
    });
  };

  // 处理邮件编码变化
  const handleEncodingChange = (value: string) => {
    saveData(value);
  };

  // 获取邮件编码设置
  useEffect(() => {
    getData();
  }, []);

  return (
    <div className="mail-config-encoding">
      <Select value={value} onChange={handleEncodingChange} defaultValue={OPTION_KEY_AUTO}>
        <Option value={OPTION_KEY_AUTO} key={OPTION_KEY_AUTO}>
          {getIn18Text('FUWUQIZHINENGSB（TJ）')}
        </Option>
        <Option value={OPTION_KEY_UTF8} key={OPTION_KEY_UTF8}>
          Unicode(UTF-8)
        </Option>
      </Select>
    </div>
  );
};

export default MailEncoding;
