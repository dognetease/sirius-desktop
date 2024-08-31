import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { apiHolder, apis, FFMSApi, FFMSRate } from 'api';
import { message } from 'antd';
import { useMount, useCountDown } from 'ahooks';
import icon from '@web-common/components/UI/Icons/svgs';
const { TongyongShuomingMian } = icon;
import style from './style.module.scss';
const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;

interface Props {
  update: () => void;
}

const Message = forwardRef((props: Props, ref) => {
  const [targetDate, setTargetDate] = useState<number>();
  const [notice, setNotice] = useState<FFMSRate.ImportInfo>();
  const [showMesage, setShowMessage] = useState<boolean>(false);

  const [countdown] = useCountDown({
    targetDate,
    onEnd: () => {
      setShowMessage(false);
    },
  });

  const cancleImport = () => {
    ffmsApi.ffImportRecall().then(res => {
      message.success('取消成功');
      setShowMessage(false);
      props.update();
    });
  };

  const getImportInfo = () => {
    ffmsApi.ffImportRecallInfo().then(res => {
      if (res?.countDownSeconds > 0) {
        setShowMessage(true);
        setNotice(res);
        setTargetDate(Date.now() + res.countDownSeconds * 1000);
      }
    });
  };
  useMount(() => {
    getImportInfo();
  });

  useImperativeHandle(ref, () => ({
    getImportInfo,
  }));

  return showMesage && notice ? (
    <div className={style.messageBox}>
      <TongyongShuomingMian />
      <div>
        {notice.importType === 'FILE' ? `从“${notice.fileName}”上传，` : notice.importType === 'PICTURE' ? `从图片“${notice.fileName}”上传，` : '从文本上传，'}
        {`${notice.validCount + notice.updateCount}
      航线数据已更新，其中${notice.validCount}条新增数据，${notice.updateCount}条已有数据更新！
      ${notice.invalidCount}条待生效数据 ，若操作有误，${Math.round(countdown / 1000)}秒内，可进行撤销,`}
      </div>
      <a onClick={cancleImport}> 取消导入 </a>
    </div>
  ) : null;
});
export default Message;
