import React, { useState, useRef, useEffect } from 'react';
import { apiHolder, apis, FeedbackApi, SystemApi, LoggerApi } from 'api';
import { Radio, Input, Divider, Checkbox, Button, message } from 'antd';
import classnames from 'classnames';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import Alert from '@web-common/components/UI/Alert/Alert';
import { downloadFile } from '@web-common/components/util/file';
import IconCard from '@web-common/components/UI/IconCard';
import MoreOutlined from '@ant-design/icons/MoreOutlined';
import SwapRightOutlined from '@ant-design/icons/SwapRightOutlined';
import styles from './feedbackContent.module.scss';
import { LagBasicContent, LagCollectionContent } from './lagBasicContent';
import { getIn18Text } from 'api';

interface FeedbackContentProps {
  cancel?: () => void;
}
interface graphic {
  url?: string;
  status?: string;
  type: string;
  formatType: string;
  name: string;
  fileCreateTime: number;
  size: number;
}
const loggerApi = apiHolder.api.requireLogicalApi(apis.loggerApiImpl) as LoggerApi;
const fileApi = apiHolder.api.getFileApi();
const eventApi = apiHolder.api.getEventApi();
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const inElectron = systemApi.isElectron();
const isMac = inElectron && window.electronLib?.env?.isMac;
const platform = inElectron ? (isMac ? 'mac' : 'win') : 'web';
const feedbackApi = apiHolder.api.requireLogicalApi(apis.feedbackApiImpl) as FeedbackApi;
const { TextArea } = Input;
const FeedbackContent: React.FC<FeedbackContentProps> = props => {
  const { cancel } = props;
  // 功能模块
  const [module, setModule] = useState<string>('mail');
  // 问题描述
  const [desc, setDesc] = useState<string>('');
  // 是否显示问题描述错误提示
  const [descErr, setDescErr] = useState<boolean>(false);
  // 是否选中发送日志
  const [logFlag, setLogFlag] = useState<boolean>(true);
  // 内容提交中
  const [submiting, setSubmiting] = useState<boolean>(false);
  // 相关图片或视频列表
  const [graphicList, setGraphicList] = useState<graphic[]>([]);
  // 上传节点
  const inputRef = useRef<HTMLInputElement>(null);
  const init = () => {
    setModule('mail');
    setDesc('');
    setDescErr(false);
    setLogFlag(true);
    setSubmiting(false);
    setGraphicList([]);
  };
  // 上传方法
  const upload = async (file: File, fileName: string, type: string) => {
    const formatType = file.type?.split('/')[1];
    const res = await loggerApi.uploadNosMediaOrLog(file, fileName, type);
    if (res === 'success') {
      type !== 'log' && SiriusMessage.success({ content: getIn18Text('SHANGCHUANCHENGGONG') });
    } else {
      SiriusMessage.error({ content: getIn18Text('SHANGCHUANSHIBAI') });
    }
    return res;
  };
  // 上传文件处理
  const inputChange = async () => {
    const files = inputRef?.current?.files;
    const userEmail = systemApi.getCurrentUser()?.id;
    if (files && files[0]) {
      const maxSize = 500 * 1024 * 1024;
      if (files[0].size > maxSize) {
        SiriusMessage.warn({ content: getIn18Text('WENJIANZUIDAZHI') });
        return;
      }
      // 先将资源填入
      const url = URL.createObjectURL(files[0]);
      const fileType = files[0].type?.split('/')[0];
      const fileNameArr = files[0].name?.split('.') || [];
      const formatType = fileNameArr.reverse()[0] || '';
      const type = ['image', 'video'].includes(fileType) ? fileType : 'file';
      const fileName = `clieng-log/sirius/${platform}/${userEmail}/${Date.now()}-0.${formatType}`;
      const ingGraphic = [
        {
          url,
          type,
          formatType,
          status: 'uploading',
          name: fileName,
          fileCreateTime: Date.now(),
          size: files[0].size,
        },
      ];
      const prevGraphicList = [...graphicList];
      setGraphicList([...prevGraphicList, ...ingGraphic]);
      // 调用上传方法
      const uploadRes = await upload(files[0], fileName, formatType);
      if (uploadRes === 'success') {
        const sucGraphic = [
          {
            ...ingGraphic[0],
            status: 'success',
          },
        ];
        setGraphicList([...prevGraphicList, ...sucGraphic]);
      } else {
        // 失败取消填入
        setGraphicList(prevGraphicList);
      }
    }
  };
  // 关闭问题反馈页面
  const handleCancel = () => {
    init();
    if (inElectron) {
      systemApi.closeWindow();
    }
    cancel && cancel();
  };
  // 保存日志信息到本地
  const saveLogs = async () => {
    // electron中日志信息来自已保存的路径下，web中日志信息来自indexDb查询
    if (inElectron) {
      const res = await window.electronLib?.fsManage?.logsToArrayBuf();
      const { success, name, path } = res;
      if (success) {
        fileApi.downloadLocalFile({
          fileName: name,
          filePath: path,
        });
      } else {
        SiriusMessage.error({ content: getIn18Text('BAOCUNSHIBAI') });
      }
    } else {
      const logBlobArray = await loggerApi.getWebLogs();
      if (!logBlobArray || !logBlobArray.size) {
        return;
      }

      [...logBlobArray.keys()].forEach(item => {
        const logFile = new File([logBlobArray.get(item)!], `${item}.log`);
        downloadFile(logFile, 'log.log');
      });
    }
  };
  // 确认提交问题反馈信息
  const handleSubmit = async (flag: boolean = false) => {
    setSubmiting(true);
    const deviceInfo = await systemApi.getDeviceInfo();
    const userEmail = systemApi.getCurrentUser()?.id;
    let _desc = '';
    if (module === 'hang') {
      _desc = getIn18Text('KADUNFANKUI：') + lagBasicContentRef.current.getContent() + JSON.stringify(lagCollectionContentRef.current.getContent().content);
    } else {
      _desc = desc;
    }

    const params = {
      email: userEmail || '',
      productId: deviceInfo.p === 'web' ? 'sirius' : deviceInfo.p,
      deviceId: '',
      platform,
      version: window.siriusVersion,
      systemVersion: deviceInfo._systemVersion,
      module,
      description: _desc,
      files: graphicList.map((item: graphic) => {
        const { type, name, fileCreateTime, size } = item;
        return {
          type,
          name,
          fileCreateTime,
          size,
        };
      }),
    };
    // 如果选择中发送日志，先上传日志再提交
    if (logFlag || flag) {
      let fileName = `clieng-log/sirius/${platform}/${userEmail}/${Date.now()}-0`;
      const logFileMap: Map<string, File> = new Map();
      // electron中日志信息来自已保存的路径下，web中日志信息来自indexDb查询
      if (inElectron) {
        const electronRes = await window.electronLib?.fsManage?.logsToArrayBuf();
        fileName = `${fileName}.zip`;
        logFileMap.set(fileName, new File([electronRes?.data], fileName, { type: 'application/zip' }));
      } else {
        const logBlobArray = await loggerApi.getWebLogs();
        [...logBlobArray.keys()].forEach(logName => {
          logFileMap.set(`${fileName}.${logName}.log`, new File([logBlobArray.get(logName)!], `${fileName}.${logName}.log`));
        });
      }
      // 调用上传方法

      const uploadRes = await Promise.all([...logFileMap.keys()].map(_fileName => upload(logFileMap.get(_fileName)!, _fileName, 'log')));
      const suc = new Set(uploadRes).size === 1 && uploadRes.includes('success');

      if (suc) {
        [...logFileMap.keys()].forEach(_fileName => {
          const singleFile = logFileMap.get(_fileName)!;
          params.files.push({
            type: 'log',
            name: _fileName,
            fileCreateTime: Date.now(),
            size: singleFile.size,
          });
        });
      } else {
        setSubmiting(false);
        SiriusMessage.error(getIn18Text('RIZHISHANGCHUANSHI'));
        return;
      }
    }
    const feedbackRes = await feedbackApi.submitFeedback(params);
    if (feedbackRes.success) {
      setSubmiting(false);
      SiriusMessage.success(getIn18Text('GANXIENINDEFAN')).then(r => {
        handleCancel();
      });
    } else {
      setSubmiting(false);
      SiriusMessage.error(getIn18Text('TIJIAOSHIBAI'));
    }
  };
  // 提交前的提示
  const beforeSubmit = () => {
    if (!desc.trim() && module !== 'hang') {
      setDesc('');
      setDescErr(true);
      return;
    }
    if (module === 'hang' && lagCollectionContentRef.current?.getContent()?.status === 'ing') {
      message.info(getIn18Text('QINGDENGDAICAIJIWANCHENG'));
      return;
    }
    if (graphicList.some(item => item.status === 'uploading')) {
      SiriusMessage.info({ content: getIn18Text('WENJIANSHANGCHUANZHONG11') });
      return;
    }
    if (!logFlag) {
      const al = Alert.error({
        title: getIn18Text('NINWEITONGYIFA'),
        content: getIn18Text('FASONGRIZHIXIN1'),
        funcBtns: [
          {
            text: getIn18Text('BULE\uFF0CZHIJIE'),
            onClick: () => {
              handleSubmit();
              al.destroy();
            },
          },
          {
            text: getIn18Text('TIJIAOBINGFASONG'),
            type: 'primary',
            onClick: () => {
              setLogFlag(true);
              handleSubmit(true);
              al.destroy();
            },
          },
        ],
      });
    } else {
      handleSubmit();
    }
  };
  // 点击手动触发上传
  const uploadGraphic = () => {
    inputRef.current?.click();
  };
  // 删除已上传文件
  const deleteGraphic = (index: number) => {
    const nextGraphicList = [...graphicList];
    nextGraphicList.splice(index, 1);
    setGraphicList(nextGraphicList);
  };
  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('electronClose', { func: () => init() });
    return () => {
      eventApi.unregisterSysEventObserver('electronClose', eid);
    };
  }, []);

  const lagBasicContentRef = useRef({
    getContent() {
      return '';
    },
  });

  const lagCollectionContentRef = useRef({
    getContent() {
      return { status: '', content: '' };
    },
  });

  return (
    <div className={classnames(styles.feedbackContent, inElectron ? styles.feedbackContentApp : '')}>
      <p className={styles.feedbackContentTitle}>{getIn18Text('WENTIFANKUI')}</p>
      <div className={styles.feedbackContentModule}>
        <p className={styles.feedbackContentSubTitle}>
          <span className={styles.feedbackContentRequired}>* </span>
          {getIn18Text('GONGNENGMOKUAI\uFF1A')}
        </p>
        <Radio.Group buttonStyle="outline" onChange={e => setModule(e.target.value)} value={module}>
          <Radio value="mail">{getIn18Text('YOUXIANG')}</Radio>
          <Radio value="im">{getIn18Text('XIAOXI')}</Radio>
          <Radio value="schedule">{getIn18Text('RILI')}</Radio>
          <Radio value="cdoc">{getIn18Text('YUNWENDANG')}</Radio>
          <Radio value="contact">{getIn18Text('TONGXUNLU')}</Radio>
          <Radio value="hang">{getIn18Text('KADUN')}</Radio>
          <Radio value="other">{getIn18Text('QITA')}</Radio>
        </Radio.Group>
      </div>
      {module !== 'hang' ? (
        <div className={styles.feedbackContentDesc}>
          <p className={styles.feedbackContentSubTitle}>
            <span className={styles.feedbackContentRequired}>* </span>
            {getIn18Text('WENTIMIAOSHU\uFF1A')}
          </p>
          <TextArea
            placeholder={getIn18Text('QINGXIANGXIMIAOSHU')}
            value={desc}
            showCount
            maxLength={1000}
            onChange={e => {
              setDescErr(false);
              setDesc(e.target.value);
            }}
          />
          {descErr && <p className={styles.feedbackContentErr}>{getIn18Text('QINGXIANGXIMIAOSHU')}</p>}
        </div>
      ) : null}
      {module === 'hang' ? (
        <>
          <div>
            <p className={styles.feedbackContentSubTitle}>
              <span className={styles.feedbackContentRequired}>* </span>
              <b>{getIn18Text('WENTIMIAOSHU')}</b>
            </p>
            <LagBasicContent ref={lagBasicContentRef} />
          </div>
          <div>
            <p className={styles.feedbackContentSubTitle}>
              <span className={styles.feedbackContentRequired}>* </span>
              <b>{getIn18Text('CAIJIKADUNXINXI')}</b>
            </p>
            <LagCollectionContent ref={lagCollectionContentRef} />
          </div>
        </>
      ) : null}
      <div className={styles.feedbackContentGraphic}>
        <p className={styles.feedbackContentSubTitle}>{getIn18Text('SHANGCHUANXIANGGUANFU')}</p>
        {module === 'hang' ? (
          <>
            {platform === 'web' ? (
              <p className={styles.feedbackNote}>
                {getIn18Text('WEILEGENGJINGZHUNKUAISU')}
                <MoreOutlined />
                <SwapRightOutlined />
                {getIn18Text('GENGDUOGONGJU')}
                <SwapRightOutlined />
                {getIn18Text('RENWUGUANLIQI')}
              </p>
            ) : null}

            {platform === 'mac' ? <p className={styles.feedbackNote}>{getIn18Text('WEILEGENGJINGZHUNKUAISU')}</p> : null}
            {platform === 'win' ? <p className={styles.feedbackNote}>{getIn18Text('WEILEGENGJINGZHUNKUAISU')}</p> : null}
          </>
        ) : null}
        <div className={styles.feedbackContentUpload}>
          <div className={styles.feedbackContentUploadItems}>
            {graphicList.map((item, index) => (
              <div className={styles.feedbackContentUploadItem}>
                <div className={styles.feedbackContentUploadGraphic}>
                  <IconCard type={item.formatType as any} />
                  {item.status === 'uploading' && <div className={styles.feedbackContentUploadIng} />}
                </div>
                {item.status !== 'uploading' && <div className={styles.feedbackContentUploadDelete} onClick={() => deleteGraphic(index)} />}
              </div>
            ))}
            {!graphicList.some(item => item.status === 'uploading') && graphicList.length < 5 && (
              <div className={styles.feedbackContentUploadIcon} onClick={() => uploadGraphic()} />
            )}
            <input
              ref={inputRef}
              type="file"
              accept="*/*"
              className={styles.feedbackContentUploadInput}
              onClick={e => {
                (e.target as HTMLInputElement).value = '';
              }}
              onChange={inputChange}
            />
          </div>
          <span className={styles.feedbackContentUploadCount}>
            {graphicList.length}
            /5
          </span>
        </div>
      </div>
      <div className={styles.feedbackContentFoot}>
        <Divider />
        <div className={styles.feedbackContentChoose}>
          <Checkbox checked={logFlag} className={styles.feedbackContentCheck} onChange={e => setLogFlag(e.target.checked)}>
            {getIn18Text('FASONGRIZHIXIN')}
          </Checkbox>
          <span className={styles.feedbackContentSave} onClick={() => saveLogs()}>
            {getIn18Text('DIANJIBAOCUNRI')}
          </span>
          <div className={styles.feedbackContentBtns}>
            <Button onClick={() => handleCancel()}>{getIn18Text('QUXIAO')}</Button>
            <Button onClick={() => beforeSubmit()} loading={submiting} type="primary">
              {getIn18Text('TIJIAO')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FeedbackContent;
