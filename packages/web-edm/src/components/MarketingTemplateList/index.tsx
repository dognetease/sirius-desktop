import React, { FC, useEffect, useState, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { Modal, Button, message, Checkbox } from 'antd';
import { apiHolder, apis, EdmSendBoxApi, DataStoreApi } from 'api';

import CloseIcon from '@/images/icons/modal_close_temp.svg';
import PreStepIcon from '@/images/icons/edm/pre-step.svg';
import ConfirmIcon from '@/images/icons/edm/confirm-icon.svg';
import Alert from '@web-common/components/UI/Alert/Alert';

import { SendedMarketing } from '../../sendedMarketing';
import { EdmDetail } from '../../detail/detailV2';
import { TemplateAddModal } from '../../mailTemplate/template/index';
import { edmDataTracker } from '../../tracker/tracker';

import styles from './MarketingTemplateList.module.scss';
import { getIn18Text } from 'api';
export interface MarketingTemplateListRefType {
  setVisible: (visible: boolean, mask?: boolean) => void;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const dataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

const IS_SAVE_TEMPLATE = 'IS_SAVE_TEMPLATE';

// content 过滤器，主要过滤签名
const contentFilter = (content: string) => {
  const node = document.createElement('div');
  node.innerHTML = content;
  const signNode = node.querySelector('.lingxi-signature-container');
  signNode?.remove();
  const signNode2 = node.querySelector('.mail-signature-ent');
  signNode2?.remove();
  return node.innerHTML;
};

// 营销列表
const MarketingList: FC<{
  fromPage: number;
  setQs: (qs: any) => void;
  setShowDetail: (value: boolean) => void;
  saveTemplate: (edmEmailId: string) => Promise<any>;
}> = props => {
  const { fromPage, setQs, setShowDetail, saveTemplate } = props;

  return useMemo(
    () => (
      <SendedMarketing
        saveTemplateTxt={fromPage === 2 ? getIn18Text('LIJISHIYONG') : getIn18Text('CUNWEIMOBAN')}
        qs={{}}
        from="templateList"
        toDetail={qs => {
          setQs(qs);
          setShowDetail(true);
        }}
        saveTemplate={saveTemplate}
      />
    ),
    [fromPage]
  );
};

export const MarketingTemplateList = forwardRef<
  MarketingTemplateListRefType,
  {
    addNewTemplate: (content?: string) => Promise<void>;
    afterModalClose: () => void;
    fromPage: number;
    insertContent: (content: string, needSave: boolean, successLabel: string) => void;
    from?: 'templateList' | 'templateListModal';
  }
>((props, ref) => {
  const { addNewTemplate, afterModalClose, fromPage, insertContent, from = 'templateList' } = props;
  const [visible, setVisible] = useState(false);
  const [qs, setQs] = useState<Record<string, any>>({});
  const [showDetail, setShowDetail] = useState(false);
  const [mask, setMask] = useState(true);
  const [preview, setPreview] = useState(false);
  const [needAddModal, setNeedAddModal] = useState(false);
  const [successLabel, setSuccessLabel] = useState(getIn18Text('BAOCUNCHENGGONG'));

  // 是否保存个人模板逻辑
  const [showConfirm, setShowConfirm] = useState(false);
  const [needSave, setNeedSave] = useState(true);
  const [content, setContent] = useState('');
  useEffect(() => {
    const result = dataStoreApi.getSync(IS_SAVE_TEMPLATE);
    if (result.suc && result.data) {
      setNeedSave(result.data === 'true');
    }
  }, [showConfirm]);

  useImperativeHandle(ref, () => ({
    setVisible: (visible: boolean, mask?: boolean) => {
      setVisible(visible);
      if (mask != null) {
        setMask(mask);
      }
    },
  }));

  // 每次开启都恢复原状态
  useEffect(() => {
    setShowDetail(false);
    setPreview(false);
    setNeedAddModal(false);
  }, [visible]);

  const confirmModal = useCallback(
    (content: string) => {
      Modal.confirm({
        title: getIn18Text('SHIFOUXUANYONGGAIYINGXIAO'),
        content: (
          <div className={styles.modalContent}>
            <Checkbox checked={needSave} onChange={e => setNeedSave(true)}>
              {getIn18Text('TONGSHIBAOCUNWEIGEREN')}
            </Checkbox>
          </div>
        ),
        className: styles.confirmModal,
        onOk() {
          if (needSave) {
            addNewTemplate(content);
          }
          setVisible(false);
          afterModalClose();
        },
        centered: true,
      });
    },
    [needSave, afterModalClose, addNewTemplate]
  );

  const saveTemplate = async (edmEmailId: string) => {
    if (edmEmailId === '') {
      return message.error(getIn18Text('edmEmai'));
    }
    const { contentEditInfo } = await edmApi.copyFromSendBox({ edmEmailId });
    const content = contentEditInfo.emailContent;
    if (fromPage === 2) {
      // 弹窗模板列表
      // Alert.warn({
      //   title: null,
      //   content: '是否选用该营销任务的内容作为本次营销任务的邮件内容',
      //   onOk
      // });
      // confirmModal(content);
      setContent(content);
      setShowConfirm(true);
    } else {
      // 模板管理列表
      addNewTemplate(content); // 打开编辑模板
      setVisible(false); // 关闭当前 modal
      afterModalClose(); // 关闭 modal 后执行
      edmDataTracker.trackMarketingTemplate({
        source: getIn18Text('MOBANGUANLI'),
        action_page: '',
        task_type: '',
      });
    }
  };

  const renderList = () => (
    <div className={styles.modalOutBox}>
      <div className={styles.header}>
        <div className={styles.leftMenu}>
          {showDetail && (
            <img
              src={PreStepIcon}
              alt=""
              onClick={() => setShowDetail(false)}
              style={{
                marginRight: 4,
                cursor: 'pointer',
              }}
            />
          )}
          {showDetail ? getIn18Text('RENWUXIANGQING') : getIn18Text('CONGYINGXIAORENWUXUANZE')}
          <div hidden={showDetail} className={styles.info}>
            {getIn18Text('KECONGJINQIDEYINGXIAO')}
          </div>
        </div>
        <img
          src={CloseIcon}
          onClick={() => {
            showDetail ? setShowDetail(false) : setVisible(false);
          }}
          alt=""
          className={styles.rightClose}
        />
      </div>
      {/* 内容区域 */}
      <div className={styles.listWrapper}>
        {/* 详情，直接盖到list上去的 */}
        <div className={styles.detailContent} hidden={!showDetail}>
          <div className={styles.detailList}>
            <EdmDetail
              qs={qs}
              preview={preview}
              onPreviewClose={() => {
                setPreview(false);
              }}
              from="templateList"
              index={qs.index}
              target={qs.target}
            />
          </div>
          <div className={styles.detailFooter}>
            <Button type="ghost" onClick={() => setPreview(true)}>
              {getIn18Text('CHAKAN')}
            </Button>
            <Button
              onClick={() => saveTemplate(qs.edmEmailId)}
              style={{
                marginLeft: 12,
              }}
              type="primary"
            >
              {fromPage === 2 ? getIn18Text('LIJISHIYONG') : getIn18Text('CUNWEIMOBAN')}
            </Button>
          </div>
        </div>
        {/* 列表 */}
        <div className={styles.listBox}>
          {/* <SendedMarketing
            saveTemplateTxt={fromPage === 2 ? '立即使用' : '存为模板'}
            qs={{}}
            from="templateList"
            toDetail={qs => {
              setQs(qs);
              setShowDetail(true);
            }}
            saveTemplate={saveTemplate}
          /> */}
          <MarketingList fromPage={fromPage} setQs={setQs} setShowDetail={setShowDetail} saveTemplate={saveTemplate} />
        </div>
      </div>
    </div>
  );

  const renderAddModal = () => (
    <TemplateAddModal
      templateId=""
      content={contentFilter(content)}
      goMailTemplate={() => {
        setVisible(false);
        afterModalClose();
      }}
      successLabel={successLabel}
    />
  );

  return (
    <>
      {useMemo(
        () => (
          <Modal
            afterClose={() => {
              afterModalClose();
              setNeedAddModal(false);
            }}
            mask={mask}
            destroyOnClose
            closable
            onCancel={() => setVisible(false)}
            maskClosable
            className={styles.listModal}
            closeIcon={<></>}
            visible={visible}
            width={984}
            footer={null}
            title={null}
            bodyStyle={{ height: '612px' }}
            centered
          >
            {needAddModal ? renderAddModal() : renderList()}
          </Modal>
        ),
        [addNewTemplate, afterModalClose, fromPage, visible, qs, showDetail, mask, preview, from]
      )}
      <Modal zIndex={1010} className={styles.confirmModal} centered visible={showConfirm} footer={<></>} width={400}>
        <div className={styles.modalOut}>
          <img src={ConfirmIcon} alt="" />
          <div className={styles.modalRight}>
            <div className={styles.modalTitle}>
              <div className={styles.title}>{getIn18Text('SHIFOUXUANYONGGAIYINGXIAO')}</div>
            </div>
            <div className={styles.modalContent}>
              <Checkbox checked={needSave} onChange={e => setNeedSave(e.target.checked)}>
                {getIn18Text('TONGSHIBAOCUNWEIGEREN')}
              </Checkbox>
              <Button
                style={
                  {
                    // marginLeft: 18
                  }
                }
                type="dashed"
                onClick={() => setShowConfirm(false)}
              >
                {getIn18Text('setting_system_switch_cancel')}
              </Button>
              <Button
                style={{
                  marginLeft: 14,
                }}
                type="primary"
                onClick={() => {
                  setShowConfirm(false);
                  dataStoreApi.putSync(IS_SAVE_TEMPLATE, needSave + '');
                  const currentContent = contentFilter(content);
                  if (from === 'templateList') {
                    if (needSave) {
                      addNewTemplate(currentContent);
                      setVisible(false);
                      afterModalClose();
                    }
                  } else {
                    if (needSave) {
                      addNewTemplate(currentContent);
                      setNeedAddModal(true);
                    } else {
                      setVisible(false);
                    }
                  }
                  insertContent(currentContent, needSave, successLabel);
                  edmDataTracker.trackMarketingTemplate({
                    source: getIn18Text('NEIRONGBIANJI'),
                    action_page: getIn18Text('RENWULIEBIAO'),
                    task_type: '',
                    save_as_template: needSave ? getIn18Text('SHI') : getIn18Text('FOU'),
                  });
                }}
              >
                {getIn18Text('QUEDING')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
});
