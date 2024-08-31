import React, { useState, useEffect, FC } from 'react';
import { Input, Button, Modal, Popover } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import {
  apiHolder,
  apis,
  IMTeamApi,
  ContactModel,
  MailApi,
  MailEntryModel,
  IMDiscussApi,
  CreateDiscussOption,
  CreateTeamOption,
  ResponseData,
  DataTrackerApi,
  MailBoxEntryContactInfoModel,
} from 'api';
import lodashGet from 'lodash/get';
import ContactIMModal from '@web-common/components/UI/SiriusContact/IMModal';
import { filterContactListByYunxin } from '../../utils/im_team_util';
// icon相关
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';
import InfoTips from '@web-common/components/UI/Icons/svgs/InfoSvg';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import styles from './teamCreator.module.scss';
import { openSession } from '../../common/navigate';
import { contactApi, transContactModel2ContactItem } from '@web-common/components/util/contact';
import { ContactItem, ContactTreeType } from '@web-common/utils/contact_util';
// import {useAppSelector} from "@web-common/state/createStore";
// import {useSelectContactModelByIdsFunc} from "@web-common/state/selector/contact_selector";
import { getBodyFixHeight } from '@web-common/utils/constant';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi();
const imTeamApi = apiHolder.api.requireLogicalApi(apis.imTeamApiImpl) as IMTeamApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const discussApi = apiHolder.api.requireLogicalApi(apis.imDiscussApiImpl) as IMDiscussApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const CreatorConf: Record<number, ContactTreeType[]> = {
  0: ['enterprise'],
  1: ['enterprise', 'team'], // 创建邮件讨论组
};
export type TeamCreatorProps = {
  onCancel?: Function;
} & (
  | {
      creatorType: 0; // 创建群组的类型，0: 普通群组，1: 讨论群组
    }
  | {
      creatorType: 1; // 创建群组的类型，0: 普通群组，1: 讨论群组
      mid: string;
    }
);
// 创建弹窗label
const CreatorLabels = {
  0: {
    creatorTitle: getIn18Text('CHUANGJIANQUNZU'),
    groupTitleLabel: getIn18Text('QUNMINGCHENG'),
    selectGroupMember: getIn18Text('XUANZEQUNCHENGYUAN'),
    placeholder: getIn18Text('QINGSHURUQUNMING11'),
  },
  1: {
    creatorTitle: getIn18Text('FAQIYOUJIANTAO'),
    groupTitleLabel: getIn18Text('TAOLUNZUMINGCHENG'),
    selectGroupMember: getIn18Text('XUANZETAOLUNZU'),
    notInGroupMemberInfo: getIn18Text('GEYOUXIANGDEZHI'),
    notInGroupMemberBtn: getIn18Text('XIANGQING'),
    placeholder: getIn18Text('QINGSHURUTAOLUN'),
  },
};
type ContactItemPair = ContactItem & {
  color?: string;
}; // 添加了头像颜色字段
const TeamCreator: React.FC<TeamCreatorProps> = props => {
  const { onCancel, creatorType } = props;
  const [name, setName] = useState<string>(''); // 群组标题
  const [curContact, setCurContact] = useState<ContactModel>(); // 当前企业联系人
  const [selectedList, setSelectList] = useState<ContactItem[]>([]);
  const [otherContact, setOtherContact] = useState<ContactItemPair[]>([]); // 非当前企业联系人
  const [tid, setTid] = useState<string>('');
  // const ids = selectedList.map(it => it.id);
  // let chosenMembers = selectedList && selectedList.length > 0 ? useSelectContactModelByIdsFunc(ids) :[];
  const [chosenMembers, setChosenMembers] = useState<ContactModel[]>([]);
  // 创建按钮 loading
  const [loading, setLoading] = useState<boolean>(false);
  // 当前用户id
  const [userId, setUserId] = useState('');
  // 邮件列表id
  const [curMailListIds, setCurMailListIds] = useState<{
    id: Record<string, boolean>;
    mail: Record<string, boolean>;
  }>();
  useEffect(() => {
    // 创建讨论组需要默认选中
    if (creatorType === 1 && userId) {
      mailApi
        .doGetMailContent(props.mid, true, false)
        // 这里需要对content中的sender&receiver信息进行处理同企业通讯录中查询一下数据信息。1.27版本之后MailEntryModel不再填充真实的sender&receiver信息。
        .then(async content => {
          const { receiver, sender, senders, ...restProps } = content;

          // 判断当前用户是否在企业通讯录信息中
          const accounts = ([...receiver, sender] as MailBoxEntryContactInfoModel[]).map(item => {
            return item.contact.contact.accountName;
          });
          // 要调用服务端方法 不能调用本地方法(web等环境下没有云信信息)
          const list = await contactApi.doGetServerContactByEmails(accounts);

          const contactModelMap = new Map(
            list.map(item => {
              return [item.contact.accountName, item];
            })
          );

          const newReceive: MailBoxEntryContactInfoModel[] = (receiver as MailBoxEntryContactInfoModel[]).map(item => {
            const email = item.contactItem.contactItemVal;
            if (!contactModelMap.has(email)) {
              return item;
            }
            const contactModel = contactModelMap.get(email)!;
            return {
              ...item,
              contact: contactModel,
            };
          });

          const senderEmail = sender.contactItem.contactItemVal;
          const newSender: MailBoxEntryContactInfoModel = contactModelMap.has(senderEmail)
            ? {
                ...sender,
                contact: contactModelMap.get(senderEmail)!,
              }
            : sender;

          content.receiver = newReceive as MailBoxEntryContactInfoModel[];
          content.sender = newSender as MailBoxEntryContactInfoModel;
          content.senders = [newSender as MailBoxEntryContactInfoModel];

          return {
            ...restProps,
            sender: newSender,
            senders: [newSender],
            receiver: newReceive,
          };
        })
        .then((content: MailEntryModel) => {
          const {
            entry: { title, tid },
            receiver,
            sender,
          } = content;
          setName(title.slice(0, 30));
          setTid(tid ?? '');
          let contactItems: ContactItemPair[] = [];
          let otherContactItems: ContactItemPair[] = [];
          let chosenMemberItems: ContactModel[] = [];
          const doGetContactInMailListParams = {
            idList: [] as string[],
            emailList: [] as string[],
          };
          // 所有成员
          const members = [...receiver, sender];
          for (let { contact, contactItem, mailMemberType } of members) {
            // 过滤掉密送的
            if (mailMemberType === 'bcc') {
              break;
            }
            if (contact.contact.type === 'enterprise') {
              // 如果是当前企业联系人
              if ([contact.contact.displayEmail, contact.contact.hitQueryEmail, contact.contact.accountName].includes(userId)) {
                // 屏蔽掉本人
                continue;
              }
              doGetContactInMailListParams.emailList.push(contactItem.contactItemVal);
              contactItems.push(transContactModel2ContactItem(contact));
              chosenMemberItems.push(contact);
            } else {
              // 非当前企业联系人
              otherContactItems.push({
                ...transContactModel2ContactItem(contact),
                color: contact.contact.color,
              });
            }
          }
          // 过滤掉邮件列表
          if (doGetContactInMailListParams.emailList.length > 0 || doGetContactInMailListParams.idList.length > 0) {
            // 空数组报错
            contactApi.doGetContactInMailList(doGetContactInMailListParams).then(res => {
              setCurMailListIds(res);
            });
          }
          setSelectList(contactItems);
          setChosenMembers(chosenMemberItems);
          setOtherContact(otherContactItems);
        });
    }
  }, [userId]);
  useEffect(() => {
    if (curMailListIds != null) {
      const mails = curMailListIds.mail;
      const mailList: ContactItem[] = []; // 邮件列表
      const notMailList: ContactItem[] = []; // 非邮件列表数据
      // 过滤邮件列表
      selectedList.forEach(selected => {
        if (mails[selected.email]) {
          mailList.push(selected);
        } else {
          notMailList.push(selected);
        }
      });
      setSelectList(notMailList); // 去除掉邮件列表
      setOtherContact(otherContact.concat(mailList)); // 费邮件列表需要加入非联系人
    }
  }, [curMailListIds]);
  useEffect(() => {
    const curUser = systemApi.getCurrentUser();
    if (!curUser) {
      return;
    }

    setUserId(curUser.id);

    // 至少包含IM和email
    if (lodashGet(curUser, 'contact.contactInfo.length', 0) >= 2) {
      setCurContact(filterContactListByYunxin([curUser.contact!])[0]);
    } else {
    }

    const contactId = lodashGet(curUser, 'contact.contact.id', '') || lodashGet(curUser, 'prop.contactId', '');
    if (!contactId || !contactId.length) {
      return;
    }

    contactApi
      .doGetContactByQiyeAccountId({
        idList: [contactId],
      })
      .then(res => {
        setCurContact(filterContactListByYunxin(res)[0]);
      });
  }, []);
  const handleTrack = (str: string) => {
    trackApi.track(str);
  };
  const close = () => {
    onCancel && onCancel();
  };
  const createTeam = async () => {
    if (!curContact) {
      return;
    }
    // console.log(curContact, chosenMembers, name);

    const queryIds: Set<string> = new Set(
      selectedList.map(item => {
        return item.id!;
      })
    );

    if (!queryIds.size) {
      return;
    }

    let fetchModel = await contactApi.doGetContactById([...queryIds.values()]);

    const isMatchAll =
      fetchModel.filter(item => {
        return item.contactInfo.length >= 2;
      }).length >= queryIds.size;

    if (!isMatchAll) {
      fetchModel = await contactApi.doGetContactByQiyeAccountId({
        idList: [...queryIds.values()],
      });
    }

    let members = fetchModel
      .map(item => {
        return item.contactInfo;
      })
      .flat()
      .filter(item => {
        return item.contactItemType === 'yunxin';
      })
      .map(item => {
        return item.contactItemVal;
      });

    // 普通群如果member数量只有一个人 自动转成单聊
    if (members.length === 1 && creatorType === 0) {
      openSession(
        {
          sessionId: `p2p-${members}`,
          mode: 'normal',
        },
        {
          createSession: true,
        }
      );
      close();
      return;
    }
    // 打开loading
    setLoading(true);
    let option: CreateTeamOption | CreateDiscussOption;
    if (creatorType === 0) {
      option = {
        name,
        // owner: curContact.contactInfo[0].contactItemVal,
        owner: contactApi.findContactInfoVal(curContact.contactInfo, 'yunxin'),
        members: members.join(','),
        use_auto_name: 1,
      } as CreateTeamOption;
    } else {
      option = {
        // owner: curContact.contactInfo[0].contactItemVal,
        owner: contactApi.findContactInfoVal(curContact.contactInfo, 'yunxin'),
        members: members,
        name,
        emailTid: tid,
        emailMid: props.mid,
      } as CreateDiscussOption;
    }
    try {
      let ret: ResponseData<any>;
      if (creatorType === 0) {
        ret = await imTeamApi.createTeam(option as CreateTeamOption, false);
      } else {
        ret = await discussApi.createDiscuss(option as CreateDiscussOption, false);
      }
      if (ret?.success) {
        let sessionId = `team-${creatorType === 0 ? ret.data.team_id : ret.data.teamId}`; // 后端接口字段变化了
        openSession(
          {
            sessionId,
            mode: 'normal',
          },
          {
            createSession: true,
          }
        );
        creatorType !== 0 && trackApi.track('pcMail_click_addNewMailChatPage_addSuccess');
      }
      close();
      setLoading(false);
    } catch (ex) {
      message.info(lodashGet(ex, 'message', getIn18Text('CHUANGJIANSHIBAI')));
      setLoading(false);
    }
  };
  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  // const transItemToModel = (members: ContactItem[]): ContactModel[] => {
  //
  //   return members && members.length > 0 ? selectById(members.map(it => it.id)) : [];
  // }
  const setMembers = (selectList: ContactItem[], members: ContactItem[]) => {
    console.log('@@@handleSelect', selectList, members);
    setSelectList(selectList);
    // setChosenMembers(members);
    // const items: ContactModel[] = transItemToModel(members);
    // setChosenMembers(items);
  };

  return (
    <div className={styles.createTeamWrapper}>
      <div className={styles.titleBar}>
        <span data-test-id="im_create_team_modal_title" className={styles.title}>
          {CreatorLabels[creatorType]['creatorTitle']}
        </span>
        <div data-test-id="im_create_team_modal_close_btn" className={styles.closeButton} onClick={close}>
          <CloseIcon />
        </div>
      </div>
      <div className={classnames('ant-allow-dark', styles.teamItem, styles.noShrink)}>
        <span className={styles.label}>{CreatorLabels[creatorType]['groupTitleLabel']}</span>
        <Input
          data-test-id="im_create_team_modal_teamname_input"
          placeholder={CreatorLabels[creatorType]['placeholder']}
          value={name}
          onChange={onNameChange}
          className={styles.input}
          maxLength={30}
          allowClear
        />
      </div>
      <div className={classnames(styles.teamItem, styles.flex)}>
        <span className={styles.label}>{CreatorLabels[creatorType]['selectGroupMember']}</span>
        {
          // 非企业成员提示
          creatorType === 1 && otherContact.length > 0 && (
            <div className={styles.notInGroupInfo}>
              <div className={styles.leftInfo}>
                <div className={styles.infoIcon}>
                  <InfoTips />
                </div>
                <div className={styles.infoTxt}>{`${otherContact.length}${CreatorLabels[creatorType]['notInGroupMemberInfo']}`}</div>
              </div>
              <Popover
                placement="bottomRight"
                arrowPointAtCenter
                content={
                  <div className={styles.memberList}>
                    {otherContact.map((item, index) => (
                      <div className={styles.cardItem} key={index}>
                        <div className={styles.leftAvatar}>
                          <AvatarTag
                            user={{
                              name: item.name,
                              avatar: item.avatar,
                              email: item.email,
                              color: item.color,
                            }}
                          />
                        </div>
                        <div className={styles.memberInfo}>
                          <div className={styles.memberName}>{item.name}</div>
                          <div className={styles.memberMail}>{item.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
                onVisibleChange={(visable: boolean) => {
                  visable && handleTrack('pcMail_hover_addNewMailChatPage_seeNonInternalMember');
                }}
              >
                <a className={styles.rightInfo} type="link">
                  {CreatorLabels[creatorType]['notInGroupMemberBtn']}
                </a>
              </Popover>
            </div>
          )
        }
        <div className={styles.chooseWrap}>
          {curContact && (
            <ContactIMModal
              type={CreatorConf[creatorType]}
              showAddTeamBtn={creatorType === 1}
              order={['enterprise', 'team', 'personal', 'recent']}
              disableCheckList={[transContactModel2ContactItem(curContact)]}
              defaultSelectList={selectedList}
              onChange={setMembers}
            />
          )}
        </div>
        {/* {curContact && <MemberChooser disabledMembers={[curContact]} />} */}
      </div>
      <div className={styles.buttonBox}>
        <Button
          data-test-id="im_create_team_modal_cancel_btn"
          onClick={() => {
            handleTrack('pcMail_click_addNewMailChatPage_addCancel');
            close();
          }}
        >
          {getIn18Text('QUXIAO')}
        </Button>
        <Button
          data-test-id="im_create_team_modal_create_btn"
          type="primary"
          loading={loading}
          className={styles.confirmButton}
          onClick={createTeam}
          disabled={!selectedList.length}
        >
          {getIn18Text('CHUANGJIAN')}
        </Button>
      </div>
    </div>
  );
};
export const TeamCreatorPage: FC<any> = props => {
  const { visible, onClose } = props;
  return (
    <Modal width={640} visible={visible} closable={false} footer={null}>
      <TeamCreator creatorType={0} onCancel={onClose} />
    </Modal>
  );
};
// 创建页，会在聊天窗口的右侧，不会遮盖切换tab
export const TeamContactModel: FC<
  {
    show: boolean;
  } & TeamCreatorProps
> = props => {
  const { show /*, onCancel*/ } = props;
  return (
    <>
      {show && (
        <div
          className={classnames({
            [styles.teamCreatorWrapperNoLeft]: systemApi.isWebWmEntry(),
            [styles.teamCreatorWrapper]: true,
          })}
          style={{ top: `${getBodyFixHeight(false, true)}px` }}
        >
          <TeamCreator {...props} />
        </div>
      )}
    </>
  );
};
export default TeamCreator;
