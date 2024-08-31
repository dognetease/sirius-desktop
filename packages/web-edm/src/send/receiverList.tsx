import { EdmSendConcatInfo } from 'api';
import { Tooltip, Input } from 'antd';
// import Cascader from '@web-common/components/UI/Cascader';
import Cascader from '@lingxi-common-component/sirius-ui/Cascader';
import classnames from 'classnames';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import List from 'react-virtualized/dist/es/List';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import CloseIcon from '@web-common/components/UI/Icons/svgs/ClosePreview';
// import { QuestionCircleOutlined } from "@ant-design/icons";
import { ReactComponent as CheckedValidIcon } from '@/images/checked-valid-icon.svg';
// import style from './write.module.scss';
import style from './ReceiverSettingDrawer/receiver.module.scss';
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { apiHolder, apis, EdmSendBoxApi } from 'api';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import { OverflowShowTooltips } from '../components/OverflowShowTooltips';

import { MailInput } from '../components/mailInput';

import { errorContactStatusList, warningContactStatusList } from './validEmailAddress/util';
import { getIn18Text } from 'api';

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

// todo 超长显示tooltips
const RenderItem = ({ receiver: r, onRemove, onValid, draftId, filterType }: any) => {
  const reset = useContext(ResetContext);
  const [before, setBefore] = useState(r.originContactEmail || r.contactEmail);
  const [email, setEmail] = useState(r.originContactEmail || r.contactEmail);

  useEffect(() => {
    setBefore(r.originContactEmail || r.contactEmail);
    setEmail(r.originContactEmail || r.contactEmail);
    console.log([], r);
  }, [r.contactEmail]);

  let status = null;
  const errorStatus = errorContactStatusList.find(item => item.value === r.contactStatus);
  if (errorStatus) {
    status = <span className={classnames([style.statusText, style.statusError])}>{errorStatus.label}</span>;
  }
  if (filterType !== 'normal') {
    const warningStatus = warningContactStatusList.find(item => item.value === r.contactStatus);
    if (warningStatus) {
      status = <span className={classnames([style.statusText, style.statusWarning])}>{warningStatus.label}</span>;
    }
  }

  const handleBlur = (r: ReceiversListInfo, tempEmail?: string) => {
    const curEmail = tempEmail ?? email;
    if (curEmail === '') {
      toast.warn(getIn18Text('YOUXIANGBUNENGWEIKONG'));
      setEmail(r.originContactEmail || r.contactEmail);

      return;
    }
    setBefore(curEmail);

    edmApi
      .getContactsStatusV2({
        contacts: [
          {
            email: curEmail,
          },
        ],
        draftId: draftId as string,
      })
      .then(res => {
        let contactStatus = res.contactInfoList[0].contactStatus;
        if (curEmail !== r.originContactEmail) {
          if (tempEmail != null) {
            onValid(
              {
                ...r,
                contactStatus,
                contactEmail: curEmail,
              },
              'input-edit',
              // before
              r.originContactEmail || r.contactEmail
            );
          } else {
            onValid(
              {
                ...r,
                contactStatus,
                contactEmail: curEmail,
              },
              'edit',
              // before
              r.originContactEmail || r.contactEmail
            );
          }
          reset();
        }
      })
      .catch(err => {
        toast.error(getIn18Text('XIUGAISHIBAI'));
      });
  };
  const handleEditMail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <div className={`${style.receiverItem} ${style['receiverStatus' + r.contactStatus]}`} key={r.contactEmail}>
      <span className={style.receiverAvatarWrap}>
        <AvatarTag
          size={32}
          user={{
            avatar: r.contactIcon,
            name: r.originContactName || r.originContactEmail || r.contactName || r.contactEmail,
            email: r.originContactEmail || r.contactEmail,
          }}
          className={style.receiverAvatar}
        />
        {r.contactStatus === 2 && (
          <Tooltip placement="top" title={getIn18Text('ZENGTUIDING\uFF0CWUFAFASONG')}>
            <i className={style.receiverTip} />
          </Tooltip>
        )}
      </span>
      <div className={classnames([style.receiverContactWrap, { [style.singleLine]: !r.contactName }])}>
        {!!r.contactName && (
          <>
            {/* <Tooltip title={r.originContactName || r.contactName} placement="topLeft">
                    <span className={style.mainText} dangerouslySetInnerHTML={{
                    __html:r.contactName
                }}></span> 
                </Tooltip> */}
            <OverflowShowTooltips
              style={{
                width: 228,
              }}
              value={r.originContactName || r.contactName}
              childText={r.contactName}
              className={style.mainText}
            />
            {/* <Tooltip title={r.originContactEmail || r.contactEmail} placement="topLeft">
                    <div className={r.contactStatus === 3 ?style.emailEdit:style.emailNormal}>
                        <span className={style.subText} dangerouslySetInnerHTML={{
                        __html:r.contactEmail
                        }}></span>
                        <Input className={style.edit} 
                            onBlur={(e)=>{handleBlur(r)}} 
                            onChange={(e)=>{handleEditMail(e)}} 
                            value={email} 
                            placeholder="" 
                        />
                    </div>

                </Tooltip> */}
            <div className={r.contactStatus === 3 ? style.emailEdit : style.emailNormal}>
              <MailInput needInput={r.contactStatus === 3} defaultValue={email} valueChange={value => handleBlur(r, value)} displayClassName={style.displayText} />
            </div>
          </>
        )}
        {!r.contactName && (
          <div className={r.contactStatus === 3 ? style.emailEdit : style.emailNormal}>
            {/* <span className={style.mainText} dangerouslySetInnerHTML={{
                        __html:r.contactEmail
                    }}></span> */}
            {/* todo UI操作优化 */}
            {/* <Input style={{
                        background: 'blue'
                    }} className={style.editOnline} 
                        onBlur={(e)=>{handleBlur(r)}} 
                        onChange={(e)=>{handleEditMail(e)}} 
                        value={email} 
                        placeholder="" 
                    /> */}
            <MailInput needInput={r.contactStatus === 3} defaultValue={email} valueChange={value => handleBlur(r, value)} />
          </div>
        )}
      </div>
      {status && (
        <div className={style.status}>
          {status}
          {r.contactStatus === 1.5 && (
            <Tooltip title={getIn18Text('SHEWEIYOUXIAO')} placement="bottom">
              <span
                className={style.setValid}
                onClick={() => {
                  reset();
                  onValid(r);
                }}
              >
                <CheckedValidIcon />
              </span>
            </Tooltip>
          )}
        </div>
      )}
      <div
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => {
          onRemove(r.originContactEmail || r.contactEmail, r.contactStatus);
        }}
      >
        <CloseIcon />
      </div>
    </div>
  );
};

