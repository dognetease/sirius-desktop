/*
 * @Author: your name
 * @Date: 2022-03-21 16:04:10
 * @LastEditTime: 2022-03-24 15:16:01
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web-setting/src/Mail/components/CustomMailClassify/ClassifyList/ClassifyList.tsx
 */
import React, { useState, useEffect } from 'react';
import { Button, Modal, Spin } from 'antd';
import { MailConfApi, apis, apiHolder as api, ResponseMailClassify, MailApi, MailBoxModel, ContactApi, OrgApi } from 'api';
import classnames from 'classnames';
import { MailActions, useActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { MailClassifyActions } from '@web-common/state/reducer';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import ClassifyItem from './ClassifyItem';

import listStyle from './classifyList.module.scss';
import MoveList from './MoveList';
import AccountSelect from './AccountSelect';
import { getIn18Text } from 'api';

const MailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const contactApi = api.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
interface Props {
  editRule: (initRule: ResponseMailClassify) => void;
  mailBoxs: MailBoxModel[];
  setListShow?: (show: boolean) => void;
  isFirst?: boolean;
}
const ClassifyList: React.FC<Props> = ({ editRule, mailBoxs, setListShow, isFirst }) => {
  const [dataList, setDataList] = useState<ResponseMailClassify[]>([]);
  const [orgList, setOrgList] = useState<ResponseMailClassify[]>([]);
  // const { doUpdateMailTagList, doMailEditShow } = useActions(MailActions);
  const [visibleDelete, setVisibleDelete] = useState(false);
  const [spinning, setSpinning] = useState(true);
  const [emailContactMap, setEmailContactMap] = useState<{
    [key: string]: string;
  }>({});
  const [selectedAccount, setSelectedAccount] = useState<string[]>([]);
  const { setIsClassifyList } = useActions(MailClassifyActions);
  const { mailFolderId, mailTag } = useAppSelector(state => state.mailClassifyReducer);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const res: ResponseMailClassify[] = [];
    orgList.forEach(item => {
      const { condictions } = item;
      const accounts = condictions?.find(i => i.field === 'accounts');
      if (accounts && selectedAccount.every(selectA => accounts.operand.includes(selectA)) && selectedAccount.length) {
        res.push(item);
      }
    });
    setDataList(res);
  }, [selectedAccount]);
  const getEmailNameMap = (DeepRes: ResponseMailClassify[]) => {
    const contact = DeepRes.reduce((prev: string[], next) => {
      // 初始化 selectedAccount
      if (!selectedAccount.length) {
        const accounts = next.condictions?.find(i => i.field === 'accounts');
        accounts && setSelectedAccount([accounts.operand[0]]);
      }
      let res: string[] = [];
      const condictions = next.condictions?.reduce((cpre: string[], cnwxt) => {
        const { operand } = cnwxt;
        return [...cpre, ...operand];
      }, []);
      const actions = next.actions?.find(i => i.type === 'forward')?.target;
      if (condictions) res = res.concat(condictions);
      if (actions) res.push(actions);
      return [...res, ...prev];
    }, []);
    const reg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    const emailContact = contact.filter(item => reg.test(item));
    contactApi.doGetContactByItem({ type: 'EMAIL', value: emailContact }).then(item => {
      const itemMap: {
        [key: string]: string;
      } = {};
      item.forEach(i => {
        itemMap[i.contact.accountName] = i.contact.contactName;
      });
      setEmailContactMap(itemMap);
    });
  };
  const getListData = () => {
    MailConfApi.getMailClassifyRule().then(res => {
      if (Array.isArray(res)) {
        // 文件夹/标签入口进入，过滤出相关的规则列表
        const folderRelateRules = mailFolderId ? res.filter(item => (item?.actions || []).some(itm => itm?.type === 'move' && itm?.target === mailFolderId)) : [];
        const tagRelateRules = mailTag
          ? res.filter(item => (item?.actions || []).some(itm => itm?.type === 'tags' && Array.isArray(itm?.value) && itm.value.includes(mailTag)))
          : [];
        if (isFirst && setListShow) {
          // 有列表结果展示列表，无结果则展示新建
          setListShow(mailFolderId ? folderRelateRules.length > 0 : mailTag ? tagRelateRules.length > 0 : res.length > 0);
        }
        let DeepRes = mailFolderId ? [...folderRelateRules] : [...res];
        DeepRes = mailTag ? [...tagRelateRules] : DeepRes;
        setDataList(DeepRes.slice(0).reverse());
        setOrgList(DeepRes.slice(0).reverse());
        getEmailNameMap(DeepRes.length ? DeepRes : [...res]);
        setSpinning(false);
      }
    });
  };
  useEffect(
    () => () => {
      setDataList([]);
      setOrgList([]);
    },
    []
  );
  useEffect(() => {
    getListData();
    dispatch(Thunks.requestTaglist({}));
  }, []);
  const deleteClassifyItem = item => {
    if (!item) return;
    return new Promise(resolve => {
      MailConfApi.deleteMailClassifyRule([item.id]).then(res => {
        getListData();
        setVisibleDelete(false);
        resolve(res);
      });
    });
  };
  const getEmptyText = () => {
    if (selectedAccount.length <= 0) {
      return getIn18Text('XUANZESHIYONGZHANG');
    }
    if (mailFolderId) {
      return '该文件夹暂无分类规则';
    }
    if (mailTag) {
      return '该标签暂无分类规则';
    }
    return getIn18Text('GAIZHANGHAOXIAWU');
  };
  return (
    <>
      <AccountSelect selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount} />
      {dataList.length ? (
        <div>
          <MoveList
            dataList={dataList}
            setDataList={setDataList}
            renderItem={(item: ResponseMailClassify, index: number) => (
              <ClassifyItem
                key={item.id}
                data={item}
                emailContactMap={emailContactMap}
                id={item.id}
                deleteClassifyItem={() => {
                  deleteClassifyItem(item);
                }}
                editRule={editRule}
                getListData={getListData}
                mailBoxs={mailBoxs}
              />
            )}
          />
        </div>
      ) : (
        <Spin spinning={spinning} wrapperClassName={classnames(listStyle.spinning)}>
          <div className={classnames(listStyle.empty)}>
            <div className="sirius-empty" />
            <div style={{ marginTop: 20 }}>{getEmptyText()}</div>
          </div>
        </Spin>
      )}
    </>
  );
};
export default ClassifyList;
