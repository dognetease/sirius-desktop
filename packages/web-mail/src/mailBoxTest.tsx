import React, { useState } from 'react';
import { apiHolder as api, apis, EventApi, LoginApi, MailApi, MailBoxModel, MailConfApi, MailEntryModel, queryMailBoxParam } from 'api';
// import RecycleMailList from './testRecycleView/RecyclerMailList';
// import {SiriusPageProps} from '../model'
import { Spin } from 'antd';
import SideContentLayout from '@/layouts/Main/sideContentLayout';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
// import {
//     SHOW_WEB_WRITE_LETTER
// } from '../../../state/action'
// import listenWriteMail from "./components/listenWriteMail";
import { getIn18Text } from 'api';
const MailBoxTest: React.FC<any> = props => {
  const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
  const mailConfApi: MailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
  const eventApi: EventApi = api.api.getEventApi();
  const loginApi: LoginApi = api.api.requireLogicalApi(apis.loginApiImpl) as unknown as LoginApi;
  const fileInput = React.createRef<HTMLInputElement>();
  const [mailId, setMailId] = useState<string>('AEMA5QBpDj-qOuJ7*07mXqoX');
  const [contact, setContact] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [box, setBox] = useState<number>(1);
  const [search, setSearch] = useState<string>(getIn18Text('CESHI'));
  const [start, setStart] = useState<number>(0);
  const [count, setCount] = useState<number>(50);
  const [checked, setChecked] = useState<boolean>(true);
  const [mailList, setMailList] = useState<MailEntryModel[]>([]);
  const [boxList, setBoxList] = useState<MailBoxModel[]>([]);
  const [showRawList, setShowRawList] = useState<boolean>(false);
  // const [attach,setAttach] = useState(File)(undefined)
  const writeLatter = e => {
    e.stopPropagation();
    mailApi.doWriteMailToContact();
  };
  function logResult(res: any) {
    console.log(res);
    setContent(JSON.stringify(res));
  }
  const callGetFolder = () => {
    mailApi.doListMailBox().then(res => {
      setBoxList(res);
      logResult(res);
    });
  };
  const callGetList = () => {
    mailApi
      .doListMailBoxEntities({
        index: start,
        count,
        id: box || 1,
        startId: mailId,
      })
      .then(res => {
        logResult(res);
        setMailList(res as MailEntryModel[]);
      });
  };
  const callGetContent = () => {
    mailApi.doGetMailContent(mailId).then(res => {
      logResult(res);
    });
  };
  const callGetContentByIds = () => {
    mailApi.doListMailBoxEntities({ mids: mailId.split(','), count: 100 }).then(res => {
      logResult(res);
      setMailList(res as MailEntryModel[]);
    });
  };
  const callSave = () => {
    callSendMail('save');
  };
  const callSend = () => {
    callSendMail('send');
  };
  const callSendMail = (type: string) => {
    mailApi.initModel({ writeType: 'common' }).then((res: MailEntryModel) => {
      logResult(res);
      mailApi
        .getContractItemByEmail(contact.split(','), 'to')
        .then(re => {
          logResult(re);
          res.receiver = re;
          res.entry.content = {
            content,
            contentId: '',
          };
          res.entry.title = title;
          if (type === 'save') {
            mailApi.doSaveTemp({ content: res, saveDraft: true }).then();
          } else if (type === 'send') {
            mailApi.doSendMail(res).then();
          }
        })
        .catch(reason => {
          console.log(reason);
        });
    });
  };
  const callUpload = () => {
    console.log(fileInput);
    mailApi.initModel({ writeType: 'common', contact: contact.split(',') }).then((res: MailEntryModel) => {
      console.log('mail model:', res);
      if (fileInput == null) {
        return;
      }
      if (fileInput.current == null) {
        return;
      }
      if (fileInput.current.files == null) {
        return;
      }
      const file = fileInput?.current?.files[0];
      console.log('upload file:', file);
      if (file) {
        mailApi
          .doUploadAttachment({
            cid: res.cid || 0,
            _account: res._account || '',
            attach: file,
            uploader: {
              progressIndicator: num => {
                console.log(num);
              },
              operatorSet: () => {},
            },
          })
          .then(attachid => {
            console.log(attachid);
            // res.receiver = re;
            res.entry.content = {
              content: content + (checked ? `<img src="${attachid.fileUrl}"/>` : ''),
              contentId: '',
            };
            res.entry.title = title;
            mailApi.doSendMail(res).then();
          });
      }
    });
  };
  const callGetContact = () => {
    mailApi
      .getContractItemByEmail([contact], '')
      .then(res => {
        logResult(res);
      })
      .catch(reason => {
        console.log(reason);
      });
  };
  const callGetSignature = () => {
    mailConfApi.getUserSignature().then(res => {
      logResult(res);
    });
  };
  const getLogin = () => {
    if (fileInput && fileInput.current) {
      fileInput.current.addEventListener('change', ev => {
        console.log(ev);
      });
    }
  };
  const callMoveMail = () => {
    mailApi.doMoveMail(mailId.split(','), box).then(res => {
      console.log(res);
    });
  };
  const callMarkMail = () => {
    mailApi.doMarkMail(checked, mailId.split(','), 'redFlag').then(res => {
      console.log(res);
    });
  };
  const callDeleteMail = () => {
    mailApi.doDeleteMail({ fid: box, id: mailId.split(',') }).then(res => {
      console.log(res);
    });
  };
  const callReadUnread = () => {
    mailApi.doMarkMail(checked, mailId.split(','), 'read').then(res => {
      console.log(res);
    });
  };
  const callAllReadUnread = e => {
    console.log(e);
    mailApi.doMarkMailInfFolder(checked, box).then();
  };
  const callForward = e => {
    console.log(e);
    mailApi.doForwardMail(mailId);
  };
  const callReply = e => {
    console.log(e);
    mailApi.doReplayMail(mailId, checked);
  };
  const callEdit = e => {
    console.log(e);
    mailApi.doEditMail(mailId, { draft: checked });
  };
  const callSearch = e => {
    console.log(e);
    const param = { index: start, count } as queryMailBoxParam;
    if (checked) {
      param.id = box;
    }
    mailApi.doSearchMail(search, param).then(res => {
      logResult(res);
    });
  };
  const rawElementsShow = mailList.map((e, k) => (
    <div>
      <hr />
      <h3>
        {k}
        :&nbsp;&gt;
      </h3>
      <hr />
      <div>{JSON.stringify(e)}</div>
      <hr />
    </div>
  ));
  const scrollRecyclerView = <div />;
  return (
    /** 页面内容外出包裹PageContentLayout组件 */
    <PageContentLayout>
      {/* 内层用SideContentLayout包裹 */}
      <SideContentLayout>
        {boxList.map((e, k) => (
          <div>
            <div>
              {k}
              :&nbsp;&gt;
            </div>
            <div>
              {e.entry.mailBoxId}-{e.entry.mailBoxName}
            </div>
            <div>{e.childrenCount > 0 && JSON.stringify(e.children)}</div>
          </div>
        ))}
      </SideContentLayout>
      <SideContentLayout maxWidth={800}>{showRawList ? rawElementsShow : scrollRecyclerView}</SideContentLayout>
      {/* 是弹性模块，占满全屏，直接用div包裹就可以，用来放详情页内容 */}
      <div>
        <div>
          <button onClick={writeLatter}>{getIn18Text('XIEXIN')}</button>
          <button onClick={callGetFolder}>{getIn18Text('CHAKANWENJIANJIA')}</button>
          <button onClick={callGetList}>{getIn18Text('CHAKANYOUJIAN')}</button>
          <button onClick={callGetContent}>{getIn18Text('CHAKANYOUJIANXIANG')}</button>
          <button onClick={callSave}>{getIn18Text('ZANCUNYOUJIAN')}</button>
          <button onClick={callSend}>{getIn18Text('FASONGYOUJIAN')}</button>
          <button onClick={callGetContact}>{getIn18Text('CHAZHAOLIANXIREN')}</button>
          <button onClick={callUpload}>{getIn18Text('SHANGCHUANFUJIANBING')}</button>
          <button onClick={callGetSignature}>{getIn18Text('HUOQUQIANMING')}</button>
          <button onClick={callMoveMail}>{getIn18Text('YIDONGYOUJIAN')}</button>
          <button onClick={callMarkMail}>{getIn18Text('HONGQIYOUJIAN')}</button>
          <button onClick={callDeleteMail}>{getIn18Text('SHANCHUYOUJIAN')}</button>
          <button onClick={callReadUnread}>{getIn18Text('BIAOJIYIDUWEI')}</button>
          <button onClick={callAllReadUnread}>{getIn18Text('QUANLIANGBIAOJIYI')}</button>
          <button onClick={callForward}>{getIn18Text('ZHUANFA')}</button>
          <button onClick={callReply}>{getIn18Text('HUIFU/HUIFU')}</button>
          <button onClick={callEdit}>{getIn18Text('BIANJI')}</button>
          <button onClick={callSearch}>{getIn18Text('SOUSUO')}</button>
          <button onClick={callGetContentByIds}>{getIn18Text('ANidLIEBIAO')}</button>
        </div>
        <div>
          <button onClick={getLogin}>{getIn18Text('CHUSHIHUA')}</button>
        </div>
        <div>
          {' '}
          mailboxid:
          <input
            id="box"
            value={box}
            onChange={e => {
              setBox(parseInt(e.target.value));
            }}
          />
        </div>
        <div>
          {' '}
          mailid:
          <input
            id="mailid"
            value={mailId}
            onChange={e => {
              setMailId(e.target.value);
            }}
          />
        </div>
        <div>
          {' '}
          to:
          <input
            id="mailTo"
            value={contact}
            onChange={e => {
              setContact(e.target.value);
            }}
          />
        </div>
        <div>
          {' '}
          mailContent:
          <input
            id="mailContent"
            value={content}
            onChange={e => {
              setContent(e.target.value);
            }}
          />
        </div>
        <div>
          {' '}
          mailTitle:
          <input
            id="mailTitle"
            value={title}
            onChange={e => {
              setTitle(e.target.value);
            }}
          />
        </div>
        <div>
          {' '}
          flag:
          <label>
            {getIn18Text('HONGQI/YIDU')}
            <input
              id="check"
              type="checkbox"
              checked={checked}
              onChange={e => {
                setChecked(e.target.checked);
              }}
            />
          </label>
          <label>
            {getIn18Text('ZHANSHIrec')}
            <input
              id="check2"
              type="checkbox"
              checked={showRawList}
              onChange={e => {
                setShowRawList(e.target.checked);
              }}
            />
          </label>
        </div>
        <div>
          {' '}
          search:
          <input
            id="search"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
            }}
          />
        </div>
        <div>
          {' '}
          start:
          <input
            id="start"
            value={start}
            onChange={e => {
              setStart(parseInt(e.target.value));
            }}
          />
        </div>
        <div>
          {' '}
          count:
          <input
            id="count"
            type="text"
            value={count}
            onChange={e => {
              setCount(parseInt(e.target.value));
            }}
          />
        </div>
        <div>
          {' '}
          attachment:
          <input type="file" ref={fileInput} />
        </div>
        <hr />
        <div style={{ height: '500px;overflow:scroll;' }}>{content}</div>
        {/* <IcsCard/> */}
        <div>{content}</div>
        <Spin />
      </div>
    </PageContentLayout>
  );
};
export default MailBoxTest;