const VirtualReceiverList = ({ height, receivers, onRemove, onValid, scrollingPlaceholder, draftId, filterType }: VirtualProps) => {
  const rowRender = ({ index, isScrolling, key, style }: any) => {
    if (isScrolling && scrollingPlaceholder) {
      return (
        <div key={key} style={style}>
          {scrollingPlaceholder}
        </div>
      );
    }
    // return <div style={style} key={key}>{renderItem({ receiver: receivers[index], onRemove, onValid})}</div>
    return (
      <div style={style} key={key}>
        <RenderItem receiver={receivers[index]} draftId={draftId} onRemove={onRemove} onValid={onValid} filterType={filterType} />
      </div>
    );
  };
  return (
    <AutoSizer disableHeight>
      {({ width }) => <List className={style.receiverList} width={width} height={height} rowCount={receivers.length} rowHeight={48} rowRenderer={rowRender} />}
    </AutoSizer>
  );
};

const RealReceiverList = ({ height, receivers, onRemove, onValid, draftId, filterType }: Props) => {
  return (
    <div className={style.receiverList} style={{ height }}>
      {receivers.map(r => (
        <RenderItem receiver={r} draftId={draftId} onRemove={onRemove} onValid={onValid} filterType={filterType} />
      ))}
    </div>
  );
};

interface HandleChange {
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDomainSearchChange?: (domains: string[]) => void;
  val: string;
  kv: Record<string, any[]>;
  mode: SearchMode;
  handleModeChange?: (mode: SearchMode) => void;
}

export type SearchMode = 'normal' | 'byDomain';

interface Props {
  height: number;
  receivers: EdmSendConcatInfo[];
  onRemove: (email: string, contactStatus: number) => void;
  onValid: (r: any) => void;
  draftId?: string;
  showSecondryAddNoti?: boolean;
  filterType: 'normal' | 'filter';
  searchMode: SearchMode;
}

interface VirtualProps extends Props {
  scrollingPlaceholder?: string;
}

interface ReceiversListInfo extends EdmSendConcatInfo {
  originContactEmail: string;
  originContactName: string;
}

const Filter = ({ handleChange, handleDomainSearchChange, handleModeChange, val, kv, mode }: HandleChange) => {
  const [cMode, setCMode] = useState<SearchMode>(mode);
  const [domains, setDomains] = useState<string[]>([]);

  useEffect(() => {
    setDomains([]);
  }, [cMode]);

  useEffect(() => {
    // 只有清空的情况下, 才把搜索条件也置空
    if (Object.keys(kv).length === 0) {
      setDomains([]);
    }
  }, [kv]);

  if (cMode === 'normal') {
    return (
      <div className={style.filterRoot}>
        <Input
          value={val}
          className={style.search}
          prefix={<SearchOutlined />}
          onChange={handleChange}
          placeholder={getIn18Text('QINGSHURUYOUXIANGDEZHIHUOLIANXIRENXINGMING')}
          allowClear
        />
        <div
          className={style.filterIconNormal}
          onClick={() => {
            setCMode('byDomain');
            handleModeChange && handleModeChange('byDomain');
          }}
        />
      </div>
    );
  }
  if (cMode === 'byDomain') {
    let option = Object.keys(kv).map(i => {
      return {
        label: (
          <div>
            {i}（{kv[i].length > 99 ? '99+' : kv[i].length}）
          </div>
        ),
        value: i,
      };
    });
    return (
      <div className={style.filterRoot}>
        <div
          className={style.filterIconByDomain}
          onClick={() => {
            setCMode('normal');
            handleModeChange && handleModeChange('normal');
          }}
        />
        <Cascader
          className={style.placeholderLight}
          showSearch
          value={domains}
          getPopupContainer={node => node.parentNode}
          showCheckedStrategy="SHOW_CHILD"
          allowClear
          popupClassName={style.caDropdown}
          multiple
          maxTagCount="responsive"
          placeholder={<div className={style.placeholder}>{'请选择域名'}</div>}
          onChange={val => {
            setDomains(val);
            handleDomainSearchChange && handleDomainSearchChange(val);
          }}
          options={option}
        />
      </div>
    );
  }
  return null;
};
const ResetContext = React.createContext(() => {});

