import React from 'react';
import { Button, Form } from 'antd';
// import { SiriusPageProps } from '../model'
import { apiHolder as api, LoginApi, SystemApi, IMTeamApi, apis, ErrorReportApi } from 'api';
import moment from 'moment';
import { navigate } from 'gatsby';

import { SiriusState } from '@web-common/state/state';
import { UpdateModuleUnread } from '@web-common/state/action';
import Alert from '@web-common/components/UI/Alert/Alert';
import LinkIcon from '@web-common/components/UI/Icons/svgs/LinkSvg';
import SiriusRadio from '@web-common/components/UI/SiriusRadio';
import { useActions, useAppSelector } from '@web-common/state/createStore';
import { ReadCountActions } from '@web-common/state/reducer';
import TimeLinePicker from '../Schedule/components/TimeLinePicker/TimeLinePicker';
import { TimeLinePickerGroup } from '../Schedule/components/TimeLinePicker/TimeLinePickerGroup';

import styles from './test.module.scss';
import { ScheduleDatePicker, ScheduleTimeStepPicker } from '../Schedule/components/FormComponents';
import ScheduleFormTest from './ScheduleFormTest';
import PageContentLayout from '../../../layouts/Main/pageContentLayout';

const loginApi = api.api.requireLogicalApi(apis.loginApiImpl) as LoginApi;

const imTeamApi = api.api.requireLogicalApi(apis.imTeamApiImpl) as IMTeamApi;

