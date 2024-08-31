import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import MailCard from '@web-mail/common/components/vlistCards/MailCard/MailCard';
import { getModelHasAllTag, getModelByConfig, DefaultCardConfig, getRandomConfig } from './util';
import './index.scss';
import { Switch } from 'antd';
import { stringMap } from 'types';
import MailCardLong from '@web-mail/common/components/vlistCards/MailCard/MailCardLong';
import { Input } from 'antd';
import { InputNumber } from 'antd';
import { Select } from 'antd';

const { Option } = Select;

const folderOptions = [
  { label: '收件箱', value: 1 },
  { label: '发件箱', value: 3 },
  { label: '草稿箱', value: 2 },
  { label: '未审核文件夹', value: 17 },
  { label: '已审核文件夹', value: 19 },
  { label: '广告', value: 7 },
  { label: '垃圾邮件', value: 5 },
  { label: '病毒', value: 6 },
  { label: '已删除', value: 4 },
  { label: '订阅邮件', value: 18 },
  { label: '隔离邮件', value: 89 },
  { label: '红旗邮件', value: -1 },
  { label: '任务邮件', value: -9 },
  { label: '未读文件夹', value: -4 },
  { label: '星标联系人', value: -5 },
  { label: '其他', value: -2 },
  { label: '稍后处理', value: -3 },
  { label: '标签', value: -199 },
  { label: '搜索-全部结果', value: -33 },
];

const mailList = [];
mailList.length = 30;
mailList.fill('1');

