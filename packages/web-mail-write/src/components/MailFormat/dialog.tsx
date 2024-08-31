import React, { useEffect, useState, useLayoutEffect } from 'react';
import { apiHolder, DataStoreApi } from 'api';
import './format.scss';

const DataStore = apiHolder.api.getDataStoreApi() as DataStoreApi;
// mfDialogTipState表示邮件模板的提示状态 init 初始态，显示弹层  setp 弹层已关闭，显示tooltip提示 FINE.流程已完成，都不显示
enum EnumMfDialogState {
  INIT = 'INIT',
  STEP = 'STEP',
  FINE = 'FINE',
}
const StoreName = 'mfDialogTipState';
const imgList = [
  {
    groupId: '4791136',
    id: '469165',
    url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/c5b8f2ff1a2c40e685f1d7ea97e0e406.png',
  },
  {
    groupId: '4791139',
    id: '48164112',
    url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/33e7b615679c466289c48bf5fa0b4a69.png',
  },
  {
    groupId: '4791140',
    id: '33968776',
    url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/7b283f0ce7114397a7ce2077638f6646.png',
  },
  {
    groupId: '4791141',
    id: '33944966',
    url: 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/05/26/411e7cda97374fc7b9a42e2c972a3458.jpeg',
  },
];
interface Props {
  dialogTipState: EnumMfDialogState;
  handleNext: () => void;
  showMfDialog: (item?: any) => void;
  showMfEdit: (groupId?: string, id?: string) => void;
  // className: string;
}

const MailFormatDialog: React.FC<Props> = props => {
  // const {handleNext, dialogTipState, showMfDialog, showMfEdit, className} = props
  const { handleNext, dialogTipState, showMfDialog, showMfEdit } = props;
  const [warpClassName, setWrapClassName] = useState('hidden');
  const [dialogDisplay, setDialogDisplay] = useState(false);

  useLayoutEffect(() => {
    if (dialogTipState == EnumMfDialogState.INIT) {
      if (warpClassName.includes('hidden')) {
        setWrapClassName('pre-show');
        setDialogDisplay(true);
      }
    } else if (warpClassName.includes('show')) {
      setWrapClassName('show pre-hidden');
    }
  }, [dialogTipState]);

  useLayoutEffect(() => {
    if (warpClassName.includes('pre-show')) {
      setTimeout(() => {
        setWrapClassName('pre-show show');
      }, 10);
    }
    if (warpClassName.includes('pre-hidden')) {
      setTimeout(() => {
        setWrapClassName('hidden');
        setDialogDisplay(false);
      }, 1000);
    }
  }, [warpClassName]);

  return (
    // <div  className={`mf-dialog ${warpClassName} ${className}`} style={{display:dialogDisplay?'block':'none'}}   >
    <div className={`mf-dialog ${warpClassName}`} style={{ display: dialogDisplay ? 'block' : 'none' }}>
      <div className="mf-dialog-head-wrap">
        <div className="mf-dialog-title">添加一个模板图片试试吧</div>
        <div className="mf-dialog-oper-wrap">
          <div className="btn btn-never" onClick={handleNext}>
            不再提醒
          </div>
        </div>
      </div>
      <div className="mf-dialog-contet-wrap">
        <div className="mf-dialog-imglist">
          {imgList.map((item, index) => (
            <div
              className="mf-dialog-imgitem"
              key={index}
              onClick={() => {
                showMfEdit(item.groupId, item.id);
              }}
            >
              <div className="mf-dialog-img" style={{ backgroundImage: `url(${item.url})` }} />
            </div>
          ))}
          <div className="btn mf-dialog-loadmore" onClick={() => showMfDialog()}>
            更多模板
          </div>
        </div>
      </div>
    </div>
  );
};

export default MailFormatDialog;