const Test: React.FC<{
  [props: string]: any;
}> = props => {
  console.log(loginApi, loginApi.doLogout);
  console.log(imTeamApi, imTeamApi?.createTeam);
  // const { dispatch, unreadCount } = props;
  const unreadCount = useAppSelector(state => state.readCountReducer.unreadCount);
  const countActions = useActions(ReadCountActions);
  const createOption = {
    members: '41487604f53f7c6ae8aea334150c1c98',
    name: 'test_2',
    owner: 'ae4ca2d9187d0debedefba769c497136',
  };

  const removeOption = {
    owner: 'b080c11bcd19baf03e6d9b3732c1bbd2',
    team_id: '3838577766',
  };

  const addMemberOption = {
    members: '41487604f53f7c6ae8aea334150c1c98',
    owner: 'ae4ca2d9187d0debedefba769c497136',
    team_id: '3838577766',
  };

  const removeMemberOption = {
    members: '41487604f53f7c6ae8aea334150c1c98',
    owner: 'ae4ca2d9187d0debedefba769c497136',
    team_id: '3838577766',
  };

  const addManagerOption = {
    members: 'ae4ca2d9187d0debedefba769c497136',
    owner: 'ae4ca2d9187d0debedefba769c497136',
    team_id: '3838577766',
  };

  const removeManagerOption = {
    members: 'b080c11bcd19baf03e6d9b3732c1bbd2',
    owner: 'ae4ca2d9187d0debedefba769c497136',
    team_id: '3838577766',
  };

  const changeOwnerOption = {
    new_owner: 'b080c11bcd19baf03e6d9b3732c1bbd2',
    owner: 'ae4ca2d9187d0debedefba769c497136',
    team_id: '3838577766',
  };

  const quitTeamOption = {
    acc_id: 'ae4ca2d9187d0debedefba769c497136',
    team_id: '3838577766',
  };

  const updateProfileOption = {
    owner: 'ae4ca2d9187d0debedefba769c497136',
    team_id: '3838577766',
    anno: 'this is 群公告',
    intro: '群介绍',
    name: 'test012345678901234567890123456789012345678901234567890123456789',
  };

  return (
    /** 页面内容外出包裹PageContentLayout组件 */
    <PageContentLayout>
      <div style={{ width: 500, padding: 20, paddingTop: 100 }}>
        <div>
          <h3>radio 按钮</h3>
          <SiriusRadio checked>选中</SiriusRadio>
          <SiriusRadio>未选中</SiriusRadio>
        </div>
        <button
          onClick={() => {
            navigate('#schedule?foo=bar');
          }}
        >
          #schedule?foo=bar
        </button>
        <div className={styles.allButtons}>
          <div className={styles.buttonColumn}>
            <Button>取消</Button>
            <Button className="disabled">禁用</Button>
            <Button type="primary">完成</Button>
            <Button danger>警告</Button>
            <Button className="ant-btn-panel">无边框</Button>
            {/* <Button type="primary" icon={<span className="anticon"><LinkIcon /></span>}>带icon</Button> */}
          </div>
          <div className={styles.buttonColumn}>
            <Button className="ant-btn-wide">宽版取消</Button>
            <Button className="ant-btn-wide disabled">禁用</Button>
            <Button type="primary" className="ant-btn-wide">
              宽版完成
            </Button>
            <Button danger className="ant-btn-wide">
              宽版警告
            </Button>
            <Button className="ant-btn-panel ant-btn-wide">宽版无边框</Button>
            <Button
              type="primary"
              className="ant-btn-wide"
              icon={
                <span className="anticon">
                  <LinkIcon />
                </span>
              }
            >
              带icon
            </Button>
          </div>
          <div className={styles.buttonColumn}>
            <Button size="small">取消</Button>
            <Button size="small" className="disabled">
              禁用
            </Button>
            <Button size="small" type="primary">
              完成
            </Button>
            <Button size="small" danger>
              警告
            </Button>
            <Button size="small" className="ant-btn-panel">
              无边框
            </Button>
            <Button
              size="small"
              type="primary"
              icon={
                <span className="anticon">
                  <LinkIcon />
                </span>
              }
            >
              icon
            </Button>
            <Button
              size="small"
              type="primary"
              className="ant-btn-wide"
              icon={
                <span className="anticon">
                  <LinkIcon />
                </span>
              }
            >
              带icon
            </Button>
          </div>
        </div>
        <div>
          <ScheduleFormTest />
        </div>
      </div>
      <div>
        <div>
          <button
            onClick={() => {
              const al = Alert.warn({
                title: '确定清空“收件箱”中总计108封邮件吗？',
                content: '清空的邮件将暂存在“已删除”文件夹中30天',
                nmrText: '不想提醒',
                funcBtns: [
                  {
                    text: '取消',
                    onClick: () => al.destroy(),
                    // type: 'primary',
                    // pullLeft: !0
                  },
                  {
                    text: '确定',
                    nmr: !0, // 不再选中
                    onClick: (event, nmrChecked) => {
                      console.log({
                        event,
                        nmrChecked, // 是否选中不再提醒
                      });
                    },
                    danger: !0,
                  },
                ],
              });
            }}
          >
            warn
          </button>
          <button
            onClick={() =>
              Alert.error({
                title: '错误',
                footerTopBorder: !0,
                content: 'xxx',
                closable: !0,
              })
            }
          >
            error
          </button>
          <button onClick={() => Alert.info({ title: '信息', content: '描述' })}>info</button>
          <button onClick={() => Alert.debug({})}>debug</button>
        </div>
        <p>{`写信模块未读${unreadCount.mailbox}`}</p>
        <button
          onClick={() => {
            countActions.updateMailboxUnreadCount(unreadCount.mailbox !== undefined ? unreadCount.mailbox + 1 : 1);
          }}
        >
          增加IM模块未读
        </button>
        <hr />
        <br />

        <button
          onClick={() => {
            imTeamApi.createTeam(createOption).then(res => {
              console.log('after create team', res);
            });
          }}
        >
          创建群组
        </button>

        <button
          onClick={() => {
            imTeamApi.addMember(addMemberOption).then(res => {
              console.log('after add member', res);
            });
          }}
        >
          群组加人
        </button>

        <button
          onClick={() => {
            imTeamApi.removeMember(removeMemberOption).then(res => {
              console.log('after remove member', res);
            });
          }}
        >
          群组踢人
        </button>

        <button
          onClick={() => {
            imTeamApi.addManager(addManagerOption).then(res => {
              console.log('after add manager', res);
            });
          }}
        >
          任命管理员
        </button>

        <button
          onClick={() => {
            imTeamApi.removeManager(removeManagerOption).then(res => {
              console.log('after remove manager', res);
            });
          }}
        >
          移除管理员
        </button>

        <button
          onClick={() => {
            imTeamApi.removeTeam(removeOption).then(res => {
              console.log('after remove team', res);
            });
          }}
        >
          解散群组
        </button>

        <button
          onClick={() => {
            imTeamApi.changeOwner(changeOwnerOption).then(res => {
              console.log('after change owner', res);
            });
          }}
        >
          转让群主
        </button>

        <button
          onClick={() => {
            imTeamApi.quitTeam(quitTeamOption).then(res => {
              console.log('after quit team', res);
            });
          }}
        >
          主动退群
        </button>

        <button
          onClick={() => {
            imTeamApi.updateProfile(updateProfileOption).then(res => {
              console.log('after update profile', res);
            });
          }}
        >
          编辑群资料
        </button>

        <button
          onClick={() => {
            imTeamApi.queryProfile('3838577766', 1).then(res => {
              console.log('queryProfile', res);
            });
          }}
        >
          查询群信息
        </button>

        <button
          onClick={() => {
            imTeamApi.queryDetailProfile('3838577766').then(res => {
              console.log('queryDetailProfile', res);
            });
          }}
        >
          查询群详细信息
        </button>

        <button
          onClick={() => {
            imTeamApi.memberBelongs('ae4ca2d9187d0debedefba769c497136').then(res => {
              console.log('memberBelongs', res);
            });
          }}
        >
          获取所在群
        </button>

        <button
          onClick={() => {
            // 1关闭 2打开
            imTeamApi.muteMessage({ accid: 'ae4ca2d9187d0debedefba769c497136', team_id: '3838577766', ope: 1 }).then(res => {
              console.log('queryProfile', res);
            });
          }}
        >
          消息免打扰
        </button>
        <button
          onClick={() => {
            const errorApi = api.api.requireLogicalApi('errorReportImpl') as unknown as ErrorReportApi;
            errorApi.doReportMessage({ error: '出错了' });
          }}
        >
          测试sentry手动上传错误
        </button>
      </div>
    </PageContentLayout>
  );
};

export default Test;
// export default MailBox
