import React, { useState, useCallback, useEffect, useMemo } from 'react';
import './index.scss';
import { MailEntryModel, TranslatStatusInfo } from 'api';
import { Spin, Select, Button } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { useGetProductAuth } from '@web-common/hooks/useGetProductAuth';
import TranslateModal from './translateModal';
import { htmlErrmsg, translateLangMap, ErrorMessage } from './errCodeMsg';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { getIn18Text } from 'api';
import { TongyongCuowutishiMian } from '@sirius/icons';
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
// const antIcon =  <div className="translate-tips-loading"></div>
const { Option, OptGroup } = Select;
interface Props {
  content: MailEntryModel;
  translateInfo: TranslatStatusInfo;
  handleTranslateLang(value: string): void;
}
const TranslateTips: React.FC<Props> = ({ content, translateInfo, handleTranslateLang }) => {
  const {
    productVersionInfo: { productVersionId },
  } = useGetProductAuth();

  const originLang: string = content?.entry?.langListMap?.originLang || 'zh-CHS';

  const [selectedLang, setSelectedLang] = useState<string>('zh-CHS');

  // 翻译弹窗是否显示
  const [visibleTransModel, setVisibleTransModel] = useState<boolean>(false);
  // 翻译标签是否展示
  const tipsVisible = useMemo(() => translateInfo.status !== '', [translateInfo.status]);
  // 是否是灵犀版
  const isLimit = useMemo(() => productVersionId !== 'sirius', [productVersionId]);

  const visiblePreTrans = useMemo(() => {
    return translateInfo.status === '' && !originLang.includes('zh');
  }, [translateInfo.status, originLang]);

  const [visible, setVisible] = useState<boolean>(false);

  // 关闭翻译弹窗
  const cancelTranslate = useCallback(() => {
    setVisible(false);
    if (translateInfo.status === 'process') {
      handleTranslateLang('processCancel');
    }
  }, [translateInfo, handleTranslateLang]);

  // 熏染关闭按钮
  const closeIconBtn = useMemo(() => <div className="translate-tips-close translate-tips-close-div" onClick={cancelTranslate}></div>, [cancelTranslate]);

  // 付费提示
  const renderGroupEl = useMemo(() => {
    return (
      <>
        <span className="name">{getIn18Text('YIXIAFUFEIHOU')}</span>
        <Button
          type="primary"
          onClick={e => {
            setVisibleTransModel(true);
          }}
        >
          {getIn18Text('FUFEIKAITONG')}
        </Button>
      </>
    );
  }, []);

  // 渲染翻译下拉选择菜单
  const transSelectOptionsEL = useMemo(() => {
    const keys = Object.keys(translateLangMap);
    if (keys) {
      return keys.map((key, i) => {
        if (isLimit && i === 2) {
          return (
            <>
              <OptGroup label={renderGroupEl}>
                <Option disabled={true} value={key}>
                  {translateLangMap[key]}
                </Option>
              </OptGroup>
            </>
          );
        }
        return (
          <Option disabled={isLimit && i > 2} value={key}>
            {translateLangMap[key]}
          </Option>
        );
      });
    }
    return <></>;
  }, [isLimit]);

  // 翻译中EL
  const transLoadingEl = useMemo(() => {
    return (
      <>
        <Spin indicator={antIcon} />
        <div className="translate-tips-content" data-test-id="translate-loading">
          <div className="loading-name">{getIn18Text('FANYIZHONG..')}</div>
          {closeIconBtn}
        </div>
      </>
    );
  }, []);

  // 翻译前
  const preTransEl = useMemo(() => {
    return (
      <div className="translate-tips">
        <div className="translate-tips-pre-wrap">
          <TongyongCuowutishiMian wrapClassName="translate-icon-wrap" className="translate-tips-info-icon" />
          <span className="translate-pre-text">{getIn18Text('FANYIWEI')}</span>
          <Select
            defaultValue="zh-CHS"
            style={{ width: 70 }}
            dropdownClassName="translate-lang-dropdown-style"
            bordered={false}
            suffixIcon={<i className="expand-icon dark-invert" />}
            onChange={value => {
              setSelectedLang(value);
            }}
          >
            {transSelectOptionsEL}
          </Select>
          <span
            className="translate-pre-text2"
            onClick={() => {
              handleTranslateLang(selectedLang);
            }}
          >
            {getIn18Text('FANYIYOUJIAN')}
          </span>
          <div className="icon-close">
            <div
              className="translate-tips-close translate-tips-close-div"
              onClick={() => {
                cancelTranslate();
              }}
            ></div>
          </div>
        </div>
      </div>
    );
  }, [handleTranslateLang, transSelectOptionsEL, cancelTranslate, selectedLang]);

  // 翻译成功
  const transSuccessEl = useMemo(() => {
    return (
      <>
        <div className="translate-tips-icon translate-tips-success"></div>
        <div className="translate-tips-content" data-test-id="translate-tips-content">
          <div>
            <span>{getIn18Text('YIFANYIWEI')}</span>
            <Select
              defaultValue={translateInfo.to}
              style={{ width: 70 }}
              dropdownClassName="translate-lang-dropdown-style"
              bordered={false}
              suffixIcon={<i className="expand-icon dark-invert" />}
              onChange={value => {
                handleTranslateLang(value);
              }}
            >
              {transSelectOptionsEL}
            </Select>
            <span
              className="translate-tips-close-text"
              onClick={() => {
                handleTranslateLang('origin');
              }}
              data-test-id="translate-tips-close-text"
            >
              {getIn18Text('QUXIAOFANYI')}
            </span>
          </div>
          <div style={{ height: '32px', lineHeight: '32px', display: 'flex' }}>{closeIconBtn}</div>
        </div>
      </>
    );
  }, [translateInfo, handleTranslateLang, transSelectOptionsEL, closeIconBtn]);

  // 翻译失败EL
  const transFailEl = useMemo(() => {
    return (
      <>
        <div className="translate-tips-icon translate-tips-error"></div>
        <div className="translate-tips-content" data-test-id="translate-fail">
          <div>
            {translateInfo.code !== 500 ? htmlErrmsg.get(translateInfo.code) : (htmlErrmsg.get(translateInfo.code) as ErrorMessage)[translateInfo.errorMessage as string]}
            <span
              className="translate-tips-close-text"
              onClick={() => {
                handleTranslateLang('repeat');
              }}
            >
              {getIn18Text('ZHONGXINFANYI')}
            </span>
          </div>

          {closeIconBtn}
        </div>
      </>
    );
  }, [translateInfo, handleTranslateLang, closeIconBtn]);

  useEffect(() => {
    setVisible(true);
    if (translateInfo.status === 'error' && translateInfo.code) {
      SiriusMessage.error({
        content:
          translateInfo.code !== 500 ? htmlErrmsg.get(translateInfo.code) : (htmlErrmsg.get(translateInfo.code) as ErrorMessage)[translateInfo.errorMessage as string],
      });
    }
    if (
      translateInfo.status === 'error' &&
      (translateInfo.code === 101 || (translateInfo.code === 500 && ['11', '12', '14'].includes(translateInfo.errorMessage as string)))
    ) {
      setVisible(false);
    }
  }, [translateInfo]);

  return (
    <>
      {visible && tipsVisible ? (
        <>
          <div className="translate-tips" data-test-id="translate-tips-panel">
            {translateInfo.status === 'process' ? transLoadingEl : <></>}
            {translateInfo.status === 'success' ? transSuccessEl : <></>}
            {translateInfo.status === 'error' && translateInfo.code ? transFailEl : <></>}
          </div>
          {visibleTransModel ? (
            <TranslateModal
              visible={visibleTransModel}
              closeModal={() => {
                setVisibleTransModel(false);
              }}
            />
          ) : (
            <></>
          )}
        </>
      ) : (
        <></>
      )}
      {visible && visiblePreTrans ? preTransEl : null}
    </>
  );
};
export default TranslateTips;
