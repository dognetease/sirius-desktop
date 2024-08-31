import React, { useState, useEffect, useMemo } from 'react';
import Checkbox from 'antd/lib/checkbox/Checkbox';
import { apiHolder, MailConfApi, reDefinedColorList, apis, MailEntryModel, locationHelper } from 'api';
import message from '@web-common/components/UI/Message/SiriusMessage';
import '../MailTag.scss';
import { useAppSelector } from '@web-common/state/createStore';
import AddSvg from './icon/AddSvg';
import DeleteSvg from './icon/DeleteSvg';
import { MailTagIcon, TagCheckedIconInMenu } from '../../MailTagList/Icon';
import { setCurrentAccount, getTreeStatesByAccount } from '../../../util';
import { getIn18Text } from 'api';
import { MAIL_TAG_HOTKEY_LOCAL_KEY } from '@web-mail/common/constant';
import { getStateFromLocalStorage, formatHotKey, getHKFromLocalByAccount } from '@web-mail/util';
import { stringMap } from '@web-mail/types';

const eventApi = apiHolder.api.getEventApi();
enum TAG_STATUS {
  // 选中
  CHECKED = 'CHECKED',
  // 未选中
  NONE = 'NONE',
  // 半选
  INDETERMINATE = 'INDETERMINATE',
}
interface Props {
  mailList: MailEntryModel[];
  Close?: () => void;
  onChange?: () => void;
  account?: string;
}
const Menu: React.FC<Props> = props => {
  const { mailList, Close, onChange, account } = props;
  // const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
  // const mailTagList = useAppSelector(state => state.mailReducer.mailTagList);

  const mailTreeStateMap = useAppSelector(state => state.mailReducer.mailTreeStateMap);

  const mailTagList = useMemo(() => {
    const folderState = getTreeStatesByAccount(mailTreeStateMap, account || '');
    if (folderState && folderState?.mailTagList) {
      return folderState?.mailTagList;
    }
    return [];
  }, [mailTreeStateMap, account]);

  const { pathname } = window.location;
  // const getMailTagList = () => {
  //   // 往来邮件从session获取tag
  //   if (pathname.includes('readMailComb')) {
  //     const tagStr = sessionStorage.getItem('tags');
  //     if (!tagStr) return [];
  //     try {
  //       const tagArr = JSON.parse(tagStr);
  //       return Array.isArray(tagArr) ? tagArr : [];
  //     } catch (error) {
  //       return [];
  //     }
  //   }
  //   // 主页从reducer获取
  //   return mailTagListStore;
  // };
  const [tagStateMap, setTagStateMap] = useState({});
  // const mailTagList = useMemo(() => getMailTagList(), [mailTagListStore]);
  /**
   * 列表对比出 menu中checkbox的空，全选，半选状态
   */
  useEffect(() => {
    const map = {};
    if (mailTagList && mailTagList.length) {
      mailTagList.map(item => {
        map[item[0]] = TAG_STATUS.NONE;
      });
    }
    if (mailList && mailList.length) {
      const tagMap = {};
      const max = mailList.length;
      mailList?.forEach(item => {
        let tags = item?.tags || [];
        tags = Array.from(new Set(tags));
        tags?.forEach(tag => {
          tagMap[tag] ? (tagMap[tag] += 1) : (tagMap[tag] = 1);
        });
      });
      for (const [key, value] of Object.entries(tagMap)) {
        map[key] = value === max ? TAG_STATUS.CHECKED : TAG_STATUS.INDETERMINATE;
      }
    }
    setTagStateMap(map);
  }, [mailList, mailTagList]);
  /** 非主窗口同步标签列表 */
  // useEffect(() => {
  //   if (locationHelper.isMainPage()) return;
  //   setCurrentAccount();
  //   // mailConfApi?.requestTaglist();
  // }, []);
  const handleChange = params => {
    onChange && onChange(params);
  };
  // 展开列表中包含聚合邮件的项
  const getAllMialList = list => {
    // const res = {};
    // list.forEach(item => {
    //   const {
    //     entry: {
    //       id,
    //       threadMessageCount,
    //       threadMessageIds,
    //     },
    //     isThread
    //   } = item;
    //   if (id) {
    //     // if (threadMessageCount > 1) {
    //     // if (isThread) {
    //     //   threadMessageIds.forEach(_ => {
    //     //     !res[_] && (res[_] = { id, entry: { id: _ } });
    //     //   });
    //     // } else if (!res[id]) {
    //     //   res[id] = item;
    //     // }
    //     res[id] = item;
    //   }
    // });
    // return [...Object.values(res)];
    const res: string[] = [];
    list.forEach(_ => {
      res.push(_.entry.id);
    });
    return res;
  };
  const handleCheckboxChange = (checked, tagName, tagId?: string) => {
    const map = { ...tagStateMap };
    if (checked) {
      message.loading({ content: getIn18Text('BIAOJIZHONG'), duration: 35, key: tagName });
      eventApi.sendSysEvent({
        eventName: 'mailTagChanged',
        eventData: {
          tagNames: [tagName],
          mailList: mailList.map(_ => _.entry.id),
          tagIds: [tagId],
        },
        eventStrData: 'tag',
        _account: account,
      });
      map[tagName] = 1;
      handleChange({
        eventName: 'mailTagChanged',
        eventStrData: 'tag',
        _account: account,
      });
    } else {
      message.loading({ content: getIn18Text('QUXIAOBIAOJIZHONG'), duration: 35, key: tagName });
      eventApi.sendSysEvent({
        eventName: 'mailTagChanged',
        eventData: {
          tagNames: [tagName],
          mailList: mailList.map(_ => _.entry.id),
          tagIds: [tagId],
        },
        eventStrData: 'untag',
        _account: account,
      });
      map[tagName] = 0;
      handleChange({
        eventName: 'mailTagChanged',
        eventStrData: 'untag',
        _account: account,
      });
    }
    setTagStateMap(map);
    handleClose();
  };
  const handleClearAllTag = () => {
    const tagNames: string[] = mailTagList.filter(item => [TAG_STATUS.CHECKED, TAG_STATUS.INDETERMINATE].includes(tagStateMap[item[0]])).map(item => item[0]);
    if (tagNames.length <= 0) {
      return;
    }
    // status === TAG_STATUS.CHECKED
    const key = tagNames.join(',');
    message.loading({ content: getIn18Text('BIAOJIQINGCHUZHONG'), duration: 35, key });
    eventApi.sendSysEvent({
      eventName: 'mailTagChanged',
      eventData: {
        tagNames,
        mailList: mailList.map(_ => _.entry.id),
        successMsg: getIn18Text('QINGKONGYIYOUBIAO11'),
        failMsg: getIn18Text('QINGKONGYIYOUBIAO'),
      },
      eventStrData: 'untag',
      _account: account,
    });
    handleChange({
      eventName: 'mailTagChanged',
      eventStrData: 'clearAllTag',
      _account: account,
    });
    handleClose();
  };
  const handleAddTag = () => {
    // 发送新建消息打开新建弹窗
    eventApi.sendSysEvent({
      eventName: 'mailMenuOper',
      eventData: {
        tagNames: [],
        mailList: mailList.map(_ => _.entry.id),
      },
      eventStrData: 'addTagAndMark',
      _account: account,
    });
    handleChange({
      eventName: 'mailTagChanged',
      eventStrData: 'addTag',
      _account: account,
    });
    handleClose();
  };
  const handleClose = () => {
    Close && Close();
  };
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);

  const [tag2HkMap, setTag2HkMap] = useState<{ [key: string]: string[] }>({});

  // 初始化读取本地存储的快捷键
  useEffect(() => {
    try {
      // 读取本地 tagname: [ctrl,shift,alt]
      const localHkMap: stringMap = getHKFromLocalByAccount(account);
      setTag2HkMap(localHkMap);
    } catch (e) {
      console.error('[error] mailtagHotKey error read local', e);
    }
  }, [mailList]);

  return (
    <div className="mt-footer-menu-wrap extheme">
      {mailTagList && mailTagList.length ? (
        <div className="mt-list">
          {mailTagList.map(item => {
            const status = tagStateMap[item[0]];
            const strokeColor = reDefinedColorList.find(innerItem => innerItem.nums.includes(item[1]?.color));
            const colorClassName = strokeColor?.className || 'color1';
            return (
              <div
                className="mt-item"
                onClick={e => {
                  e.stopPropagation();
                  const { tagId } = item[1];
                  handleCheckboxChange(status !== TAG_STATUS.CHECKED, item[0], tagId);
                }}
              >
                <div className="mt-oper-wrap">
                  {/* <Checkbox className={`checkbox ${colorClassName}`} indeterminate={status === TAG_STATUS.INDETERMINATE} checked={status === TAG_STATUS.CHECKED}> */}
                  <MailTagIcon className="tag-icon" strokeColor={strokeColor?.color} checked={status === TAG_STATUS.CHECKED} />
                  {/* </Checkbox> */}
                </div>
                <div className="mt-content-warp" title={item[0]}>
                  {item[0]}
                </div>
                {/* {status === TAG_STATUS.CHECKED && <TagCheckedIconInMenu strokeColor="#000" />} */}
                <div className="mt-content-hotkey">{tag2HkMap[item[0]] ? formatHotKey(tag2HkMap[item[0]]) : ''}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-none">{getIn18Text('ZANWUBIAOQIAN')}</div>
      )}
      <div className="mt-line" />
      <div className="mt-footer-btns">
        {!pathname.includes('readMailComb') && (
          <div className="mt-item" onClick={handleAddTag}>
            <div className="mt-oper-wrap">
              <AddSvg className="add-svg" />
            </div>
            <div className="mt-content-warp">{getIn18Text('XINJIANBIAOQIANBING')}</div>
          </div>
        )}
        {mailTagList && mailTagList.length ? (
          <div className="mt-item" onClick={handleClearAllTag}>
            <div className="mt-oper-wrap">
              <DeleteSvg className="delete-svg" />
            </div>
            <div className="mt-content-warp">{getIn18Text('QINGKONGYIYOUDE')}</div>
          </div>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};
export default Menu;
