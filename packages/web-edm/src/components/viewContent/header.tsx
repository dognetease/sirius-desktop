import React, { useEffect } from 'react';
import { getIn18Text } from 'api';
import { ResponseSendBoxCopy, apiHolder, MailConfApi } from 'api';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import IconCard from '@web-common/components/UI/IconCard';
import './style.scss';
const mailManagerApi = apiHolder.api.requireLogicalApi('mailConfApiImpl') as unknown as MailConfApi;
interface Props {
  content: ResponseSendBoxCopy;
  onScrollToAttacth?(): void;
}
export const Header: React.FC<Props> = ({ content, onScrollToAttacth = () => {} }) => {
  // const systemApi = api.api.getSystemApi() as SystemApi;
  // const [isShowDetail, setDetailShow] = useState<boolean>(false);
  // 邮件内容切换的时候收齐详情
  // useEffect(() => {
  //   setDetailShow(false);
  // }, [content]);
  useEffect(() => {
    if (window.location.pathname !== '/') {
      mailManagerApi.requestTaglist();
    }
  }, []);
  let attachmentInfo: any[] = [];
  if (content.contentEditInfo.emailAttachment) {
    try {
      const json = JSON.parse(content.contentEditInfo.emailAttachment);
      attachmentInfo = (json || []).map(attach => ({
        ...attach,
        fileExt: String(attach.fileName).split('.').pop(),
      }));
    } catch (e) {
      console.warn('parse edm emailAttachment fail');
    }
  }
  const scrollToAttach = () => {
    onScrollToAttacth();
  };
  // const renderCard = (contact: EdmSendConcatInfo) => {
  //   let name = '';
  //   if (contact) {
  //     if (systemApi.getCurrentUser()?.id === contact.contactEmail) {
  //       name = `我(${contact.contactEmail})`;
  //     } else if (contact.contactName) {
  //       name = contact.contactName + (contact.contactEmail ? `(${contact.contactEmail})` : '');
  //     } else {
  //       name = contact.contactEmail;
  //     }
  //   }
  //   return name;
  // };
  // const formatReceiver = (type: string, returnType?: string) => {
  //   const receiver: JSX.Element[] = [];
  //   const _index = ['发送', '抄送', '密送'];
  //   const _array = ['发给', '抄送', '密送'];
  //   const _detail = ['收件人', '抄&emsp;送', '密&emsp;送'];
  //   let _type;
  //   if (content.receiverInfo.contactInfoList) {
  //     content.receiverInfo.contactInfoList.forEach(item => {
  //       receiver.push(<div className="u-card" key={item.contactEmail}>{renderCard(item)}</div>);
  //     });
  //   }
  //   const index = _index.indexOf(type);
  //   _type = (returnType === 'name') ? _array[index] : _detail[index];
  //   return receiver.length || (type === '发送' && !returnType)
  //     ? (
  //       <div className={returnType === 'name' || returnType === 'nameCard' ? 'u-info-top' : 'u-info-item'}>
  //         <span className="name" dangerouslySetInnerHTML={{ __html: _type + (returnType === 'name' ? '' : '：') }} />
  //         {receiver.length
  //           ? (
  //             <span className="detail">
  //               {receiver.map((_item, idx) => (
  //                 <>
  //                   {idx ? '、' : ''}
  //                   {_item}
  //                 </>
  //               ))}
  //             </span>
  //           )
  //           : <span className="detail">无收件人</span>}
  //       </div>
  //     ) : '';
  // };
  let { emailSubject } = content.sendSettingInfo;
  if (content.sendSettingInfo.emailSubjects) {
    emailSubject = content.sendSettingInfo.emailSubjects[0]?.subject || emailSubject;
  }
  // const { ccInfos, ccReceivers } = content.sendSettingInfo;
  return (
    <>
      <div className="u-info edm-view-content-header" style={{ paddingBottom: '10px' }}>
        <div className="u-info-title">{emailSubject || getIn18Text('WUZHUTI')}</div>
        <div className="u-item">
          <div
            style={{
              marginRight: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <AvatarTag
              size={40}
              innerStyle={{ border: 'none' }}
              user={{
                name: content.sendSettingInfo.sender,
                email: content.sendSettingInfo.sender,
                avatar: '',
              }}
            />
          </div>
          <div className="u-item-content">
            <div className="u-item-info" style={{ height: 28 }}>
              <div className="name">
                <span>{content.sendSettingInfo.sender}</span>
              </div>
              {/* <div className="time">{moment(content?.entry.sendTime).format('yyyy-MM-DD hh:mm')}</div> */}
            </div>
            {attachmentInfo.length ? (
              <div className="attach" hidden={!attachmentInfo.length}>
                {/* <ReadListIcons.AttachSvg />
<span className="text">{attachmentInfo}</span> */}
                <span className="text">
                  {getIn18Text('FUJIAN')}
                  {attachmentInfo.length}
                  {getIn18Text('GE')}
                </span>
                (
                <span className="edm-view-content-attachment">
                  <IconCard type={attachmentInfo[0].fileExt || ''} width={16} height={16} />
                  <span>{attachmentInfo[0].fileName}</span>
                </span>
                {attachmentInfo.length > 1 ? getIn18Text('DENG') : ''})
                {/* <span
className="u-item-detail contains"
onClick={e => {
e.stopPropagation();
scrollToAttach();
}}
>
查看详情
</span> */}
              </div>
            ) : (
              ''
            )}
            {/* <div className="u-item-sender">
<span className="detail contains no-select">
{content.receiverInfo.contactInfoList?.length
? (
<>
{formatReceiver('发送', 'nameCard')}
</>
)
: '无联系人'}
</span>
<span className="u-item-detail contains" onClick={e => { e.stopPropagation(); setDetailShow(!isShowDetail); }}>{isShowDetail ? '收起' : '详情'}</span>
</div> */}
          </div>
        </div>
      </div>
    </>
  );
};
export default Header;