const MailCards: React.FC<any> = props => {
  const { isVisible } = props;
  const [CardConfig, setCardConfig] = useState(DefaultCardConfig);
  const [activeCrad, setActiveCrad] = useState(false);
  const [showCheckbox, setshowCheckbox] = useState(false);
  const [showAvator, setshowAvator] = useState(true);
  const [cardChecked, setcardChecked] = useState(true);
  const [zidong, setzidong] = useState(false);

  const [showAttachmentIcon, setshowAttachmentIcon] = useState(true);

  const timer = useRef();
  useEffect(() => {
    if (zidong && !timer.current) {
      timer.current = setInterval(() => {
        // 随机更改配置
        setCardConfig(getRandomConfig());
        setActiveCrad(Math.random() < 0.5);
        setshowCheckbox(Math.random() < 0.5);
        setshowAvator(Math.random() < 0.5);
        setcardChecked(Math.random() < 0.5);
      }, 500);
    } else {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, [zidong]);

  const onChange = (flag: string, status: boolean) => {
    // if (flag === 'redFlag') {
    setCardConfig(config => {
      return {
        ...config,
        [flag]: status,
      };
    });
    // }
    // if (flag === 'read') {
    //   setCardConfig(config => {
    //     return {
    //       ...config,
    //       read: status
    //     };
    //   });
    // }
    // if (flag === 'activeCrad') {
    //   setActiveCrad(status);
    // }
  };

  const allChecked = (checked: boolean) => {
    setCardConfig(res => {
      const tres: stringMap = {};
      for (let i in res) {
        if (!i.startsWith('txt') && i !== 'taskId') {
          tres[i] = checked;
        }
      }
      return tres;
    });
  };

  const allCheckedLogic = (checked: boolean) => {
    setActiveCrad(checked);
    setshowCheckbox(checked);
    setshowAvator(checked);
    setshowAvator(checked);
  };

  const mailData = useMemo(() => {
    return getModelByConfig(CardConfig);
  }, [CardConfig]);

  const checkoutALl = useMemo(() => {
    let isAll = true;
    for (let i in CardConfig) {
      if (!CardConfig[i]) {
        isAll = false;
        break;
      }
    }
    return isAll;
  }, [CardConfig]);

  const logicCheckedAll = useMemo(() => {
    return showAvator && activeCrad && showCheckbox;
  }, [showAvator, activeCrad, showCheckbox]);

  return (
    <div className="test-page-wrap" hidden={!isVisible}>
      <div className="title">邮件卡片业务测试</div>
      <div className="tip">待处理： 暂未支持星标联系人，外贸扩展卡片，动态设置紧凑宽松模式</div>
      <div className="content">
        <div className="right">
          <div className="sub-title">分栏邮件卡片</div>
          <div className="wauto block">
            <div className="width-line">自适应</div>
            <MailCard showCheckbox={showCheckbox} showAvator={showAvator} checked={cardChecked} active={activeCrad} data={mailData} />
          </div>
          <div className="line">
            <div className="w100 block">
              <div className="width-line">100px</div>
              <MailCard showCheckbox={showCheckbox} showAvator={showAvator} checked={cardChecked} active={activeCrad} data={mailData} />
            </div>
            <div className="w200 block">
              <div className="width-line">200px</div>
              <MailCard showCheckbox={showCheckbox} showAvator={showAvator} checked={cardChecked} active={activeCrad} data={mailData} />
            </div>
            <div className="w300 block">
              <div className="width-line">300px</div>
              <MailCard showCheckbox={showCheckbox} showAvator={showAvator} checked={cardChecked} active={activeCrad} data={mailData} />
            </div>
            <div className="w500 block">
              <div className="width-line">500px</div>
              <MailCard showCheckbox={showCheckbox} showAvator={showAvator} checked={cardChecked} active={activeCrad} data={mailData} />
            </div>
          </div>

          <div className="sub-title">通栏邮件卡片</div>
          <div className="tip"></div>
          <div className="wauto block">
            <div className="width-line">自适应</div>
            <MailCardLong showCheckbox={showCheckbox} showAvator={showAvator} checked={cardChecked} active={activeCrad} data={mailData} />
          </div>
          <div className="line">
            <div className="w100 block">
              <div className="width-line">100px</div>
              <MailCardLong showCheckbox={showCheckbox} showAvator={showAvator} checked={cardChecked} active={activeCrad} data={mailData} />
            </div>
            <div className="w200 block">
              <div className="width-line">200px</div>
              <MailCardLong showCheckbox={showCheckbox} showAvator={showAvator} checked={cardChecked} active={activeCrad} data={mailData} />
            </div>
            <div className="w300 block">
              <div className="width-line">300px</div>
              <MailCardLong showCheckbox={showCheckbox} showAvator={showAvator} checked={cardChecked} active={activeCrad} data={mailData} />
            </div>
            <div className="w500 block">
              <div className="width-line">500px</div>
              <MailCardLong showCheckbox={showCheckbox} showAvator={showAvator} checked={cardChecked} active={activeCrad} data={mailData} />
            </div>
          </div>
          <div className="sub-title">通栏邮件卡片列表</div>
          <div className="tip"></div>
          <div className="wauto block">
            <div className="width-line">自适应</div>
            {mailList.map(item => {
              return <MailCardLong showCheckbox={showCheckbox} showAvator={showAvator} checked={cardChecked} active={activeCrad} data={mailData} />;
            })}
          </div>
        </div>
        <div className="left">
          <div className="oper-panel">
            <div className="sub-title">卡片中的icon</div>
            <div className="switch-wrap">
              <div className="switch-item" style={{ width: '100%' }}>
                全选： <Switch checked={checkoutALl} onChange={allChecked} />
              </div>
              <div className="switch-item">
                红旗：
                <Switch checked={CardConfig['redFlag']} onChange={checked => onChange('redFlag', checked)} />
              </div>
              <div className="switch-item">
                未读：
                <Switch checked={CardConfig['read']} onChange={checked => onChange('read', checked)} />
              </div>
              <div className="switch-item">
                标签：
                <Switch checked={CardConfig['tag']} onChange={checked => onChange('tag', checked)} />
              </div>
              <div className="switch-item">
                定时发送：
                <Switch checked={CardConfig['isScheduleSend']} onChange={checked => onChange('isScheduleSend', checked)} />
              </div>

              <div className="switch-item">
                Ics附件：
                <Switch checked={CardConfig['isIcs']} onChange={checked => onChange('isIcs', checked)} />
              </div>
              <div className="switch-item">
                表扬信：
                <Switch checked={CardConfig['praiseId']} onChange={checked => onChange('praiseId', checked)} />
              </div>
              <div className="switch-item">
                任务邮件：
                <Switch checked={CardConfig['taskId']} onChange={checked => onChange('taskId', checked)} />
              </div>
              <div className="switch-item">
                讨论组:
                <Switch checked={CardConfig['eTeamType']} onChange={checked => onChange('eTeamType', checked)} />
              </div>
              <div className="switch-item">
                邮件待办:
                <Switch checked={CardConfig['isDefer']} onChange={checked => onChange('isDefer', checked)} />
              </div>
              <div className="switch-item">
                附件图标:
                <Switch checked={showAttachmentIcon} onChange={setshowAttachmentIcon} />
              </div>
              <div className="switch-item">
                任务邮件详情:
                <Switch checked={CardConfig['userType']} onChange={checked => onChange('userType', checked)} />
              </div>
              <div className="switch-item">
                邮件发送状态:
                <Switch checked={CardConfig['sendStatus']} onChange={checked => onChange('sendStatus', checked)} />
              </div>
              <div className="switch-item">
                邮件阅读状态:
                <Switch checked={CardConfig['readCount']} onChange={checked => onChange('readCount', checked)} />
              </div>

              <div className="switch-item">
                紧急邮件:
                <Switch checked={CardConfig['jinji']} onChange={checked => onChange('jinji', checked)} />
              </div>

              <div className="switch-item">
                系统邮件:
                <Switch checked={CardConfig['system']} onChange={checked => onChange('system', checked)} />
              </div>
              {/* <div className="switch-item">
            webMail未读:
            <Switch checked={CardConfig['webweidu']} onChange={checked => onChange('webweidu', checked)} />
          </div> */}
              <div className="switch-item">
                已回复:
                <Switch checked={CardConfig['yihuifu']} onChange={checked => onChange('yihuifu', checked)} />
              </div>
              <div className="switch-item">
                已转发:
                <Switch checked={CardConfig['YIZHUANFA']} onChange={checked => onChange('YIZHUANFA', checked)} />
              </div>
              {/* <div className="switch-item">
                回复且转发:
                <Switch checked={CardConfig['HUIFUQIEZHUANFA']} onChange={checked => onChange('HUIFUQIEZHUANFA', checked)} />
              </div> */}
              <div className="switch-item">
                POPREAD:
                <Switch checked={CardConfig['POPREAD']} onChange={checked => onChange('POPREAD', checked)} />
              </div>
              <div className="switch-item">
                RCPT_SUCCEED:
                <Switch checked={CardConfig['RCPT_SUCCEED']} onChange={checked => onChange('RCPT_SUCCEED', checked)} />
              </div>
              <div className="switch-item">
                RCPT_FAILED:
                <Switch checked={CardConfig['RCPT_FAILED']} onChange={checked => onChange('RCPT_FAILED', checked)} />
              </div>
              {/* <div className="switch-item">
                PARTIAL_RCPT_SUCCEED:
                <Switch checked={CardConfig['PARTIAL_RCPT_SUCCEED']} onChange={checked => onChange('PARTIAL_RCPT_SUCCEED', checked)} />
              </div> */}
              <div className="switch-item">
                WITHDRAW_SUCC:
                <Switch checked={CardConfig['WITHDRAW_SUCC']} onChange={checked => onChange('WITHDRAW_SUCC', checked)} />
              </div>
              <div className="switch-item">
                PARTIAL_WITHDRAW_SUCC:
                <Switch checked={CardConfig['PARTIAL_WITHDRAW_SUCC']} onChange={checked => onChange('PARTIAL_WITHDRAW_SUCC', checked)} />
              </div>
              <div className="switch-item">
                WITHDRAW_FAIL:
                <Switch checked={CardConfig['WITHDRAW_FAIL']} onChange={checked => onChange('WITHDRAW_FAIL', checked)} />
              </div>
              <div className="switch-item">
                SUSPICIOUS_MAIL:
                <Switch checked={CardConfig['SUSPICIOUS_MAIL']} onChange={checked => onChange('SUSPICIOUS_MAIL', checked)} />
              </div>

              {/* <div className="switch-item">
                星标联系人（需要重构才能测试）：
                <Switch />
              </div> */}
              <div className="switch-item">
                展示聚合数量：
                <Switch checked={CardConfig['trheadNumber']} onChange={checked => onChange('trheadNumber', checked)} />
              </div>
            </div>
          </div>
          <div className="oper-panel">
            <div className="sub-title">业务状态操作</div>
            <div className="switch-item" style={{ width: '100%' }}>
              自动测试： <Switch checked={zidong} onChange={setzidong} />
            </div>
            <div className="switch-item" style={{ width: '100%' }}>
              全选： <Switch checked={logicCheckedAll} onChange={allCheckedLogic} />
            </div>
            <div className="switch-wrap">
              <div className="switch-item">
                是否选中卡片：
                <Switch checked={activeCrad} onChange={setActiveCrad} />
              </div>
              <div className="switch-item">
                是否显示多选：
                <Switch checked={showCheckbox} onChange={setshowCheckbox} />
              </div>
              <div className="switch-item">
                多选是否选中：
                <Switch checked={cardChecked} onChange={setcardChecked} />
              </div>
              <div className="switch-item">
                是否显示头像：
                <Switch checked={showAvator} onChange={setshowAvator} />
              </div>
            </div>
          </div>
          <div className="oper-panel">
            <div className="sub-title">邮件信息编辑</div>
            <div className="switch-wrap">
              <div className="switch-item-long">
                邮件主题：
                <Input value={CardConfig['txt_title']} onChange={e => onChange('txt_title', e.target.value)} />
              </div>
              <div className="switch-item-long">
                邮件摘要：
                <Input value={CardConfig['txt_desc']} onChange={e => onChange('txt_desc', e.target.value)} />
              </div>
              <div className="switch-item-long">
                附件数量：
                <InputNumber min={0} max={10} value={CardConfig['txt_att_number']} onChange={value => onChange('txt_att_number', value)} />
              </div>
              <div className="switch-item-long">
                邮件文件夹
                <Select value={CardConfig['txt_folder']} onChange={value => onChange('txt_folder', value)}>
                  {folderOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>
              <div className="switch-item-long">
                发送时间：
                <Input value={CardConfig['txt_time']} onChange={e => onChange('txt_time', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MailCards;
