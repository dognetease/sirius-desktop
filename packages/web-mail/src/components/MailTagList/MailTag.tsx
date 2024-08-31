import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import debounce from 'lodash/debounce';
import classnames from 'classnames/bind';
import { apiHolder, SystemApi, MailConfApi, reDefinedColorList, inWindow, DataTrackerApi, apis, ResponseMailClassify, UpgradeAppApi, guideBy } from 'api';
import lodashGet from 'lodash/get';
import { Dropdown, Modal, Input, Tooltip, Button, Collapse } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { ReactComponent as CaretRightOutlined } from '@/images/icons/arrow_expand_gray.svg';
import { ReactComponent as CaretDownOutlined } from '@/images/icons/arrow-down.svg';
import globalMessage from '@web-common/components/UI/Message/SiriusMessage';
import { MailTagIcon, AddTagIcon, TagCheckedIcon } from './Icon';
import useMsgCallback from '@web-common/hooks/useMsgCallback';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import style from './MailTag.module.scss';
import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
import { useActions, useAppSelector, MailClassifyActions, HollowOutGuideAction } from '@web-common/state/createStore';
import MailTagContentIcon from '@/images/icons/mail/mail-tag.svg';
import { getTreeStatesByAccount, isMainAccount, mailConfigStateIsMerge, setCurrentAccount, deleteHkByTagName } from '../../util';
import InputContextMenu from '@web-common/components/UI/InputContextMenu/InputContextMenu';
// import { Input as LxInput } from '@web-common/components/UI/Input';
import LxInput from '@lingxi-common-component/sirius-ui/Input';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import { getIn18Text } from 'api';
import MailTagHotKeyInput, { HkInputRef } from './MailTagHotKeyInput';
import Badge from '@web-common/components/UI/SiriusBadge';
import TagGuide from './TagGuide';

const { Panel } = Collapse;

