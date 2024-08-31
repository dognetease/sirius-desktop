/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable indent */
/* eslint-disable max-statements */
import React from 'react';
import { apiHolder, apis, EdmProductDataApi, EdmSendBoxApi, MailApi, ResponseCustomerNewLabelByEmail } from 'api';
import { Tooltip, Popover } from 'antd';
import detailStyle from './detail.module.scss';
import { edmDataTracker } from '../tracker/tracker';
import SendMail from '@/images/icons/send-mail-icon.svg';
// import TipsIcon from '@/images/icons/edm/tips-icon.svg';
import { CustomerCard } from '../components/CustomerCard';
import { getIn18Text } from 'api';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import { SiriusCustomerTagByEmail } from '@lxunit/app-l2c-crm';

const httpApi = apiHolder.api.getDataTransApi();
const systemApi = apiHolder.api.getSystemApi();
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const edmProductApi = apiHolder.api.requireLogicalApi(apis.edmProductDataImpl) as EdmProductDataApi;

export interface Props {
  mail: string;
  companyId?: string;
  needDecrypt?: boolean;
  decryptEmail?: string;
  needOp?: boolean; // 是否需要卡片或者发件操作
  sameOriginProxy?: boolean; // 是否显示同于代发
  mailInfoMap: Record<string, ResponseCustomerNewLabelByEmail[]>;
}

export const RenderMailto = (props: Props): JSX.Element => {
  const { mail, companyId, needDecrypt = false, decryptEmail = '', needOp, sameOriginProxy, mailInfoMap } = props;

  if (mail == null || mail === '') {
    return <>-</>;
  }

  // 客户卡片曝光埋点
  if (companyId != null) {
    edmDataTracker.trackCustomerCard();
  }

  const renderSiriusCustomerTag = () => {
    if (!mailInfoMap[mail] || !needOp) {
      return;
    }
    return <SiriusCustomerTagByEmail email={mail} labelInfos={mailInfoMap[mail]} />;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        // marginRight: '6px',
      }}
    >
      {companyId != null && needOp ? (
        // <Popover
        //   onVisibleChange={value => {
        //     if (value) {
        //       edmDataTracker.trackCustomerCardClick();
        //     }
        //   }}
        //   zIndex={7}
        //   destroyTooltipOnHide
        //   trigger={'click'}
        //   content={<CustomerCard email={mail} needDecrypt={needDecrypt} decryptEmail={decryptEmail} source="edmCard" />}
        // >
        <div
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
          }}
        >
          <span className={detailStyle.customerEmail}>{mail}</span>&nbsp;
          {renderSiriusCustomerTag()}
          {/* <div className={detailStyle.customerTag}>{getIn18Text('KEHU')}</div> */}
          {sameOriginProxy && <Tag type="label-3-1">{getIn18Text('TONGYUCHONGTUDAIFA')}</Tag>}
        </div>
      ) : (
        // </Popover>
        <>
          <span className={detailStyle.customerEmail}>{mail}</span>&nbsp;
          {renderSiriusCustomerTag()}
          {needOp && (
            <div className={detailStyle.customerEmailSend}>
              <Tooltip title={getIn18Text('FAYOUJIAN')}>
                <img
                  className={detailStyle.mailToImg}
                  onClick={() => {
                    if (needDecrypt) {
                      // 如果需要解密
                      edmApi.getDecryptEmail({ contactEmails: decryptEmail }).then(mails => {
                        mailApi.doWriteMailToContact(mails);
                      });
                    } else {
                      mailApi.doWriteMailToContact([mail]);
                    }
                  }}
                  src={SendMail}
                />
              </Tooltip>
            </div>
          )}
          {sameOriginProxy && <Tag type="label-3-1">{getIn18Text('TONGYUCHONGTUDAIFA')}</Tag>}
        </>
      )}
    </div>
  );
};
