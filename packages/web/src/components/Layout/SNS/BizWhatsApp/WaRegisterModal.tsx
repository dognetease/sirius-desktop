import React, { useEffect, useState, useMemo } from 'react';
import classnames from 'classnames';
import { apiHolder, apis, WhatsAppApi, WhatsAppTemplateV2, WhatsAppTplStatusV2 } from 'api';
import { getIn18Text } from 'api';
import { navigate } from '@reach/router';
import { Button } from 'antd';
import { openWebUrlWithLoginCode } from '@web-common/utils/utils';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import ArrowLeft from '@web-common/components/UI/Icons/svgs/disk/ArrowLeft';
import ArrowRight from '@web-common/components/UI/Icons/svgs/disk/ArrowRight';
import TemplateEditor from '../WhatsAppV2/components/template/templateEditor';
import { useWaContextV2 } from '../WhatsAppV2/context/WaContextV2';
import { handleRegisterStart } from '../WhatsAppV2/utils';
import style from './WaRegisterModal.module.scss';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

interface WaRegisterModalProps {
  visible: boolean;
  onCancel: () => void;
  onFinish: () => void;
}

export const WaRegisterModal: React.FC<WaRegisterModalProps> = props => {
  const { visible, onCancel, onFinish } = props;
  const { orgStatus, allotPhones } = useWaContextV2();
  const [step, setStep] = useState<number>(0);
  const [tplStatus, setTplStatus] = useState<WhatsAppTplStatusV2 | null>(null);
  const [tplVisible, setTplVisible] = useState<boolean>(false);
  const [bindVisible, setBindVisible] = useState<boolean>(false);
  const hasRegistered = orgStatus === 'REGISTERED' && !!allotPhones.length;
  const hasApprovedTpl = tplStatus === 'APPROVED';
  const [drafting, setDrafting] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const tplBtnText = useMemo(() => {
    switch (tplStatus) {
      case 'IN_APPEAL':
        return getIn18Text('SHENPIZHONG');
      case 'APPROVED':
        return getIn18Text('YITONGGUO');
      case 'REJECTED':
        return getIn18Text('WEITONGGUO');
      default:
        return getIn18Text('QIANWANGSHENQING');
    }
  }, [tplStatus]);

  useEffect(() => {
    whatsAppApi.getTplStatusV2().then(res => setTplStatus(res));
  }, []);

  useEffect(() => {
    if (hasRegistered) {
      if (hasApprovedTpl) {
        setStep(2);
      } else {
        setStep(1);
      }
    } else {
      setStep(0);
    }
  }, [hasRegistered, hasApprovedTpl]);

  const handleTplDraft = (template: WhatsAppTemplateV2) => {
    setDrafting(true);
    whatsAppApi
      .editTemplateDraftV2(template)
      .then(() => {
        setTplVisible(false);
        Toast.success({ content: getIn18Text('XINJIANCHENGGONG\uFF01') });
      })
      .finally(() => {
        setDrafting(false);
      });
  };

  const handleTplSubmit = (template: WhatsAppTemplateV2) => {
    setSubmitting(true);
    whatsAppApi
      .submitTemplateV2(template)
      .then(() => {
        setTplVisible(false);
        Toast.success({ content: getIn18Text('TIJIAOCHENGGONG\uFF01') });
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <>
      <Modal
        className={style.modal}
        width={820}
        title={
          <div className={style.modalTitle}>
            <h3>{getIn18Text('WhatsAppYINGXIAO')}</h3>
            <p>{getIn18Text('KUAISUSHIYONGwhatsapp QUNFAGONGNENG\uFF0CCHUDAQIANZAIKEHU')}</p>
          </div>
        }
        visible={visible && !bindVisible && !tplVisible}
        onCancel={onCancel}
        footer={null}
      >
        <div className={style.modalContent}>
          <div className={style.landingContent}>
            <div className={style.stepList}>
              <section className={classnames({ [style.active]: step === 0 })}>
                <span className={style.iconNum}>1</span>
                <div className={style.content}>
                  <div className={style.title}>{getIn18Text('WANCHENGwhatspp CHUSHIHUABANGDING')}</div>
                </div>
                <Button disabled={hasRegistered} size="small" onClick={() => setBindVisible(true)}>
                  {hasRegistered ? getIn18Text('YIBANGDING') : getIn18Text('QIANWANGBANGDING')}
                </Button>
              </section>
              <section className={classnames({ [style.active]: step === 1 })}>
                <span className={style.iconNum}>2</span>
                <div className={style.content}>
                  <div className={style.title}>{getIn18Text('WANCHENGwhatsppXIAOXIMOBANSHENQING')}</div>
                  <div className={style.description}>{getIn18Text('ZHU\uFF1ASHENQINGHOUXUSHENHECHENGGONGCAIKEZAIQUNFAGONGNENGZHONGSHIYONGXIAOXIMOBAN')}</div>
                </div>
                <Button disabled={!hasRegistered || hasApprovedTpl} size="small" onClick={() => setTplVisible(true)}>
                  {tplBtnText}
                </Button>
              </section>
              <section className={classnames({ [style.active]: step === 2 })}>
                <span className={style.iconNum}>3</span>
                <div className={style.content}>
                  <div className={style.title}>{getIn18Text('SHEZHIWhatsappQUNFARENWU')}</div>
                </div>
                <Button disabled={step !== 2} size="small" onClick={() => navigate('#edm?page=whatsAppJobEdit')}>
                  {getIn18Text('CHUANGJIANRENWU')}
                </Button>
              </section>
              <section className={classnames({ [style.active]: step === 3 })}>
                <span className={style.iconNum}>4</span>
                <div className={style.content}>
                  <div className={style.title}>在[消息]中通过 WhatsApp 回复客户</div>
                  <div className={style.description}>{getIn18Text('DANGNINTONGGUOQUNFACHUDAKEHUHOU\uFF0CQIANKEZIXUNKEYIZAI\u3010XIAOXI\u3011ZHONGKUAISUCHULI')}</div>
                </div>
              </section>
            </div>
            <div className={style.intro}>
              <div className={style.figure}></div>
              <section>
                <h5>{getIn18Text('YIXIANGKEHUWhatsappYIJIANCHUDA')}</h5>
                <p>{getIn18Text('KUAISUCHUANGJIANQUNFARENWU\uFF0CYIXIANGMUBIAOKEHUWUXUJIAHAOYOUJIKEGAOXIAOBIANJIECHUDAKEHU')}</p>
              </section>
              <section>
                <h5>{getIn18Text('WhatsappLIAOTIANJILULIUCUN')}</h5>
                <p>{getIn18Text('WhatsAppGUANFANGRENZHENGJIEKOU\uFF0CGOUTONGJILUTONGBULIUCUN')}</p>
              </section>
            </div>
          </div>
        </div>
      </Modal>
      <Modal
        className={style.modal}
        width={820}
        title={
          <div className={style.modalTitle}>
            <Button type="text" className={style.backBtn} onClick={() => setBindVisible(false)}>
              <ArrowLeft />
              {getIn18Text('FANHUISHANGYIBU')}
            </Button>
          </div>
        }
        visible={visible && bindVisible}
        onCancel={onCancel}
        footer={null}
      >
        <div className={style.modalContent}>
          <div className={style.bindContent}>
            <h5 className={style.bindTitle}>{getIn18Text('WhatsApp BANGDINGSHEZHI')}</h5>
            <div className={style.stepList}>
              <section>
                <span className={style.iconNum}>1</span>
                <div className={style.content}>
                  <div className={style.title}>{getIn18Text('CHUANGJIAN Facebook Business Manager ZHANGHAO\uFF0CBINGRENZHENG')}</div>
                </div>
                <Button
                  size="small"
                  type="link"
                  onClick={() =>
                    openWebUrlWithLoginCode(
                      'https://waimao.office.163.com/share_anonymous/#type=FILE&shareIdentity=f89cb33f948d4e8b8dad8143ec7e00d4&fileId=19000001539936'
                    )
                  }
                >
                  {getIn18Text('RUHECHUANGJIAN')}
                  <ArrowRight className={style.arrowIcon} stroke="#386EE7" opcacity={1} />
                </Button>
              </section>
              <section>
                <span className={style.iconNum}>2</span>
                <div className={style.content}>
                  <div className={style.title}>{getIn18Text('DIANJIXIAZAIMOBAN\uFF0CXIANGWANGYISHANGWUTONGSHIHUODAILISHANGTIGONGWhatsapp business APIZHUCEZILIAO')}</div>
                </div>
                <Button
                  size="small"
                  type="link"
                  onClick={() =>
                    openWebUrlWithLoginCode(
                      'https://waimao.office.163.com/share_anonymous/#type=FILE&shareIdentity=1976e79c4174442aa1991bc06bed5e64&fileId=19000001547896'
                    )
                  }
                >
                  {getIn18Text('DIANJIXIAZAIMOBAN')}
                  <ArrowRight className={style.arrowIcon} stroke="#386EE7" opcacity={1} />
                </Button>
              </section>
              <section>
                <span className={style.iconNum}>3</span>
                <div className={style.content}>
                  <div className={style.title}>{getIn18Text('ZHUCEZHANGHAO')}</div>
                </div>
                <Button size="small" className={style.bindBtn} onClick={() => handleRegisterStart('register', onFinish)}>
                  {getIn18Text('DIANJIZHUCE')}
                </Button>
              </section>
            </div>
          </div>
        </div>
      </Modal>
      <Modal
        className={style.modal}
        width={820}
        title={
          <div className={style.modalTitle}>
            <Button type="text" className={style.backBtn} onClick={() => setTplVisible(false)}>
              <ArrowLeft />
              {getIn18Text('FANHUISHANGYIBU')}
            </Button>
          </div>
        }
        visible={visible && tplVisible}
        onCancel={onCancel}
        footer={null}
      >
        <div className={style.modalContent}>
          <TemplateEditor
            template={null}
            drafting={drafting}
            submitting={submitting}
            onCancel={() => setTplVisible(false)}
            onDraft={handleTplDraft}
            onSubmit={handleTplSubmit}
          />
        </div>
      </Modal>
    </>
  );
};