const mailManagerApi = apiHolder.api.requireLogicalApi('mailConfApiImpl') as unknown as MailConfApi;
const systemApi: SystemApi = apiHolder.api.getSystemApi();
const storeApi = apiHolder.api.getDataStoreApi();
const eventApi = apiHolder.api.getEventApi();
const upgradeAppApi = apiHolder.api.requireLogicalApi(apis.upgradeAppApiImpl) as unknown as UpgradeAppApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const realStyle = classnames.bind(style);
export { MailTagIcon, AddTagIcon, TagCheckedIcon } from './Icon';
const trackApi: DataTrackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
type TagItemSelfProp = {
  color: number;
  isShow: 0 | 1;
  tagId?: string;
};
type TagItemProp = [string, TagItemSelfProp, number];
interface EditTagContentProps {
  data: TagItemProp | [];
}
interface EditTagModalProps extends EditTagContentProps {
  type?: 'replace' | 'add' | 'update';
  initVisible?: boolean;
  afterClose(res: boolean): void;
  tagList?: TagItemProp[];
  markWhenAdd?: boolean;
  activeIds?: string[];
  container?: HTMLElement;
  mask?: boolean;
  maskClosable?: boolean;
  onTagAdded?: (tagName: string, tagColor: number) => void;
  account?: string;
}
const __globalTagColor = {
  count: -1,
} as {
  count: number;
  setNext(count: number): void;
  setPrev(count: number): void;
};
const GLOBAL_TAG_COLOR = new Proxy(__globalTagColor, {
  get(target, prop) {
    switch (prop) {
      case 'count':
        return Reflect.get(target, prop) >= 0 ? Reflect.get(target, prop) : [...reDefinedColorList[0].nums].pop();
      case 'setNext':
        return (count: number) => {
          let $index = reDefinedColorList.map(item => item.nums).findIndex(item => item.includes(count));
          $index = $index === -1 || $index >= reDefinedColorList.length - 1 ? 0 : $index + 1;
          const colors = reDefinedColorList[$index]?.nums;
          Reflect.set(target, 'count', [...colors].pop());
        };
      case 'setPrev':
        return (count: number) => {
          let $index = reDefinedColorList.map(item => item.nums).findIndex(item => item.includes(count));
          $index = $index <= 0 ? 0 : $index - 1;
          const colors = reDefinedColorList[$index]?.nums;
          Reflect.set(target, 'count', [...colors].pop());
        };
      default:
        return new Error('undefined property');
    }
  },
});
// 编辑标签
export const TagModal: React.FC<EditTagModalProps> = React.forwardRef((props, _) => {
  // eslint-disable-next-line react/prop-types
  const { data, type = 'replace', afterClose, markWhenAdd, activeIds, container, onTagAdded = () => {}, mask = true, maskClosable = true, tagList, account } = props;
  // 邮件-邮件列表
  // const [mailDataList] = useState2RM('mailDataList');
  // 错误提示
  const [errorMsg, setErrorMsg] = useState('');
  const [visible, setVisible] = useState(true);
  const [tagName, setTagName] = useState(data[0] || '');
  const mailTagHkInput = useRef<HkInputRef>(null);
  const [tagColor, setTagColor] = useState<number>(() => {
    if (type === 'replace' || type === 'update') {
      // eslint-disable-next-line react/prop-types
      return data[1]?.color as number;
    }
    return GLOBAL_TAG_COLOR.count;
  });
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  const editTag = async () => {
    let _errorMsg = '';
    // 判断是否跟其他标签重名
    if (tagList && tagList.length && data) {
      let sum = 0;
      tagList.forEach(i => {
        if (i[0] && i[0]?.toLowerCase() == data[0]?.toLowerCase()) {
          sum++;
        }
      });
      const isRepeat = sum > 1;
      if (isRepeat) {
        _errorMsg = getIn18Text('YICUNZAITONGMING11');
        setErrorMsg(_errorMsg);
        return Promise.reject(new Error(_errorMsg));
      }
    }
    try {
      const requestParam = isCorpMail
        ? // eslint-disable-next-line react/prop-types
          [[data[1]?.tagId, { color: tagColor, name: tagName }]]
        : [[data[0], { color: tagColor, alias: tagName, isShow: 1 }]];
      // setCurrentAccount();
      const res = await mailManagerApi.manageTag(type, requestParam, tagName, account);
      mailTagHkInput.current &&
        mailTagHkInput.current.updateHk2Local({
          oldName: data[0],
          name: tagName,
        });
      eventApi.sendSysEvent({
        eventName: 'mailTagChanged',
        eventData: {
          oldTag: data[0],
          updateTag: tagName,
          _account: account,
        },
        eventStrData: 'updateTag',
        _account: account,
      });
      globalMessage.success({ content: getIn18Text('XIUGAIBIAOQIANCHENG'), duration: 1 });
      return res;
    } catch (ex) {
      _errorMsg = lodashGet(ex, 'message', getIn18Text('XIUGAIBIAOQIANSHI'));
      setErrorMsg(_errorMsg);
      return Promise.reject(new Error(_errorMsg));
    }
  };
  const addTag = async (noSuccessTip = false) => {
    try {
      // setCurrentAccount();
      const res = await mailManagerApi.manageTag('add', [[tagName, { color: tagColor }]], tagName, account);
      onTagAdded(tagName, tagColor);
      if (!noSuccessTip) {
        globalMessage.success({ content: getIn18Text('XINJIANBIAOQIANCHENG'), duration: 1 });
      }
      return res;
    } catch (ex) {
      setErrorMsg(lodashGet(ex, 'message', getIn18Text('XINJIANBIAOQIANSHI')));
      return Promise.reject(ex);
    }
  };
  const markTag = () => {
    globalMessage.loading({ content: getIn18Text('BIAOJIZHONG'), duration: 35, key: tagName });
    eventApi.sendSysEvent({
      eventName: 'mailTagChanged',
      eventData: {
        tagNames: [tagName],
        // mailList: activeIds ? mailDataList.filter((v: MailEntryModel) => activeIds!.includes(v.entry.id)) : [],
        mailList: activeIds,
        tagIds: [undefined],
        isNewTag: true,
      },
      eventStrData: 'tag',
      _account: account,
    });
  };
  const addTagAndMark = async () => {
    await addTag(true);
    markTag();
  };
  const submit = () => {
    if (type === 'replace' || type === 'update') {
      return editTag();
    }
    if (type === 'add') {
      // 将快捷键存储到本地
      mailTagHkInput.current && mailTagHkInput.current.saveHk2Local(tagName);
      if (!markWhenAdd) {
        return addTag();
      }
      return addTagAndMark();
    }
    return Promise.resolve();
  };
  const inputRef = useRef<Input>(null);

  return (
    <SiriusModal
      title={type === 'replace' || type === 'update' ? getIn18Text('XIUGAIBIAOQIAN') : getIn18Text('XINJIANBIAOQIAN')}
      visible={visible}
      okText={getIn18Text('QUEDING')}
      cancelText={getIn18Text('QUXIAO')}
      width={440}
      maskClosable={maskClosable}
      mask={mask}
      getContainer={() => container || document.getElementById('mailboxModule') || document.body}
      onOk={async () => {
        try {
          /**
           * 校验对应的快捷键是否通过了冲突
           * 直接引用子组件的方法，是为了让此业务逻辑内聚在一个组件中，不要散布的到处都是
           */
          if (mailTagHkInput.current && mailTagHkInput.current.valid(tagName)) {
            await submit();
            if (type === 'add') {
              GLOBAL_TAG_COLOR.setNext(tagColor);
            }
            setVisible(false);
          }
          // eslint-disable-next-line no-empty
        } catch (e) {
          console.error('[error] mail tag model error', e);
        }
      }}
      onCancel={() => {
        setVisible(false);
      }}
      afterClose={() => {
        afterClose(false);
      }}
      okButtonProps={{
        disabled: tagName.trim().length === 0 || tagColor === -1,
      }}
      className={style.tagModalWrap}
      closeIcon={<CloseIcon className="dark-invert" />}
    >
      <>
        <div className={realStyle('subTitle')}>标签名称</div>
        <InputContextMenu inputOutRef={inputRef} changeVal={setTagName}>
          <LxInput
            autoFocus={type !== 'replace' && type !== 'update'}
            ref={inputRef}
            type="text"
            value={tagName}
            maxLength={20}
            style={{ marginTop: 8 }}
            onChange={e => {
              // 最多只允许输入10个中文或者20个英文字符;
              // @ts-ignore
              let val = e.target.value as string;
              let remainLength = 20;
              let actualLength = 0;
              while (remainLength >= 0 && val.length) {
                const unitChart = val.slice(0, 1);
                const cnReg = /[\u4e00-\u9fa5]/;
                const unitLength = cnReg.test(unitChart) ? 2 : 1;
                val = val.slice(1);
                if (remainLength - unitLength < 0) {
                  setErrorMsg(getIn18Text('MINGCHENGZUIDUOWEI'));
                  break;
                }
                remainLength -= unitLength;
                actualLength += 1;
              }
              setTagName(e.target.value.slice(0, actualLength));
              setErrorMsg('');
            }}
            placeholder={getIn18Text('QINGSHURUBIAOQIAN')}
            openFix={false}
          />
        </InputContextMenu>
        <div className={realStyle('subTitle')} style={{ marginTop: 16 }}>
          标签快捷键
        </div>
        <MailTagHotKeyInput tagName={tagName} account={account} style={{ marginTop: 8 }} ref={mailTagHkInput} />
        <div className={realStyle('tagModalBody')}>
          {errorMsg && <p className={realStyle('addTagError')}>{errorMsg}</p>}
          <div className={realStyle('tagRadioList')}>
            <p className={realStyle('label')}>{getIn18Text('BIAOQIANYANSE')}</p>
            <ul className={realStyle('list')}>
              {reDefinedColorList.map(item => (
                <span
                  key={item.className}
                  className={realStyle('item')}
                  style={{
                    backgroundColor: item.color,
                  }}
                  onClick={() => {
                    const initColor = item.nums[item.nums.length - 1];
                    setTagColor(initColor);
                  }}
                >
                  {item.nums.includes(tagColor) ? <TagCheckedIcon /> : null}
                </span>
              ))}
            </ul>
          </div>
        </div>
      </>
    </SiriusModal>
  );
});
interface ItemProps {
  data: TagItemProp;
  activeName: string;
  disabled: boolean;
  tagList: TagItemProp[];
  account?: string;
}
// 展示单个标签
const Item: React.FC<ItemProps> = props => {
  const { data, activeName, disabled = false, tagList, account } = props;
  // 标签颜色
  const strokeColor = reDefinedColorList.find(item => item.nums.includes(data[1].color))?.color || '#6BA9FF';
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  // 来信分类配置
  const { setMailTag, changeShowClassifyModal } = useActions(MailClassifyActions);
  const triggerDeleteTag = async (deleteData: TagItemProp) => {
    const isMerge = mailConfigStateIsMerge();
    Modal.confirm({
      title: `确定删除"${deleteData[0]}"吗`,
      [`${deleteData[2]}` === '0' ? 'customContent' : 'content']: isMerge
        ? getIn18Text('GAIBIAOQIANJIANGCONG')
        : `该标签将从${deleteData[2]}封邮件中删除，但是不会删除邮件`,
      okText: getIn18Text('SHANCHU'),
      cancelText: getIn18Text('QUXIAO'),
      async onOk() {
        try {
          const requestParam = isCorpMail ? [deleteData[1].tagId] : [deleteData[0]];
          // setCurrentAccount();
          await mailManagerApi.manageTag('delete', requestParam, undefined, account);
          globalMessage.success({ content: getIn18Text('BIAOQIANSHANCHUCHENG'), duration: 1 });
          // 删除标签后，同步删除对应标签绑定的快捷键
          deleteHkByTagName(deleteData[0]);
          // 通知更新绑定的快捷键
          eventApi.sendSysEvent({
            eventName: 'mailMenuOper',
            eventData: {},
            eventStrData: 'reloadHotKey',
          });

          eventApi.sendSysEvent({
            eventName: 'mailTagChanged',
            eventData: {
              tagNames: [deleteData[0]],
              mailList: [],
            },
            eventStrData: 'cleartag',
            _account: account,
          });
        } catch (ex) {
          globalMessage.error({ content: getIn18Text('BIAOQIANSHANCHUSHI'), duration: 1 });
        }
      },
      onCancel() {
        return Promise.resolve();
      },
    });
  };
  const setMailTagConfig = (tag: TagItemProp | string[]) => {
    setMailTag(tag[0]);
    changeShowClassifyModal(true);
    trackApi.track('pcMail_view_mailClassificationNewPage', { type: 'tags' });
  };
  const [editModalVisible, setEditModalVisible] = useState(false);
  // const [editTag, setEditTag] = useState();
  const triggerEditTag = () => {
    // 错开多个弹窗的显隐时间
    setTimeout(() => {
      setEditModalVisible(true);
    }, 500);
  };
  const menu = (
    <div
      className={realStyle('tagItemMenu')}
      onClick={e => {
        e.stopPropagation();
      }}
    >
      <div
        onClick={() => {
          !disabled && triggerEditTag();
        }}
        className={realStyle('menuItem')}
      >
        {getIn18Text('XIUGAIBIAOQIAN')}
      </div>
      {isMainAccount(account) ? (
        <div
          onClick={() => {
            setMailTagConfig(data);
          }}
          className={realStyle('menuItem')}
        >
          {getIn18Text('SHEZHILAIXINFEN')}
        </div>
      ) : (
        <></>
      )}
      <div
        onClick={() => {
          !disabled && triggerDeleteTag(data);
        }}
        className={realStyle('menuItem')}
      >
        {getIn18Text('SHANCHUBIAOQIAN')}
      </div>

      {/* 编辑标签弹窗 */}
      {editModalVisible && (
        <TagModal
          data={data}
          type={isCorpMail ? 'update' : 'replace'}
          tagList={tagList}
          afterClose={() => {
            setEditModalVisible(false);
          }}
          account={account}
        />
      )}
    </div>
  );
  // 选择当前标签
  const chooseMailTag = useCallback(
    debounce(
      () => {
        try {
          trackApi.track('pcMail_switch_label_folderList', {
            labelName: data[0],
          });
        } catch (err) {
          console.error(err);
        }
        eventApi.sendSysEvent({
          eventName: 'chooseMailTag',
          eventData: data,
          _account: account,
        });
      },
      500,
      {
        leading: true,
        trailing: true,
      }
    ),
    [account]
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  return (
    <div
      data-test-id={`mail-tag-${data[0]}`}
      className={`${realStyle('tagItem')} ${activeName === data[0] ? realStyle('tagItemActive') : ''}`}
      onClick={() => {
        !disabled && chooseMailTag();
      }}
      ref={containerRef}
      onMouseLeave={() => {
        setMenuVisible(false);
      }}
    >
      <MailTagIcon strokeColor={strokeColor} />
      <Dropdown
        getPopupContainer={() => containerRef.current as unknown as HTMLDivElement}
        visible={menuVisible}
        onVisibleChange={visible => {
          !disabled && setMenuVisible(visible);
        }}
        overlay={menu}
        placement="bottomLeft"
        trigger={['contextMenu']}
      >
        <p className={realStyle('tagItemName')}>{data[0]}</p>
      </Dropdown>
      <Dropdown overlay={menu} placement="bottomLeft" trigger={['click']}>
        <div
          data-test-id="mail-tag-more-btn"
          className={`${realStyle('menuEntry', 'more')}`}
          onClick={e => {
            e.stopPropagation();
          }}
        >
          ...
        </div>
      </Dropdown>
    </div>
  );
};
interface MailTagProps {
  activeName: {
    key?: string | null | undefined;
    accountId: string | null;
  };
  disabled: boolean;
  /**
   * 滚动控制器，需要传入滚动距离`top`
   */
  scrollController?: (top: number) => void;

  account?: string;
}
// 固定预置标签
const presetTags = [getIn18Text('SHENPI'), getIn18Text('GONGZUOHUIBAO'), 'ToMe'] as const;
const TAG_GUIDE = 'tag-guide';
// 是否需要展示预置标签提示
// const isShowGuide = (): boolean => {
//   // 只要进入这段逻辑，版本都符合要求（大于等于12版本），更新版本后24小时进入逻辑
//   const { getTime } = upgradeAppApi;
//   const time = getTime();
//   if (time != null) {
//     // 存在更新时间戳
//     const upgradeTime = +time;
//     const updateDay = new Date(upgradeTime).getDate();
//     if (new Date().getDate() != updateDay) {
//       return true;
//     }
//     return false;
//   }
//   return false;
// };
// const getPresetTagsParams = (optionsList: string[]): Record<typeof presetTags[number], ResponseMailClassify> => ({
//   审批: {
//     actions: [
//       {
//         type: 'tags',
//         value: [getIn18Text('SHENPI')] // 标签名称
//       },
//       // 对历史邮件生效
//       {
//         disabled: false,
//         type: 'history'
//       }
//     ],
//     condictions: [
//       {
//         field: 'subject',
//         flagOperatorOr: false,
//         ignoreCase: false,
//         operand: [
//           getIn18Text('SHENQING'),
//           getIn18Text('BAOXIAO'),
//           getIn18Text('SHENPI'),
//           getIn18Text('QINGJIA'),
//           getIn18Text('PIZHUN'),
//           getIn18Text('QINGQIU'),
//           getIn18Text('SHENLING'),
//           getIn18Text('QINGSHI')
//         ],
//         operator: 'contains'
//       },
//       {
//         field: 'accounts',
//         ignoreCase: true,
//         operator: '',
//         operand: optionsList
//       }
//     ],
//     continue: true,
//     disabled: false,
//     name: `sirius ${moment().format('YYYY-MM-DD HH:mm:ss')}`
//   },
//   工作汇报: {
//     actions: [
//       {
//         type: 'tags',
//         value: [getIn18Text('GONGZUOHUIBAO')] // 标签名称
//       },
//       // 对历史邮件生效
//       {
//         disabled: false,
//         type: 'history'
//       }
//     ],
//     condictions: [
//       {
//         field: 'subject',
//         flagOperatorOr: false,
//         ignoreCase: false,
//         operand: [
//           getIn18Text('RIBAO'),
//           getIn18Text('ZHOUBAO'),
//           getIn18Text('YUEBAO'),
//           getIn18Text('GONGZUOZONGJIE'),
//           getIn18Text('HUIBAO'),
//           getIn18Text('GONGZUOBAOGAO')
//         ],
//         operator: 'contains'
//       },
//       {
//         field: 'accounts',
//         ignoreCase: true,
//         operator: '',
//         operand: optionsList
//       }
//     ],
//     continue: true,
//     disabled: false,
//     name: `sirius ${moment().format('YYYY-MM-DD HH:mm:ss')}`
//   },
//   ToMe: {
//     actions: [
//       {
//         type: 'tags',
//         value: ['ToMe']
//       }
//       // 对历史邮件生效
//       // {
//       //   disabled: false,
//       //   type: 'history',
//       // }
//     ],
//     condictions: [
//       {
//         field: 'to',
//         flagOperatorOr: false,
//         ignoreCase: false,
//         operand: optionsList,
//         operator: 'contains'
//       },
//       {
//         field: 'accounts',
//         ignoreCase: true,
//         operator: '',
//         operand: optionsList
//       }
//     ],
//     continue: true,
//     disabled: false,
//     name: `sirius ${moment().format('YYYY-MM-DD HH:mm:ss')}`
//   }
// });
type RecommendTags = (typeof presetTags)[number][];
export const MailTag: React.FC<MailTagProps> = props => {
  const { activeName, disabled = false, scrollController, account } = props;
  // const [tagList, setTaglist] = useState<TagItemProp[]>([]);
  const mailTreeStateMap = useAppSelector(state => state.mailReducer.mailTreeStateMap);

  const tagList = useMemo(() => {
    const folderState = getTreeStatesByAccount(mailTreeStateMap, account || '');
    if (folderState && folderState?.mailTagList) {
      return folderState?.mailTagList;
    }
    return [];
  }, [mailTreeStateMap, account]);

  // const [refresh, setRefresh] = useState(0); // 控制位置刷新，用来控制位置更新，不直接控制是否隐藏
  // const [loading, setLoading] = useState(false); // 按钮loading
  // const [isFirst, setIsFirst] = useState(false);
  // 是否展示新手引导。只控制是否隐藏，位置可能不对
  // const [guideEnable, setGuideEnable] = useState<boolean>(false);
  // const tagsRef = useRef<(typeof presetTags)[number][]>([]);
  // const optionsList = (systemApi.getCurrentUser()?.prop?.accountAlias || []) as string[];
  // const { doNextStep } = useActions(HollowOutGuideAction);

  // useEffect(() => {
  //   if ((tagList && tagList.length, !isFirst)) {
  //     setIsFirst(true); // 只有第一次需要check提示
  //   }
  // }, [tagList]);

  // 标签提示
  // const hollowOutGuideRef = useRef<any>(null);
  // 默认推荐tag
  // const [recommendTags, setRecommendTags] = useState<RecommendTags>([]);
  // useEffect(() => {
  //   setRecommendTags(changeRecommendTags(tagList));
  // }, [tagList]);
  // const changeRecommendTags = (tagList: TagItemProp[]): RecommendTags => {
  //   try {
  //     return presetTags.filter(tag => tagList.findIndex(item => item[0].replace(/[\-,\_]/, '').toLowerCase() === tag.toLowerCase()) === -1);
  //   } catch (e) {
  //     console.error('[Error reg]', e);
  //     return [];
  //   }
  // };
  // 是否展示引导
  // const handleGuideShow = () => {
  //   // todo 顺序和时机
  //   const result = storeApi.getSync('int_box_tip_op_key');
  //   if (result.suc && result.data === 'true') { // 新手引导已关闭，直接显示
  //     setShowGuide();
  //   }
  // };
  /**
   * 1. 在所有新手引导之后。新手引导 key: int_box_tip_op_key。done
   * 2. 升级一天后
   * 3. 三个标签全部有，不能出现 done
   * 4. 关闭后不能出现
   */
  // const setShowGuide = () => {
  //   hollowOutGuideRef.current?.hideSelf(); // 先关闭
  //   const result = storeApi.getSync(TAG_GUIDE);
  //   if (result.suc && result.data === 'true') {
  //     return;
  //   }
  //   if (tagsRef.current.length > 0) { // 事件绑定有闭包问题，需要用ref解决
  //     hollowOutGuideRef.current?.showSelf();
  //   } else { // 无推荐
  //     closeGuide();
  //   }
  // };
  // useEffect(() => {
  //   setCurrentAccount();
  //   // mailManagerApi.requestTaglist();
  //   // dispatch(Thunks.requestTaglist({}));

  //   // 监听自定义事件 // !注意：有闭包问题，需要用ref获取最新值
  //   // document.addEventListener('guideClosed', setShowGuide);
  //   // return () => {
  //   //   // 解除绑定
  //   //   document.removeEventListener('guideClosed', setShowGuide);
  //   // };
  //   // setShowGuide();
  // }, []);
  // const setGuideShow = (recommendTags: RecommendTags) => {
  //   setCurrentAccount();
  //   const result = storeApi.getSync(TAG_GUIDE);
  //   if (result.suc && result.data === 'true') {
  //     setGuideEnable(false);
  //   } else if (recommendTags.length > 0 && isShowGuide()) {
  //     setTimeout(() => {
  //       setGuideEnable(true);
  //       setRefresh(refresh + 1); // 重新计算位置
  //     }, 1000);
  //   } else {
  //     setGuideEnable(false);
  //   }
  //   if (recommendTags.length === 0) {
  //     setCurrentAccount();
  //     storeApi.putSync(TAG_GUIDE, 'true');
  //   }
  // };
  // useMsgCallback('settingShow', e => {
  //   const {
  //     eventData: { activeKey }
  //   } = e;
  //   if (activeKey === 'mailbox') {
  //     // 切换了tab
  //     setGuideShow(changeRecommendTags(tagList));
  //   }
  // });
  // useEffect(() => {
  //   if (isFirst) {
  //     setGuideShow(recommendTags);
  //   }
  // }, [recommendTags, isFirst]);
  const [addTagModalVisible, setAddTagModalVisible] = useState(false);
  // 关闭提示，需要记录状态
  // const closeGuide = () => {
  //   // storeApi.putSync(TAG_GUIDE, 'true');
  //   // setGuideEnable(false);
  //   doNextStep({ step: 1, guideId: TAG_GUIDE });
  //   setGuideEnable(false);
  //   setRefresh(1);
  //   // hollowOutGuideRef.current?.hideSelf();
  // };
  // 这个问题要根据业务评估 有可能会有问题
  // useEffect(()=>{
  //   if(!inWindow() || !document.querySelector('#custom-mail-tag')){
  //     return ()=>{}
  //   }

  //   const mailTagDom=document.querySelector('#custom-mail-tag')

  //   const resizeObserverInstance=new ResizeObserver(debounce((entries)=>{
  //     const entry=entries.find((item:ResizeObserverEntry[])=>{
  //       return item.target.id.startsWith('custom-mail-tag')
  //     })

  //     if(!entry){
  //       return
  //     }

  //     const {top,left}=entry!.contentRect;
  //     setRefresh(top+left)
  //   },100))

  //   mailTagDom && resizeObserverInstance.observe(mailTagDom!)

  //   return ()=>{
  //     mailTagDom && resizeObserverInstance.unobserve(mailTagDom)
  //     resizeObserverInstance.disconnect()
  //   }

  // //   let node = inWindow() ? document.querySelector('#custom-mail-tag') : null;
  // // if (node != null) {
  // //   const { top, left } = node.getBoundingClientRect();
  // //   if (top + left !== refresh) {
  // //     setRefresh(top + left); // 位置更新
  // //   }
  // // }
  // },[])

  // todo 该功能未上线，此处注释
  // useEffect(() => {
  //   if (guideEnable && scrollController != null && refresh !== 0) {
  //     scrollController(10000);
  //     setRefresh(0);
  //   }
  // }, [refresh, guideEnable]);
  // 2023-05-18By郭超 1.21版本之后不再自动创建标签
  // const handlePresetTag = async () => {
  //   const tagParams = recommendTags.map(tag => {
  //     const color = GLOBAL_TAG_COLOR.count;
  //     GLOBAL_TAG_COLOR.setNext(color);
  //     return [
  //       tag,
  //       {
  //         color
  //       }
  //     ];
  //   });
  //   setLoading(true);
  //   try {
  //     const res = await mailManagerApi.manageTag('add', tagParams, '');
  //     setLoading(false);
  //     void addRule();
  //   } catch (ex) {
  //     setLoading(false);
  //     console.log(ex);
  //     message.error(lodashGet(ex, 'message', getIn18Text('QIYONGSHIBAI\uFF0C')));
  //   }
  // };
  // 添加规则
  // const addRule = async () => {
  //   const params = recommendTags.map(tag => getPresetTagsParams(optionsList)[tag]);
  //   try {
  //     const { data } = await mailManagerApi.addMailClassifyRule(params);
  //     let tomeIndex = recommendTags.findIndex(tag => tag === 'ToMe'); // tome 不能对历史生效
  //     const runRuleIds = (data as number[]).filter((tag, index) => index !== tomeIndex);
  //     void runRule(runRuleIds);
  //     // 成功之后记录状态
  //     closeGuide();
  //   } catch (err) {
  //     message.error(lodashGet(err, 'message', getIn18Text('QIYONGSHIBAI\uFF0C')));
  //   }
  // };
  // 启用规则
  // const runRule = async (data: number[]) => {
  //   try {
  //     setCurrentAccount();
  //     const { success, title } = await mailConfApi.effectHistoryMail(0, data);
  //     if (!success) {
  //       return message.error(title || (getIn18Text('QIYONGSHIBAI\uFF0C')));
  //     }
  //     recommendTags.length < 3 && message.success(getIn18Text('QIYONGCHENGGONG!')); // 有tag才需要提示启用成功
  //   } catch (err) {
  //     message.error(lodashGet(err, 'message', getIn18Text('QIYONGSHIBAI\uFF0C')));
  //   }
  // };
  return (
    <div
      className={realStyle('mailTagWrapper', {
        mailTagDisabled: disabled,
        // showGuidePopover: guideEnable
      })}
    >
      <Collapse
        bordered={false}
        expandIcon={({ isActive }) => (
          <span className="dark-svg-invert" style={{ width: '8px' }}>
            {isActive ? <CaretDownOutlined /> : <CaretRightOutlined />}
          </span>
        )}
      >
        <Panel
          key={1}
          header={
            <div className={realStyle('title')} data-test-id="mail-tag-panel">
              {/* <HollowOutGuide
                guideId={TAG_GUIDE}
                title={`${recommendTags.length < 3
                  ? getIn18Text('XITONGWEINITUI')
                  : getIn18Text('XITONGWEINIYU')
                  }智能标记你的邮件，轻松分类`}
                refresh={refresh}
                placement="topLeft"
                intro={
                  <div className={realStyle('contentWrapper')}>
                    <div className={realStyle('tagWrapper')}>
                      {recommendTags.map(tag => (
                        <div key={tag} className={realStyle('contentTagItem')}>
                          <img src={MailTagContentIcon} alt="" />
                          <div>{tag}</div>
                        </div>
                      ))}
                    </div>
                    <div className={realStyle('infoWrapper')}>{getIn18Text('NIKEZAI\u300CGE')}</div>
                  </div>
                }
                renderFooter={
                  <div className={realStyle('footerWrapper')}>
                    {recommendTags.length < 3 && (
                      <Button
                        disabled={loading}
                        onClick={() => {
                          closeGuide();
                        }}
                        className={realStyle('textButton')}
                        type="link"
                      >
                        {getIn18Text('BULE\uFF0CXIEXIE')}
                      </Button>
                    )}
                    <Button loading={loading} onClick={handlePresetTag} className={realStyle('startButton')}>
                      {recommendTags.length < 3
                        ? getIn18Text('LIJIQIYONG')
                        : getIn18Text('ZHIDAOLE')}
                    </Button>
                  </div>
                }
                enable={guideEnable} // !由于后端没上线，导致不能跟随v12版本上线
              >*/}
              <div
                style={{
                  boxSizing: 'border-box',
                  padding: '0px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                id="custom-mail-tag"
              >
                <MailTagIcon strokeColor={'#7d8085'} />
                <span style={{ marginLeft: '11px' }}>{getIn18Text('BIAOQIAN')}</span>
                <TagGuide>
                  <Badge intro={getIn18Text('XINGOGNNENG')} style={{ marginLeft: 10 }} onClick={e => e.stopPropagation()} />
                </TagGuide>
              </div>
              {/*  </HollowOutGuide> */}
              <Tooltip title={getIn18Text('XINJIANBIAOQIAN')} trigger={['hover']}>
                <span
                  data-test-id="mail-tag-add-btn"
                  className={realStyle('titleAddBtn')}
                  onClick={e => {
                    e.stopPropagation();
                    !disabled && setAddTagModalVisible(true);
                  }}
                >
                  <AddTagIcon />
                </span>
              </Tooltip>
            </div>
          }
        >
          {/* 预置标签 */}
          {
            // useMemo(() => (
            //   <HollowOutGuide
            //     guides={[{
            //       id: 'custom-mail-tag',
            //       title: '系统为你推荐以下常用标签，智能标记你的邮件，轻松分类',
            //       intro: '',
            //     }]}
            //     ref={hollowOutGuideRef}
            //     refresh={refresh}
            //     placement="right"
            //     renderContent={
            //       <div className={realStyle('contentWrapper')}>
            //         <div className={realStyle('tagWrapper')}>
            //           {
            //             recommendTags.map(tag => (
            //               <div key={tag} className={realStyle('contentTagItem')}>
            //                 <img src={MailTagContentIcon} alt="" />
            //                 <div>{tag}</div>
            //               </div>
            //             ))
            //           }
            //         </div>
            //         <div className={realStyle('infoWrapper')}>
            //           你可在「个人中心-邮箱设置-来信分类」中管理你的邮件自动分类规则
            //         </div>
            //       </div>
            //     }
            //     renderFooter={
            //       <div className={realStyle('footerWrapper')}>
            //         {
            //           tagList.length > 0
            //           &&
            //           <Button disabled={loading} onClick={() => {
            //             closeGuide();
            //           }} className={realStyle('textButton')} type="link">不了，谢谢</Button>
            //         }
            //         <Button loading={loading} onClick={handlePresetTag} className={realStyle('startButton')}>
            //           {
            //             tagList.length > 0 ? '立即启用' : '知道了'
            //           }
            //         </Button>
            //       </div>
            //     }
            //   />
            // ), [refresh, loading])
          }

          {tagList.map((item, idx) => {
            // const otherTagList = cloneDeep(tagList);
            // otherTagList.splice(idx, 1);
            return <Item disabled={disabled} account={account} data={item} key={item[0]} activeName={activeName?.key || ''} tagList={tagList} />;
          })}

          {tagList.length === 0 && (
            <div className={realStyle('emptyTip')}>
              {getIn18Text('WEIYOUJIANDASHANG')}
              <div
                className={realStyle('createEntry')}
                onClick={() => {
                  !disabled && setAddTagModalVisible(true);
                }}
              >
                {getIn18Text('XINJIANBIAOQIAN')}
              </div>
            </div>
          )}
        </Panel>
      </Collapse>
      {/* 添加弹窗 */}
      {addTagModalVisible && (
        <TagModal
          account={account}
          type="add"
          data={[]}
          afterClose={() => {
            setAddTagModalVisible(false);
          }}
        />
      )}
    </div>
  );
};
