import { apiHolder as api, DataStoreApi } from '../../src/index';

describe('api factory test', function () {
  it('test data set and get call', function (done) {
    const dataApi = api.api.getDataStoreApi() as DataStoreApi;
    dataApi.put('key', { test: 'vser', nu: 1 }).then(val => {
      if (val) { console.log(val); } else { console.log(' set done '); }
    })
      .then(() => dataApi.get('key').then(value => {
        console.log(typeof value);
        console.log(value);
      })).then(done());
    // done();
  });
});
const newData = {
  code: 'S_OK',
  var: [
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: 'test urgent mail',
      flags: {},
      priority: 1,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 16, 26, 33),
      size: 2235,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 16, 26, 33),
      from: '"石晟" <shisheng@office.163.com>',
      id: 'AMgAggBDE6eERoEKKeIFZ4rN',
      to: 'shisheng <shisheng@qy.163.com>',
      receivedDate: new Date(2022, 0, 19, 16, 26, 33),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【问题反馈】网易灵犀Windows端1.8.4',
      flags: { read: true, inlineAttached: true, attached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 15, 27, 40),
      size: 149960,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 15, 27, 44),
      from: '"马琰" <mayan@certusnet.com.cn>',
      id: 'AFoAiQAfE-mDqIegWKRdZKr*',
      to: 'kf <kf@office.163.com>',
      receivedDate: new Date(2022, 0, 19, 15, 27, 44),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '[网络管理中心]2022年1月21日网易华数路由优化割接通告—R3',
      flags: { read: true, attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 14, 54, 21),
      size: 28821,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 14, 55, 22),
      from: 'sa@corp.netease.com',
      id: 'APEA4ADyE50E-UWxsmg8sqpZ',
      to: 'uu.sa@list.nie.netease.com,nsdn@list.nie.netease.com,op-sa@hz.netease.com,dba@hz.netease.com,appops@hz.netease.com,op-noc@hz.netease.com,op-m@hz.netease.com,all.sa@list.nie.netease.com,maintain@rd.netease.com,yanxuan-sre@list.nie.netease.com,hz.ops@list.n.netease.com,tfssa@list.nie.netease.com,sys.bj@list.nie.netease.com,hzfengtangfu@corp.netease.com,qiyeonupdate@office.163.com,op-music@hz.netease.com,urs-dev@list.nie.netease.com,op-pe@hz.netease.com,neteasepaywhtz@service.netease.com',
      receivedDate: new Date(2022, 0, 19, 14, 55, 22),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【问题反馈】网易灵犀Windows端1.8.4',
      flags: { read: true, attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 13, 57, 38),
      size: 486114,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 14, 11, 12),
      from: '"邓嘉威" <jiawei.deng@chinajijia.com>',
      id: 'AEYAVABBE90DhIfTVzun54qq',
      to: 'kf <kf@office.163.com>',
      receivedDate: new Date(2022, 0, 19, 13, 57, 44),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【问题反馈】网易灵犀Windows端1.8.4',
      flags: { read: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 13, 42, 4),
      size: 11293,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 14, 11, 29),
      from: '"总部武杰" <wuj@sh-hanshi.com>',
      id: 'ADkAbgBrEyKD*2dfVxJ37KpN',
      to: 'kf <kf@office.163.com>',
      receivedDate: new Date(2022, 0, 19, 13, 42, 8),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【问题反馈】网易灵犀Windows端1.8.5',
      flags: { read: true, attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 11, 39, 37),
      size: 354134,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 14, 12, 0),
      from: '"徐钦" <xuqin@cti-cert.com>',
      id: 'AAAA7ACtE*eD1OFNPVCIPaoI',
      to: 'kf <kf@office.163.com>',
      receivedDate: new Date(2022, 0, 19, 11, 39, 40),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【问题反馈】网易灵犀Windows端1.8.4',
      flags: { read: true, inlineAttached: true, attached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 11, 20, 15),
      size: 105344,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 14, 11, 39),
      from: '"刘长春" <liuchangchun@pureach.com>',
      id: 'AOAAJQCQExiDS2cnVoUup4rY',
      to: 'kf <kf@office.163.com>',
      receivedDate: new Date(2022, 0, 19, 11, 20, 19),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '[网络管理中心]2022年杭州东冠机房非游戏BGP_CR2 3槽板卡重启割接通告—R1',
      flags: { attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 10, 39, 16),
      size: 28823,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 10, 39, 42),
      from: 'sa@corp.netease.com',
      id: 'AGUAnAD2E*4DNbeDeZ9Ka4px',
      to: 'uu.sa@list.nie.netease.com,nsdn@list.nie.netease.com,op-sa@hz.netease.com,dba@hz.netease.com,appops@hz.netease.com,op-noc@hz.netease.com,op-m@hz.netease.com,all.sa@list.nie.netease.com,maintain@rd.netease.com,yanxuan-sre@list.nie.netease.com,hz.ops@list.n.netease.com,tfssa@list.nie.netease.com,sys.bj@list.nie.netease.com,hzfengtangfu@corp.netease.com,qiyeonupdate@office.163.com,op-music@hz.netease.com,urs-dev@list.nie.netease.com,op-pe@hz.netease.com,neteasepaywhtz@service.netease.com',
      receivedDate: new Date(2022, 0, 19, 10, 39, 42),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【问题反馈】网易灵犀Mac端1.8.5',
      flags: {
        read: true, inlineAttached: true, attached: true, realAttached: true
      },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 10, 38, 55),
      size: 1165464,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 10, 39, 39),
      from: '"王德利" <wangdeli@office.163.com>',
      id: 'ACUA-gBpEyuDCLX79iGZT4rP',
      to: '"客服" <kf@office.163.com>',
      receivedDate: new Date(2022, 0, 19, 10, 38, 59),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【上线通知】有道云笔记移动端V7.3.4版本上线通知',
      flags: { read: true, inlineAttached: true, attached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 9, 19, 28),
      size: 249172,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 10, 15, 26),
      from: '"王海" <wanghai02@office.163.com>',
      id: 'AOsAXgAsEyyD3n2bw-S--qrE',
      to: '"网易灵犀" <neteaselingxi@office.163.com>',
      receivedDate: new Date(2022, 0, 19, 9, 19, 33),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【问题反馈】网易灵犀Windows端1.8.4',
      flags: { read: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 9, 8, 35),
      size: 2237,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 9, 13, 8),
      from: '"孙久春" <harley_sun@hypersen.com>',
      id: 'AJsA4QCyE*SDBHh8gObWlarM',
      to: 'kf <kf@office.163.com>',
      receivedDate: new Date(2022, 0, 19, 9, 8, 38),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【账户安全】您的邮箱账号于2022-01-19 08:54:01在设备 Apple(BIH-L-4785)，mac10.15.6 登录网易灵犀办公 (Reminder for new device login)',
      flags: { read: true, system: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 8, 54, 6),
      size: 16633,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 8, 55, 17),
      from: '"网易邮件提醒服务" <notice@qiye.163.com>',
      id: 'AF*AGgDnE4uDx063i3wZ-qqz',
      to: 'shisheng <shisheng@office.163.com>',
      receivedDate: new Date(2022, 0, 19, 8, 54, 6),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '[网络管理中心]2022年1月19日广州杭州WNE0001NP长传线路割接通知—R1',
      flags: { attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 7, 56, 47),
      size: 28388,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 7, 57, 31),
      from: 'sa@corp.netease.com',
      id: 'AP6AKAA3E40DQF9WabpWp4oP',
      to: 'uu.sa@list.nie.netease.com,nsdn@list.nie.netease.com,op-sa@hz.netease.com,dba@hz.netease.com,appops@hz.netease.com,op-noc@hz.netease.com,op-m@hz.netease.com,all.sa@list.nie.netease.com,maintain@rd.netease.com,yanxuan-sre@list.nie.netease.com,hz.ops@list.n.netease.com,tfssa@list.nie.netease.com,sys.bj@list.nie.netease.com,hzfengtangfu@corp.netease.com,qiyeonupdate@office.163.com,op-music@hz.netease.com,urs-dev@list.nie.netease.com,op-pe@hz.netease.com,neteasepaywhtz@service.netease.com',
      receivedDate: new Date(2022, 0, 19, 7, 57, 31),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '[网络管理中心]2022年1月18日联通广州杭州长传线路割接通知—R2',
      flags: { read: true, attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 7, 56, 29),
      size: 28236,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 8, 36, 32),
      from: 'sa@corp.netease.com',
      id: 'ADkAcQA*E44Di-2Rzdkelqob',
      to: 'uu.sa@list.nie.netease.com,nsdn@list.nie.netease.com,op-sa@hz.netease.com,dba@hz.netease.com,appops@hz.netease.com,op-noc@hz.netease.com,op-m@hz.netease.com,all.sa@list.nie.netease.com,maintain@rd.netease.com,yanxuan-sre@list.nie.netease.com,hz.ops@list.n.netease.com,tfssa@list.nie.netease.com,sys.bj@list.nie.netease.com,hzfengtangfu@corp.netease.com,qiyeonupdate@office.163.com,op-music@hz.netease.com,urs-dev@list.nie.netease.com,op-pe@hz.netease.com,neteasepaywhtz@service.netease.com',
      receivedDate: new Date(2022, 0, 19, 7, 57, 31),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '[网络管理中心]2022年1月19日香港机房H3C M9006防火墙NSQM1FWDFGA1板卡更换割接通知—R0',
      flags: { attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 19, 7, 56, 3),
      size: 28510,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 19, 7, 56, 31),
      from: 'sa@corp.netease.com',
      id: 'AFcASAB2E2eD9l9FaOuy3arB',
      to: 'uu.sa@list.nie.netease.com,nsdn@list.nie.netease.com,op-sa@hz.netease.com,dba@hz.netease.com,appops@hz.netease.com,op-noc@hz.netease.com,op-m@hz.netease.com,all.sa@list.nie.netease.com,maintain@rd.netease.com,yanxuan-sre@list.nie.netease.com,hz.ops@list.n.netease.com,tfssa@list.nie.netease.com,sys.bj@list.nie.netease.com,hzfengtangfu@corp.netease.com,qiyeonupdate@office.163.com,op-music@hz.netease.com,urs-dev@list.nie.netease.com,op-pe@hz.netease.com,neteasepaywhtz@service.netease.com,uu.sa@list.nie.netease',
      receivedDate: new Date(2022, 0, 19, 7, 56, 31),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【上线通知】外贸-线索管理+商机0.184.1版本上线',
      flags: { read: true, inlineAttached: true, attached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 21, 46, 47),
      size: 2368006,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 21, 49, 34),
      from: '"梁中华" <liangzhonghua@office.163.com>',
      id: 'AP2AegArE4aDZRmtFJKJYare',
      to: '"外贸项目组" <lingxioffice_itr@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 21, 47, 36),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【功能上线预告】客户成功看板（企业邮）',
      flags: { read: true, inlineAttached: true, attached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 19, 45, 48),
      size: 6153485,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 20, 47, 38),
      from: '"吴亦凡" <wuyifan04@office.163.com>',
      id: 'AG*AswBKEyyCxvxgl4Svjqrq',
      to: '"网易灵犀" <neteaselingxi@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 19, 45, 56),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: 'Re:【系统更新预告】服务平台更新通知',
      flags: { read: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 19, 42, 41),
      size: 12063,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 20, 47, 8),
      from: '"赵万里" <wb.zhaowanli01@office.163.com>',
      id: 'AIYA2QDtE2uCYPxrkd03XaqI',
      to: '"陈益" <chenyi13@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 19, 42, 45),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【系统更新预告】服务平台更新通知',
      flags: { read: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 19, 9, 56),
      size: 8011,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 19, 25, 46),
      from: '"陈益" <chenyi13@office.163.com>',
      id: 'APwALQCvE6CC4fLIAsK6Kare',
      to: '"企业邮更新通知" <qiyeonupdate@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 19, 10, 0),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【问题反馈】网易灵犀Mac端V11.3.1',
      flags: { read: true, attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 18, 50, 0),
      size: 1546776,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 18, 55, 36),
      from: '"张军" <zhangjun04@office.163.com>',
      id: 'ANcAEwCOEzuC*OPfoUqr8aqe',
      to: 'kf <kf@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 18, 50, 4),
    },
  ],
  total: 3724,
};
const data = {
  code: 'S_OK',
  var: [
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【系统更新预告】企业邮箱qiyeentry服务更新（2022-01-18）',
      flags: { read: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 17, 38, 8),
      size: 4972,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 18, 16, 38),
      from: '"郑龙礼" <zhengll@office.163.com>',
      id: 'AAwA5gDlE*OCosgqD7SgRqpp',
      to: '"企业邮更新通知" <qiyeonupdate@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 17, 38, 12),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '[网络管理中心]AWS DX跨机房线路接入与老机房线路删除割接通告—R3',
      flags: { read: true, attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 17, 15, 32),
      size: 28949,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 18, 21, 47),
      from: 'sa@corp.netease.com',
      id: 'AMUA1wBnE9SC1bmTRVnwiarw',
      to: 'op-yunxin@hz.netease.com,NIMO@list.nie.netease.com,chenyao13@corp.netease.com,op-sa@hz.netease.com,neteasepaywhtz@service.netease.com,qiyeonupdate@office.163.com,op-music@hz.netease.com,op-media@hz.netease.com,xiazhipei@corp.netease.com',
      receivedDate: new Date(2022, 0, 18, 17, 16, 16),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '回复:【系统更新预告】对外开放接口openplat升级上线通知',
      flags: { read: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 17, 6, 11),
      size: 20413,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 17, 24, 37),
      from: '"程文强" <wb.chengwenqiang01@office.163.com>',
      id: 'AMoAQQBXE7qCBrHmWsfVh4rs',
      to: '"蔡贤勇" <caixianyong@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 17, 6, 15),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【系统更新预告】对外开放接口openplat升级上线通知',
      flags: { read: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 16, 43, 39),
      size: 11640,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 20, 47, 20),
      from: '"蔡贤勇" <caixianyong@office.163.com>',
      id: 'ANsAbgAWE9yCyKAN635luqql',
      to: '"企业邮更新通知" <qiyeonupdate@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 16, 44, 39),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【账户安全】您的邮箱账号于2022-01-18 15:33:29在设备 Apple(BIH-L-4785)，mac10.15.6 登录网易灵犀办公 (Reminder for new device login)',
      flags: { read: true, system: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 15, 33, 41),
      size: 16639,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 15, 35, 36),
      from: '"网易邮件提醒服务" <notice@qiye.163.com>',
      id: 'ABMALAAgEzeCpWJS*EgD04pH',
      to: 'shisheng <shisheng@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 15, 33, 41),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '[网络管理中心]2022年1月21日联通广州香港长传链路割接通告',
      flags: { read: true, attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 15, 10, 4),
      size: 28361,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 20, 47, 28),
      from: 'sa@corp.netease.com',
      id: 'AO*AZgBAE58C--qxXfxEMKq*',
      to: 'uu.sa@list.nie.netease.com,nsdn@list.nie.netease.com,op-sa@hz.netease.com,dba@hz.netease.com,appops@hz.netease.com,op-noc@hz.netease.com,op-m@hz.netease.com,all.sa@list.nie.netease.com,maintain@rd.netease.com,yanxuan-sre@list.nie.netease.com,hz.ops@list.n.netease.com,tfssa@list.nie.netease.com,sys.bj@list.nie.netease.com,hzfengtangfu@corp.netease.com,qiyeonupdate@office.163.com,op-music@hz.netease.com,urs-dev@list.nie.netease.com,op-pe@hz.netease.com,neteasepaywhtz@service.netease.com',
      receivedDate: new Date(2022, 0, 18, 15, 10, 50),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '[网络管理中心] 2022年1月21日00:00~06:00移动萧山-滨江聚园路电信IDC机房线路割接通知',
      flags: { read: true, attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 15, 10, 3),
      size: 29423,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 20, 47, 33),
      from: 'sa@corp.netease.com',
      id: 'AOcApAAQEziCLlt32dhdU4qc',
      to: 'uu.sa@list.nie.netease.com,nsdn@list.nie.netease.com,op-sa@hz.netease.com,dba@hz.netease.com,appops@hz.netease.com,op-noc@hz.netease.com,op-m@hz.netease.com,all.sa@list.nie.netease.com,maintain@rd.netease.com,yanxuan-sre@list.nie.netease.com,hz.ops@list.n.netease.com,tfssa@list.nie.netease.com,sys.bj@list.nie.netease.com,hzfengtangfu@corp.netease.com,qiyeonupdate@office.163.com,op-music@hz.netease.com,urs-dev@list.nie.netease.com,op-pe@hz.netease.com,neteasepaywhtz@service.netease.com',
      receivedDate: new Date(2022, 0, 18, 15, 10, 50),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: 'Re:Re:Re:Re:Re:Re:Re:Re:近两天logs (33)',
      flags: { read: true, inlineAttached: true, attached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 14, 21, 31),
      size: 79596,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 15, 36, 3),
      from: '"石晟" <shisheng@office.163.com>',
      id: 'AGAATgA1E6eCDzd8DLF6UqqV',
      to: '"石晟" <shisheng@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 14, 21, 33),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: 'Re:Re:Re:Re:Re:Re:Re:近两天logs (33)',
      flags: {
        read: true, replied: true, inlineAttached: true, attached: true,
      },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 14, 8, 56),
      size: 75412,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 14, 21, 31),
      from: '"石晟" <shisheng@office.163.com>',
      id: 'ABwAOADVE1mCvi2iUXjatKq3',
      to: '"石晟" <shisheng@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 14, 8, 59),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【问题反馈】网易灵犀Windows端1.8.4',
      flags: { read: true, attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 13, 47, 41),
      size: 1333645,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 15, 34, 38),
      from: '"王磊" <warren@junxitrade.cn>',
      id: 'AEsApACHE*4C5iJEwIGd*4oG',
      to: 'kf <kf@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 13, 47, 45),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: 'Re:Re:Re:Re:Re:Re:近两天logs (33)',
      flags: {
        read: true, replied: true, inlineAttached: true, attached: true,
      },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 13, 29, 27),
      size: 71900,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 14, 8, 57),
      from: '"石晟" <shisheng@office.163.com>',
      id: 'AFsAKgBdE*KClhQ94tmfoKrM',
      to: '"石晟" <shisheng@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 13, 29, 29),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: 'Re:Re:Re:Re:Re:近两天logs (33)',
      flags: {
        read: true, replied: true, inlineAttached: true, attached: true,
      },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 13, 27, 39),
      size: 67368,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 13, 29, 27),
      from: '"石晟" <shisheng@office.163.com>',
      id: 'AHcAIwBwEzmCNBTJ4sUzZao3',
      to: '"石晟" <shisheng@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 13, 27, 42),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '[网络管理中心]2022年杭州东冠机房非游戏BGP_CR2 3槽板卡重启割接通告—R1',
      flags: { read: true, attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 11, 32, 5),
      size: 29060,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 12, 32, 3),
      from: 'sa@corp.netease.com',
      id: 'AAQAXgCBE1CB1ebwOxdjuqp1',
      to: 'uu.sa@list.nie.netease.com,nsdn@list.nie.netease.com,op-sa@hz.netease.com,dba@hz.netease.com,appops@hz.netease.com,op-noc@hz.netease.com,op-m@hz.netease.com,all.sa@list.nie.netease.com,maintain@rd.netease.com,yanxuan-sre@list.nie.netease.com,hz.ops@list.n.netease.com,tfssa@list.nie.netease.com,sys.bj@list.nie.netease.com,hzfengtangfu@corp.netease.com,qiyeonupdate@office.163.com,op-music@hz.netease.com,urs-dev@list.nie.netease.com,op-pe@hz.netease.com,neteasepaywhtz@service.netease.com',
      receivedDate: new Date(2022, 0, 18, 11, 33, 3),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【功能上线通知】销售后台-客户详情页支持抽屉式查看优化',
      flags: { read: true, inlineAttached: true, attached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 9, 37, 55),
      size: 11570908,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 10, 51, 0),
      from: '"吴亦凡" <wuyifan04@office.163.com>',
      id: 'AHAAfQBtE4yBXI7sfkU0ZKqZ',
      to: '"网易灵犀" <neteaselingxi@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 9, 38, 6),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【问题反馈】网易灵犀Windows端1.8.4',
      flags: {
        read: true, replied: true, attached: true, realAttached: true,
      },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 8, 57, 3),
      size: 1070005,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 10, 49, 10),
      from: '"总部武杰" <wuj@sh-hanshi.com>',
      id: 'AGwAlwBcE1mADM1pLc26Aqo1',
      to: 'kf <kf@office.163.com>',
      receivedDate: new Date(2022, 0, 18, 8, 57, 9),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '[网络管理中心]2022年1月25日联通中港线路割接通知—R2',
      flags: { read: true, attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 7, 27, 32),
      size: 28530,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 12, 31, 38),
      from: 'sa@corp.netease.com',
      id: 'ACoA1QDBE3OBAFbqR1483aol',
      to: 'uu.sa@list.nie.netease.com,nsdn@list.nie.netease.com,op-sa@hz.netease.com,dba@hz.netease.com,appops@hz.netease.com,op-noc@hz.netease.com,op-m@hz.netease.com,all.sa@list.nie.netease.com,maintain@rd.netease.com,yanxuan-sre@list.nie.netease.com,hz.ops@list.n.netease.com,tfssa@list.nie.netease.com,sys.bj@list.nie.netease.com,hzfengtangfu@corp.netease.com,qiyeonupdate@office.163.com,op-music@hz.netease.com,urs-dev@list.nie.netease.com,op-pe@hz.netease.com,neteasepaywhtz@service.netease.com',
      receivedDate: new Date(2022, 0, 18, 7, 28, 28),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '[网络管理中心]2022年1月20日联通广州杭州长传线路割接通告—R2',
      flags: { attached: true, realAttached: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 18, 7, 27, 15),
      size: 28423,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 7, 27, 44),
      from: 'sa@corp.netease.com',
      id: 'AHYAtgB5EzmBTlbZRk7vAKrY',
      to: 'uu.sa@list.nie.netease.com,nsdn@list.nie.netease.com,op-sa@hz.netease.com,dba@hz.netease.com,appops@hz.netease.com,op-noc@hz.netease.com,op-m@hz.netease.com,all.sa@list.nie.netease.com,maintain@rd.netease.com,yanxuan-sre@list.nie.netease.com,hz.ops@list.n.netease.com,tfssa@list.nie.netease.com,sys.bj@list.nie.netease.com,hzfengtangfu@corp.netease.com,qiyeonupdate@office.163.com,op-music@hz.netease.com,urs-dev@list.nie.netease.com,op-pe@hz.netease.com,neteasepaywhtz@service.netease.com',
      receivedDate: new Date(2022, 0, 18, 7, 27, 44),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【问题反馈】网易灵犀Mac端V10.15.4',
      flags: {
        read: true, inlineAttached: true, attached: true, realAttached: true,
      },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 17, 21, 51, 15),
      size: 1963902,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 17, 22, 23, 7),
      from: '"王德利" <wangdeli@office.163.com>',
      id: 'AEMAggA8E3uAPPZNx6yYlqrn',
      to: '"客服" <kf@office.163.com>',
      receivedDate: new Date(2022, 0, 17, 21, 51, 19),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: '【更新公告】服务平台_20220117（网盘全量&首页优化预发）',
      flags: { read: true },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 17, 20, 21, 41),
      size: 28916,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 17, 20, 23, 29),
      from: '"徐非易" <xufeiyi@office.163.com>',
      id: 'AD2AgACfE1iAhOSneUH-qqpF',
      to: '"企业邮更新通知" <qiyeonupdate@office.163.com>',
      receivedDate: new Date(2022, 0, 17, 20, 21, 46),
    },
    {
      fid: 1,
      ctrls: null,
      backgroundColor: 0,
      subject: 'Re:Re:Re:Re:近两天logs (33)',
      flags: {
        read: true, replied: true, inlineAttached: true, attached: true,
      },
      priority: 3,
      antiVirusStatus: 'NOT_VIRUS',
      label0: 0,
      sentDate: new Date(2022, 0, 17, 19, 14, 2),
      size: 64721,
      encpwd: null,
      modifiedDate: new Date(2022, 0, 18, 13, 27, 39),
      from: '"石晟" <shisheng@office.163.com>',
      id: 'AKsAzwBQE7uAHss3-6i-eKpi',
      to: '"石晟" <shisheng@office.163.com>',
      receivedDate: new Date(2022, 0, 17, 19, 14, 4),
    },
  ],
  total: 3724,
};