export const ReceiverList = ({ height, receivers, onRemove, onValid, draftId, showSecondryAddNoti, filterType, searchMode }: Props) => {
  const [list, setList] = useState<ReceiversListInfo[]>([]);
  const [val, setVal] = useState('');
  const [domainKV, setDomainKV] = useState<Record<string, any[]>>({});
  const [searchDomains, setSearchDomains] = useState<string[]>([]);
  const [curSearchMode, setCurSearchMode] = useState(searchMode);

  useEffect(() => {
    setCurSearchMode(searchMode);
  }, [searchMode]);

  useEffect(() => {
    setList(
      receivers.map(e => ({
        ...e,
        originContactEmail: e.contactEmail,
        originContactName: e.contactName,
      }))
    );
    if (curSearchMode === 'normal' && val.length > 0) {
      handleSearch(val);
    }

    let recvs = receivers;
    if (recvs.length > 0) {
      let kv: Record<string, any[]> = {};
      recvs.forEach(i => {
        let domain = i.contactEmail?.split('@')[1] || '';
        if (domain.length > 0) {
          let valueMap = kv[domain] || [];
          valueMap.push(i);
          kv[domain] = valueMap;
        }
      });
      setDomainKV(kv);
      if (curSearchMode === 'byDomain') {
        handleDomainSearchChange(searchDomains, kv);
      }
    } else {
      setDomainKV({});
      setSearchDomains([]);
    }
  }, [receivers]);

  const handleSearch = useCallback(
    (word: string) => {
      const re = new RegExp(word);
      const res = receivers.reduce((prev, curr) => {
        if (curr.contactName?.includes(word) || curr.contactEmail?.includes(word)) {
          const e: ReceiversListInfo = {
            ...curr,
            originContactEmail: curr.contactEmail,
            originContactName: curr.contactName,
          };
          if (word.length > 0 && e.contactName.length > 0) {
            e.contactName = curr.contactName.replace(re, `<span style="color:#4C6AFF;">${word}</span>`);
          }
          if (word.length > 0) {
            e.contactEmail = curr.contactEmail.replace(re, `<span style="color:#4C6AFF;">${word}</span>`);
          }
          prev.push(e);
        }

        return prev;
      }, [] as ReceiversListInfo[]);
      setList(res);
    },
    [receivers, setList]
  );

  const handleDomainSearchChange = (domains: string[], kv?: Record<string, any[]>) => {
    let tempKv = kv ? kv : domainKV;
    setSearchDomains(domains);

    if (domains.length === 0) {
      setList(
        receivers.map(e => ({
          ...e,
          originContactEmail: e.contactEmail,
          originContactName: e.contactName,
        }))
      );
      return;
    }

    let domainEmails: any[] = [];
    Object.keys(tempKv).forEach(i => {
      if (domains.flat().includes(i)) {
        domainEmails = domainEmails.concat(tempKv[i]);
      }
    });
    setList(domainEmails);
  };

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const word = e.target.value;
      setVal(word);
      handleSearch(word);
    },
    [setVal, handleSearch]
  );

  const reset = () => {
    setVal('');
    handleSearch('');
  };

  return (
    <ResetContext.Provider value={reset}>
      <Filter
        val={val}
        handleModeChange={mode => {
          setCurSearchMode(mode);
          reset();
        }}
        handleDomainSearchChange={handleDomainSearchChange}
        handleChange={handleChange}
        kv={domainKV}
        mode={searchMode}
      ></Filter>
      {list.length > 1000 ? (
        <VirtualReceiverList
          draftId={draftId}
          height={height}
          receivers={list}
          onRemove={onRemove}
          onValid={onValid}
          scrollingPlaceholder={getIn18Text('GUNDONGZHONG...')}
          filterType={filterType}
        />
      ) : (
        <RealReceiverList draftId={draftId} height={height} receivers={list} onRemove={onRemove} onValid={onValid} filterType={filterType} />
      )}
    </ResetContext.Provider>
  );
};
