import { getIn18Text } from 'api';
import React from 'react';
import { SnsMarketingPlatform } from 'api';
import { Tooltip } from 'antd';
import { openWebUrlWithLoginCode } from '@web-common/utils/utils';
import PlatformLogo from '../../components/PlatformLogo';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { ReactComponent as ArrowRight } from '@web-sns-marketing/images/arrow-right-current-color.svg';
import { ReactComponent as ExportIcon } from '@web-sns-marketing/images/export.svg';
import { ReactComponent as TipIcon } from '@web-sns-marketing/images/tip.svg';
import { ReactComponent as ConnectInsFbIcon } from '../../images/connect-ins-fb.svg';
import style from './InstagramGuideModal.module.scss';

const openWebUrl = (url: string) => window.open(url, '_blank');

interface InstagramGuideModalProps {
  visible: boolean;
  okLoading: boolean;
  docsMap: Record<string, string>;
  onOk: () => void;
  onCancel: () => void;
}

const InstagramGuideModal: React.FC<InstagramGuideModalProps> = props => {
  const { visible, okLoading, docsMap, onOk, onCancel } = props;

  return (
    <Modal
      className={style.instagramGuideModal}
      width={710}
      title={getIn18Text('SHOUQUANTIANJIAIns')}
      visible={visible}
      okText={getIn18Text('WOYIWANCHENGQIANWANGSHOUQUAN')}
      getContainer={() => document.body}
      okButtonProps={{ loading: okLoading }}
      onOk={onOk}
      onCancel={onCancel}
    >
      <div className={style.tip}>
        <div className={style.text}>{getIn18Text('QINGXIANWANCHENGYIXIAZHUN')}</div>
        <a onClick={() => docsMap.Details && openWebUrlWithLoginCode(docsMap.Details)}>
          <span>{getIn18Text('XIANGXICAOZUOWENDANG')}</span>
          <ArrowRight />
        </a>
      </div>
      <div className={style.item}>
        <PlatformLogo className={style.icon} platform={SnsMarketingPlatform.FACEBOOK} type="origin" size={50} />
        <div className={style.content}>
          <div className={style.title}>{getIn18Text('CHUANGJIAN Face')}</div>
          <div className={style.desc}>
            <span>{getIn18Text('WUZHANGHAO，XIANZHUCE')}</span>
            <ExportIcon className={style.exportIcon} onClick={() => docsMap.FacebookRegister && openWebUrl(docsMap.FacebookRegister)} />
            <span>{getIn18Text('YIYOUZHANGHAO，QUCHUANG')}</span>
            <ExportIcon className={style.exportIcon} onClick={() => docsMap.FacebookCreatePage && openWebUrl(docsMap.FacebookCreatePage)} />
          </div>
        </div>
      </div>
      <div className={style.item}>
        <PlatformLogo className={style.icon} platform={SnsMarketingPlatform.INSTAGRAM} type="origin" size={50} />
        <div className={style.content}>
          <div className={style.title}>{getIn18Text('ZHUNBEI Inst')}</div>
          <div className={style.desc}>
            <span>{getIn18Text('WUZHANGHAO，XIANZHUCE')}</span>
            <ExportIcon className={style.exportIcon} onClick={() => docsMap.InstagramRegister && openWebUrl(docsMap.InstagramRegister)} />
            <span>{getIn18Text('YIYOUZHANGHAO，QIEHUANWEIYEWU')}</span>
            <Tooltip overlayClassName={style.professionalTooltip} title={getIn18Text('QIEHUANYEWUZHANGHAOHOU')}>
              <TipIcon className={style.tipIcon} />
            </Tooltip>
            <ExportIcon className={style.exportIcon} onClick={() => docsMap.InstagramSwitch && openWebUrl(docsMap.InstagramSwitch)} />
          </div>
        </div>
      </div>
      <div className={style.item}>
        <ConnectInsFbIcon className={style.icon} />
        <div className={style.content}>
          <div className={style.title}>{getIn18Text('GUANLIAN Inst')}</div>
          <div className={style.desc}>
            <span>{getIn18Text('JIANG Insta')}</span>
            <ExportIcon className={style.exportIcon} onClick={() => docsMap.InstagramFacebookRelated && openWebUrl(docsMap.InstagramFacebookRelated)} />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InstagramGuideModal;
