/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/alt-text */
import React, { useState, useRef, useReducer, useCallback, useContext, useEffect } from 'react';
import { Button, DatePicker } from 'antd';
import moment, { Moment } from 'moment';
import { apiHolder, apis, CustomerApi, IFollowModel } from 'api';
import { getTrail } from '@web-disk/utils';
import IconCard from '@web-common/components/UI/IconCard';
import locale from 'antd/es/date-picker/locale/zh_CN';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import { customerDataTracker } from '../../tracker/customerDataTracker';
import { FollowContext } from './follows';
import { AttachmentFileUpload, UploadFileStatus } from './upload';
import closeIcon from '@/images/icons/calendarDetail/closeCircle.svg';
import { ReactComponent as LinkIcon } from '@/images/mailCustomerCard/attachment-link.svg';
import { ReactComponent as CloackIcon } from '@/images/mailCustomerCard/cloack.svg';
import { EllipsisText } from '../ellipsisText/ellipsisText';
import style from './editor.module.scss';
import { getIn18Text } from 'api';
const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const ATTACHMENT_MAX_SIZE = 100 * 1024 * 1024;
const MAX_ATTACHEMENT_COUNT = 10;
function disabledDate(current: Moment) {
  return current && current < moment().startOf('day');
}
function range(start: number, end: number) {
  const result: number[] = [];
  for (let i = start; i < end; i++) {
    result.push(i);
  }
  return result;
}
function disabledTime(current: Moment | null) {
  const now = moment();
  if (current && current.isSame(now, 'day')) {
    const hour = now.hours();
    const minute = now.minutes();
    return {
      disabledHours: () => range(0, hour),
      disabledMinutes: () => range(0, minute),
      disabledSeconds: () => [] as number[],
    };
  }
  return {
    disabledHours: () => [],
    disabledMinutes: () => [],
    disabledSeconds: () => [],
  };
}
const uploaders: WeakMap<UploadFile, AttachmentFileUpload> = new WeakMap();
const datePresentFormat = 'YYYY-MM-DD HH:mm';
const dateFormat = 'YYYY-MM-DD HH:mm:SS';
export interface FollowEditorProps {
  options?: {
    autoOpen?: boolean;
  };
  onSave?: (follow: IFollowModel) => void;
  className?: string;
  onCancelEdit?: () => void;
  foldClassName?: string;
}
export const FollowEditor = (props: FollowEditorProps) => {
  const { options, onCancelEdit, className, foldClassName } = props;
  const [isFold, setIsFold] = useState(!options?.autoOpen);
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [followAt, setFollowAt] = useState<Moment | null>(null);
  const [nextFollowTime, setNextFollowTime] = useState<Moment | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFollowAtChanged, setIsFollowAtChanged] = useState(false); // 打点需要
  const [pickerOpened, setPickerOpened] = useState(false);
  const { id, type } = useContext(FollowContext);
  const [attachmentList, dispatch] = useReducer(
    (
      state: UploadFile[],
      action: {
        type: string;
        payload: UploadFile[];
      }
    ) => {
      switch (action.type) {
        case 'append': {
          return [...state, ...action.payload];
        }
        case 'remove': {
          return state.filter(i => i !== action.payload[0]);
        }
        case 'set': {
          return [...action.payload];
        }
        case 'update': {
          return [...state];
        }
        default:
          return state;
      }
    },
    []
  );
  const reset = () => {
    setIsFold(true);
    setNextFollowTime(null);
    setFollowAt(null);
    setIsFollowAtChanged(false);
    dispatch({
      type: 'set',
      payload: [],
    });
  };
  // 切换客户
  useEffect(() => {
    setIsFold(true);
    setContent('');
    setNextFollowTime(null);
    setFollowAt(null);
    setIsFollowAtChanged(false);
    dispatch({
      type: 'set',
      payload: [],
    });
  }, [id]);
  useEffect(() => {
    if (options?.autoOpen) {
      setIsFold(false);
    }
  }, [options]);
  const onFileSelectorClick = () => {
    fileRef.current?.click();
  };
  const onFileSelect = async (files: Array<File>) => {
    const currentCount = attachmentList.length;
    const incomingCount = files.length;
    if (incomingCount + currentCount > MAX_ATTACHEMENT_COUNT) {
      toast.warn({ content: `最多只能添加${MAX_ATTACHEMENT_COUNT}个附件` });
      return;
    }
    if (files.some(file => file.size > ATTACHMENT_MAX_SIZE)) {
      toast.warn({ content: getIn18Text('DANGEFUJIANXIANZHIWEI100M') });
      return;
    }
    // todo 上传接口换成外贸自己
    // const { id: dirId } = await getFollowsDir('tobeChanged');
    const uploadFiles = files.map(file => {
      const attachment: UploadFile = {
        uid: 'attachment_' + new Date(),
        name: file.name,
        file,
        fileType: getTrail(file.name).toUpperCase(),
        progress: 0,
        size: file.size,
        status: UploadFileStatus.UPLOADING,
      };
      const uploader = new AttachmentFileUpload(file);
      uploaders.set(attachment, uploader);
      const onProgress = ({ progress }: { progress: number }) => {
        attachment.progress = progress;
        dispatch({
          type: 'update',
          payload: [attachment],
        });
      };
      const onStatusChange = (status: UploadFileStatus) => {
        attachment.status = status;
        dispatch({
          type: 'update',
          payload: [attachment],
        });
      };
      uploader.on('progress', onProgress);
      uploader.on('statusChange', onStatusChange);
      uploader.on('uploadFinish', data => {
        attachment.serverData = data;
        dispatch({
          type: 'update',
          payload: [attachment],
        });
      });
      // todo 是否需要队列
      uploader.startUpload();
      return attachment;
    });
    dispatch({
      type: 'append',
      payload: uploadFiles,
    });
  };
  const onDragEvent = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.type === 'dragenter') {
      setIsDragOver(true);
    } else {
      setIsDragOver(false);
    }
  };
  const onFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.type === 'dragover') {
      setIsDragOver(true);
      return;
    }
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      onFileSelect(files);
      setIsDragOver(false);
    }
  };
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      onFileSelect(Array.from(files));
      e.target.value = '';
    }
  };
  const removeFile = (file: UploadFile) => {
    if (uploaders.has(file)) {
      // 取消上传
      uploaders.get(file)?.cancelUpload();
      uploaders.get(file)?.removeAllListeners();
      uploaders.delete(file);
    }
    dispatch({
      type: 'remove',
      payload: [file],
    });
  };
  const handleSave = useCallback(() => {
    const hasUnCompleteAttachment = attachmentList.some(file => file.status !== UploadFileStatus.DONE);
    // 受控组件输入响应慢
    if (hasUnCompleteAttachment) {
      toast.warn({ content: getIn18Text('YOUFUJIANWEISHANGCHUANWANCHENG\uFF0CQINGSHANCHUHUOZHEDENGDAISHANGCHUANWANCHENG') });
      return;
    }
    if (!content) {
      toast.warn({ content: getIn18Text('GENJINNEIRONGBUNENGWEIKONG') });
      return;
    }
    const params: IFollowModel = {
      // company_id: Number(id),
      content,
      follow_at: (followAt || moment()).format(dateFormat),
      type: 0,
    };
    if (nextFollowTime) {
      params.next_follow_at = nextFollowTime.format(dateFormat);
    }
    if (attachmentList.length) {
      params.attachment = JSON.stringify(
        attachmentList.map(a => ({
          name: a.serverData?.file_name ?? a.name,
          size: a.size,
          docId: a.serverData.id,
        }))
      );
    }
    const types: Record<string, boolean> = {};
    attachmentList.forEach(file => {
      const splitName = file.name.split('.');
      const type = splitName.length > 1 ? splitName.pop() : '';
      if (type && !types[type]) {
        types[type] = true;
      }
    });
    customerDataTracker.trackFollowAdd(type, {
      ifEditThisFollowupTime: isFollowAtChanged,
      ifAddNextFollowUpTime: nextFollowTime !== null,
      ifAddAttachment: attachmentList.length > 0,
      AttachmentType: Object.keys(types).join(','),
    });
    customerApi.addFollow(id, type, params).then(isSuccess => {
      // todo add Success
      if (isSuccess) {
        reset();
        setContent('');
        // eslint-disable-next-line react/destructuring-assignment
        props.onSave && props.onSave(params);
      }
    });
  }, [attachmentList, content, followAt, nextFollowTime, isFollowAtChanged]);
  return (
    <div className={classnames(className, style.followEditor)}>
      {isFold && (
        <Input
          placeholder={getIn18Text('TIANJIAGENJINJILU...')}
          onClick={() => {
            setIsFold(false);
            setFollowAt(moment());
          }}
          className={foldClassName}
          style={{ fontSize: 14 }}
        />
      )}
      {!isFold && (
        <div>
          <div
            className={classnames([style.editorWrap, { [style.dragEnter]: isDragOver }])}
            onDrop={onFileDrop}
            onDragOver={onFileDrop}
            onDragEnter={onDragEvent}
            onDragLeave={onDragEvent}
          >
            <Input.TextArea
              autoSize={{ minRows: 5, maxRows: 16 }}
              autoFocus
              placeholder={getIn18Text('KUAISUTIANJIAGENJIN\uFF0CKETUOZHUAITUPIANHUOFUJIANZHICIQUYU')}
              maxLength={2000}
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <div className={style.attachmentContainer}>
              <div className={style.attachmentList}>
                {attachmentList.map(file => (
                  <div className={style.attachmentItem} key={file.uid}>
                    <img className={style.closeIcon} src={closeIcon} onClick={() => removeFile(file)} />
                    <div className={style.attachment}>
                      <span className={style.attachmentIcon}>
                        <IconCard type={file.fileType as any} />
                      </span>
                      <EllipsisText text={file.name} footerLength={file.fileType.length} className={style.fileName} />
                    </div>
                    {file.status === UploadFileStatus.UPLOADING && (
                      <div className={style.progress}>
                        <div className={style.progressInner} style={{ width: (file.progress || 0) + '%' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className={style.attachmentLink}>
                <span onClick={onFileSelectorClick} className={style.floatAttachmentIcon}>
                  <LinkIcon />
                  {getIn18Text('FUJIAN')}
                </span>
                <CloackIcon onClick={() => setPickerOpened(true)} style={{ verticalAlign: '4px' }} />
                <DatePicker
                  open={pickerOpened}
                  className={style.datepicker}
                  placeholder={getIn18Text('XIACIGENJINSHIJIAN')}
                  suffixIcon={null}
                  format={datePresentFormat}
                  onOpenChange={setPickerOpened}
                  locale={locale}
                  value={nextFollowTime}
                  onChange={d => setNextFollowTime(d)}
                  disabledDate={disabledDate}
                  disabledTime={disabledTime}
                  showTime
                  dropdownClassName="edm-date-picker-dropdown-wrap"
                  allowClear={false}
                  bordered={false}
                />
                <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={onChange} multiple />
              </div>
            </div>
            <div className={style.dragEnterMask}>
              <div style={{ textAlign: 'center' }}>
                <IconCard type="doUpload" />
                <div>{getIn18Text('TIANJIAZHIFUJIAN')}</div>
              </div>
            </div>
          </div>
          <div className={style.footer}>
            <Button
              type="default"
              onClick={() => {
                setIsFold(true);
                onCancelEdit && onCancelEdit();
              }}
            >
              {getIn18Text('QUXIAO')}
            </Button>
            <Button type="primary" onClick={handleSave}>
              {getIn18Text('TIANJIA')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
export interface UploadFile {
  file: File;
  uid: string;
  name: string;
  size: number;
  fileType: string;
  status?: UploadFileStatus;
  progress?: number;
  serverData?: any;
}
let index = 0;
export default function uid() {
  // eslint-disable-next-line no-plusplus
  return `rc-upload-${+new Date()}-${++index}`;
}
