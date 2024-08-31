import React, { useEffect, useState, useCallback, useRef, ChangeEvent, useMemo } from 'react';
import { Button, Dropdown, Menu, Tooltip, Input, DatePicker } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import {
  apis,
  apiHolder,
  NetStorageApi,
  DataTrackerApi,
  RequestNSFileCreateInfo,
  DataStoreApi,
  NSCreateFileType,
  NetStorageShareApi,
  SystemApi,
  ResponseExternalShareStatistic,
  RequestGetExternalShareList,
} from 'api';
import moment, { Moment } from 'moment';
import locale from 'antd/es/date-picker/locale/zh_CN';
import IconCard from '@web-common/components/UI/IconCard/index';
import BreadComp from '../BreadComp';
import { formatAuthority, normalizeShareUrl, CONVERT_MAX_SIZE, MB_SIZE, getConvertFileType } from '../../utils';
import useBreadEllipsisIndex from '../../commonHooks/useBreadEllipsisIndex';
import { toastUploadPrivilegeError } from '../Upload';
import { IUploadFile, UploadFileStatus } from '../../upload';
import { mulTableDropItem, docTrakerInfo, unitableType } from '../../helper/constant';
import { DiskPage, trackTypeMap, Bread, DiskTipKeyEnum, checkDiskGuideTipsPriority } from '../../disk';
import style from './diskHead.module.scss';
import { UploadConvert } from '../../upload-convert';
import { getFileExt } from '@web-common/components/util/file';
import { DiskActions, useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { useCheckCreateUnitableAvailable } from '../../commonHooks/useCheckCreateUnitableAvailable';
import { DOC_VALUES } from 'components/TemplateModal/definition';
import { trackerCreateBaseCached } from '../MainPage/extra';
import { useLocation } from '@reach/router';
import { getIn18Text } from 'api';

export interface Props {
  bread: Bread[];
  list: any;
  curDirId: number;
  defaultVisitRangeTime?: [number, number];
  currentPage?: DiskPage;
  setCurrentPage?: (val: DiskPage) => void;
  externalShareStatisticCounts?: Partial<ResponseExternalShareStatistic>;
  changeExternalShareList?: (params?: Partial<RequestGetExternalShareList>) => void;
  createDirShow?: () => void;
  templateModalShow?: (eventFrom: 'Banner' | 'List', docType?: DOC_VALUES) => void;
  setCurrentDirId?: (val) => void;
  changeCurrentDetail?: (val) => void;
  upload: (curDirInfo: any) => void;
  getCurrentList: ({ init: boolean }) => void;
  setUploadFileItems: (items: IUploadFile[] | ((items: IUploadFile[]) => IUploadFile[])) => void;
  onUploadDone: (file: IUploadFile) => void;
  listLoading: boolean;
  setVisibleUpload: (val: boolean) => void;
  hideNewUpload?: boolean;
}
type RangerDataType = [Moment, Moment];
interface RangerPickProps {
  visible: boolean;
  value?: RangerDataType;
  onChange: (startTime: Moment, endTime: Moment) => void;
  onRangerChange?: (list: RangerDataType) => void;
}
const IMPORT_EVENT_ID = 'pcDisk_Importonlinefile';
enum ImportResult {
  Success = 'success',
  Fail = 'fail',
}
export enum ImportResultReason {
  FileLimit = getIn18Text('CHAOGUO200'),
  DiskLimit = getIn18Text('WANGPANRONGLIANGBU'),
  NetworkOrOther = getIn18Text('WANGLUOWENTIHUO'),
  CellLimit = getIn18Text('YOUJIEDUAN'),
  Success = getIn18Text('CHENGGONGDAORU'),
}
const tabMap = {
  private: 'personal',
  public: 'ent',
  recently: 'personal',
};
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const dataStoreApi: DataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const nsShareApi = apiHolder.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const { RangePicker } = DatePicker;
const transTime = (rangeTime): RangerDataType => {
  const startTime = rangeTime[0];
  const endTime = rangeTime[1];
  return [moment(startTime), moment(endTime)];
};
const RangerPick: React.FC<RangerPickProps> = props => {
  const { visible, value, onRangerChange, onChange } = props;
  const startTime = moment();
  const endTime = moment().add(1, 'M');
  const rangerMoment = useRef<any>(value || [startTime, endTime]);
  const setRangerMoment = (list: any) => {
    rangerMoment.current = list;
  };
  useEffect(() => {
    value && setRangerMoment(value);
  }, [value]);
  return (
    <div className={style.rangerWrap} hidden={!visible}>
      <RangePicker
        onOpenChange={open => {
          const start = rangerMoment.current[0];
          const end = rangerMoment.current[1];
          if (!open && start && end) {
            onChange(start, end);
          }
        }}
        onChange={list => {
          if (list && list[0] && list[1]) {
            setRangerMoment(list);
            onRangerChange && onRangerChange(list as RangerDataType);
          }
        }}
        dropdownClassName={style.rangerPickerDropdownWrap}
        inputReadOnly
        value={rangerMoment.current}
        allowClear={false}
        format="YYYY.MM.DD"
        bordered={false}
        locale={locale}
        separator="-"
        suffixIcon={null}
        className={style.rangerPicker}
      />
    </div>
  );
};
// eslint-disable-next-line max-statements
const DiskHead: React.FC<Props> = props => {
  const {
    bread,
    createDirShow,
    currentPage,
    defaultVisitRangeTime,
    setCurrentPage,
    setCurrentDirId,
    upload,
    list,
    changeCurrentDetail,
    changeExternalShareList,
    getCurrentList,
    setUploadFileItems,
    onUploadDone,
    listLoading,
    setVisibleUpload,
    hideNewUpload,
  } = props;
  const curContWidth = useAppSelector(state => state.diskReducer.curContWidth);
  const curSideTab = useAppSelector(state => state.diskReducer.curSideTab);
  const curRootInfo = useAppSelector(state => state.diskReducer.curRootInfo);
  const curDirId = useAppSelector(state => state.diskReducer.curDirId);
  const guideTipsInfo = useAppSelector(state => state.diskReducer.guideTipsInfo);
  const breadRef = useRef<HTMLDivElement>(null);
  const breadListRef = useRef<Bread[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const oprButtsRef = useRef<HTMLDivElement>(null);
  const [currentDetail, setCurrentDetail] = useState<any>({});
  const [authorityText, setAuthorityText] = useState<any>('');
  const [canAddDir, setCanAddDir] = useState(true);
  const [canAddFile, setCanAddFile] = useState(true);
  const [tipVisible, setTipVisible] = useState(false);
  const [unitableTipVisible, setUnitableTipVisible] = useState(false);
  const [unitableTipCanShow, setUnitableTipCanShow] = useState(true);
  const [showCreateRanger, setShowCreateRanger] = useState<boolean>(false);
  const [showVisitRanger, setShowVisitRanger] = useState<boolean>(false);
  const [visitSelectValue, setVisitSelectValue] = useState<number>(-1);
  const [visitRangeTime, setVisitRangeTime] = useState<RangerDataType | undefined>();
  const [createRangeTime, setCreateRangeTime] = useState<RangerDataType | undefined>();
  // 面包屑区域可用宽度
  const breadWidth = useMemo(() => breadRef?.current?.clientWidth || 0, [curContWidth, tipVisible]);
  const dispatch = useAppDispatch();
  const [unitableAvailable] = useCheckCreateUnitableAvailable();
  // 新建
  const createMenus = [
    { key: 'excel', value: getIn18Text('XIETONGBIAOGE'), icon: <IconCard type="lxxls" width={16} height={16} /> },
    { key: 'doc', value: getIn18Text('XIETONGWENDANG'), icon: <IconCard type="lxdoc" /> },
    //TODO: 待确认key 和 unitable 名称
    unitableAvailable ? mulTableDropItem : null,
    { key: 'import', value: getIn18Text('DAORUWEIXIETONG'), icon: <IconCard type="importDoc" /> },
    { key: 'folder', value: getIn18Text('WENJIANJIA'), icon: <IconCard type="folder" width={16} height={16} /> },
    { key: 'template', value: getIn18Text('YONGMOBANXINJIAN'), icon: <IconCard type="template" width={16} height={16} /> },
  ].filter(item => item != null) as {
    key: string;
    value: string;
    icon: JSX.Element;
  }[];
  // 权限标签何时展示（当前处于企业空间根目录 且 有权限 时）
  const showAuthorityTag = useMemo(() => {
    const rootIds = [curRootInfo?.public?.id];
    return !!(curDirId && rootIds.indexOf(curDirId) !== -1 && authorityText && authorityText !== getIn18Text('WUQUANXIAN'));
  }, [curRootInfo, curDirId, authorityText]);
  useEffect(() => {
    setAuthorityText('');
  }, [curDirId]);
  useEffect(() => {
    if (defaultVisitRangeTime) {
      const startTime = defaultVisitRangeTime[0];
      const endTime = defaultVisitRangeTime[1];
      changeExternalShareList &&
        changeExternalShareList({
          visitTime: {
            intervalType: 'ABSOLUTE',
            interval: {
              startTime,
              endTime,
            },
          },
        });
      setVisitRangeTime(defaultVisitRangeTime && transTime(defaultVisitRangeTime));
      setShowVisitRanger(!!defaultVisitRangeTime);
      setVisitSelectValue(defaultVisitRangeTime ? -100 : -1);
    }
  }, [defaultVisitRangeTime]);
  const staticTimeOptions = [
    {
      label: getIn18Text('QUANBU'),
      value: -1,
    },
    {
      label: getIn18Text('ZUIJIN7TIAN'),
      value: 7,
    },
    {
      label: getIn18Text('ZUIJIN1GEYUE'),
      value: 30,
    },
    {
      label: getIn18Text('ZUIJIN3GEYUE'),
      value: 90,
    },
  ];
  const externalCreateTimeOptions = [...staticTimeOptions, { label: getIn18Text('ZIDINGYI'), value: -100 }];
  const externalVisitTimeOptions = [...staticTimeOptions, { label: getIn18Text('ZIDINGYI'), value: -100 }];
  const { ellipsisIndex } = useBreadEllipsisIndex(breadRef, bread, breadWidth);
  const dirId = currentDetail.id;
  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target;
      if (files && files.length > 0) {
        // check if any file's size exceed limit
        const validSize = Array.from(files).every(file => {
          const valid = file.size <= CONVERT_MAX_SIZE;
          if (!valid) {
            trackerApi.track(IMPORT_EVENT_ID, {
              type: getConvertFileType(getFileExt(file.name)),
              result: ImportResult.Fail,
              reason: ImportResultReason.FileLimit + Math.round(file.size / MB_SIZE) + 'M',
            });
          }
          return valid;
        });
        if (!validSize) {
          message.error(getIn18Text('JINZHICHISHANGCHUAN'));
          return;
        }
        const type = curSideTab === 'public' ? 'public' : 'private';
        const onStateChange = (file: IUploadFile) => {
          console.log('onStateChangeonStateChange', file);
          if (file.status === UploadFileStatus.DONE) {
            setUploadFileItems(fileItems => fileItems.filter(item => item !== file).concat(file));
            onUploadDone(file);
            trackerApi.track(IMPORT_EVENT_ID, {
              type: getConvertFileType(getFileExt(file.file.name)),
              result: ImportResult.Success,
              reason: file.reason,
            });
          } else if (file.status === UploadFileStatus.FAIL) {
            setUploadFileItems(fileItems => [file].concat(fileItems.filter(item => item !== file)));
            trackerApi.track(IMPORT_EVENT_ID, {
              type: getConvertFileType(getFileExt(file.file.name)),
              result: ImportResult.Fail,
              reason: file.reason,
            });
          } else {
            setUploadFileItems(fileItems => fileItems.slice());
          }
        };
        const uploadFileList = Array.from(files).map(file => {
          const task = new UploadConvert(file, type, currentDetail.id, onStateChange);
          task.startUpload();
          return task;
        });
        setVisibleUpload(true);
        setUploadFileItems((cur: IUploadFile[]) => cur.concat(uploadFileList));
      }
      event.target.value = '';
    },
    [dirId, onUploadDone]
  );
  const getCurDetail = (_dirId: number) => {
    diskApi.doGetNSFolderInfo({ type: tabMap[curSideTab], dirId: _dirId }).then(data => {
      setCurrentDetail(data);
      changeCurrentDetail && changeCurrentDetail(data);
    });
  };
  const isMainPage = curSideTab === 'recently' && currentPage === 'index';
  const needCheckTipShow = isMainPage;
  const location = useLocation();
  useEffect(() => {
    // 何时展示tip: welcomeTip 展示完成后, 在主页中, 若之前未曾展示过, 进入云文档时展示新建提示.
    if (!needCheckTipShow) return;
    const isCreateTipShowed = guideTipsInfo[DiskTipKeyEnum.CREATE_OR_UPLOAD_TIP].showed;
    const isCurPriority = checkDiskGuideTipsPriority(guideTipsInfo, DiskTipKeyEnum.CREATE_OR_UPLOAD_TIP);
    const visible = !isCreateTipShowed && isCurPriority;
    setTipVisible(visible); // unitable新建tip，与上面新建提示互斥
    if (visible || !unitableTipCanShow) {
      return;
    }
    const isUnitableCreateTipShowed = guideTipsInfo[DiskTipKeyEnum.UNITABLE_CREATE_TIP].showed;
    const isUnitablePriority = checkDiskGuideTipsPriority(guideTipsInfo, DiskTipKeyEnum.UNITABLE_CREATE_TIP);
    const isUnitableVisible = isCreateTipShowed && !isUnitableCreateTipShowed && isUnitablePriority;
    setUnitableTipVisible(isUnitableVisible);
    if (isUnitableVisible) {
      dataStoreApi.put(DiskTipKeyEnum.UNITABLE_CREATE_TIP, 'true');
    }
  }, [guideTipsInfo, curSideTab, currentPage, unitableTipCanShow]);
  useEffect(() => {
    setUnitableTipCanShow(true);
  }, [location.hash]);
  useEffect(() => {
    dispatch(
      DiskActions.setGuideTipsInfoByKey({
        key: DiskTipKeyEnum.CREATE_OR_UPLOAD_TIP,
        value: {
          ...guideTipsInfo[DiskTipKeyEnum.CREATE_OR_UPLOAD_TIP],
          visiable: tipVisible,
        },
      })
    );
  }, [tipVisible]);
  useEffect(() => {
    dispatch(
      DiskActions.setGuideTipsInfoByKey({
        key: DiskTipKeyEnum.UNITABLE_CREATE_TIP,
        value: {
          ...guideTipsInfo[DiskTipKeyEnum.UNITABLE_CREATE_TIP],
          visiable: unitableTipVisible,
        },
      })
    );
  }, [unitableTipVisible]);
  useEffect(() => {
    if (bread === undefined || bread.length === 0) {
      return;
    }
    const curBread = bread[bread.length - 1]; // bread的内容是详细信息
    if (!curBread) {
      return;
    }
    breadListRef.current = bread;
    setCanAddDir(true);
    setCanAddFile(true);
    if (curSideTab === 'private' || curSideTab === 'recently') {
      // 个人空间部分没有 authorityDetail，需要初始化数据
      // “主页”同“个人空间”权限 都是管理者
      setAuthorityText(getIn18Text('GUANLIZHE'));
      getCurDetail(curBread.id);
    } else {
      diskApi.doGetNSEntFolderAuthInfo(curBread.id).then(auth => {
        if (breadListRef.current !== bread) {
          return;
        }
        const authText = formatAuthority(auth.roleInfos, 'dir', 'simple');
        setAuthorityText(authText === '' ? getIn18Text('WUQUANXIAN') : authText);
        // authText.includes判断的是中文，不要做翻译
        if (!authText?.includes('管理')) {
          setCanAddDir(false);
        }
        // authText.includes判断的是中文，不要做翻译
        if (!authText?.includes('管理') && !authText?.includes('上传')) {
          setCanAddFile(false);
        }
        if (auth.roleInfos?.length > 0) {
          getCurDetail(curBread.id);
        }
      });
    }
  }, [bread]);
  const addFile = () => {
    if (canAddFile) {
      trackerApi.track(`pc_disk_click_upload_${trackTypeMap[curSideTab || '']}`);
      upload(currentDetail);
    }
  };
  // 去创建文件夹
  const createDir = () => {
    if (!canAddDir) {
      toastUploadPrivilegeError(getIn18Text('WUGUANLIQUANXIAN'));
      return;
    }
    trackerApi.track(`pc_disk_click_new_folder_${trackTypeMap[curSideTab || '']}`);
    createDirShow && createDirShow();
  };
  const onclickBread = (val: number) => {
    setCurrentDirId && setCurrentDirId(val);
  };
  const loadShareListData = (type: 'createTime' | 'visitTime', params?: any) => {
    let momentList = type === 'createTime' ? createRangeTime : visitRangeTime;
    momentList = momentList || [moment(), moment().add(1, 'M')];
    const start = momentList[0].startOf('day').valueOf();
    const end = momentList[1].endOf('day').valueOf();
    console.log('start,end', new Date(start), new Date(end));
    const defaultParams = {
      [type]: {
        intervalType: 'ABSOLUTE',
        interval: {
          startTime: start,
          endTime: end,
        },
      },
    };
    params = params ? Object.assign(defaultParams, params) : defaultParams;
    changeExternalShareList && changeExternalShareList(params);
  };
  const closeCreateOrUploadTip = () => {
    // 仅主页场景下记录点击情况
    if (!needCheckTipShow) return;
    setTipVisible(false);
    dataStoreApi.put(DiskTipKeyEnum.CREATE_OR_UPLOAD_TIP, 'true');
    dispatch(
      DiskActions.setGuideTipsInfoByKey({
        key: DiskTipKeyEnum.CREATE_OR_UPLOAD_TIP,
        value: {
          ...guideTipsInfo[DiskTipKeyEnum.CREATE_OR_UPLOAD_TIP],
          showed: true,
          visiable: false,
        },
      })
    );
    setUnitableTipCanShow(false);
  };
  // 关闭unitable创建tip
  const closeUnitableCreateTip = () => {
    // 仅主页场景下记录点击情况
    if (!needCheckTipShow) return;
    setUnitableTipVisible(false);
    dispatch(
      DiskActions.setGuideTipsInfoByKey({
        key: DiskTipKeyEnum.UNITABLE_CREATE_TIP,
        value: {
          ...guideTipsInfo[DiskTipKeyEnum.UNITABLE_CREATE_TIP],
          showed: true,
          visiable: false,
        },
      })
    );
  };
  // 新建按钮 菜单
  const menu = (
    <Menu
      onClick={info => {
        const { key } = info;
        let space: 'home' | 'personal' | 'company' = 'home';
        if (curSideTab === 'private') {
          space = 'personal';
        } else if (curSideTab === 'public') {
          space = 'company';
        }
        // 新建文件夹
        if (key === 'folder') {
          createDir();
          // 导入为协同文档
        } else if (key === 'import') {
          inputRef.current?.click();
          // Unitable走模板创建方式
        } else if (key === 'template') {
          trackerCreateBaseCached.creat_type = `${space}_templateClick`;
          props.templateModalShow && props.templateModalShow('List', 'all');
        } else {
          trackerCreateBaseCached.creat_type = `${space}_fileClick`;
          props.templateModalShow && props.templateModalShow('List', key as unknown as DOC_VALUES);
        }
      }}
    >
      {createMenus.map(item => {
        const disabled = (item.key === 'folder' && !canAddDir) || (item.key !== 'folder' && !canAddFile);
        const menuItem = (
          <Menu.Item disabled={disabled} key={item.key}>
            <Tooltip
              overlayClassName={style.tooltip}
              title={disabled ? getIn18Text('WUQUANXIAN\uFF0CXU') : item.key === 'import' ? getIn18Text('ZHICHIPILIANGDAO') : ''}
              placement="right"
              overlayStyle={{ zIndex: 10000 }}
            >
              <span className={style.menuTextWrapper} data-test-id={`disk_create_${item.key}_btn`}>
                {item.icon}
                <span className={style.menuText}>{item.value}</span>
              </span>
            </Tooltip>
          </Menu.Item>
        );
        return menuItem;
      })}
    </Menu>
  );
  const createTipDiv = (
    <div>
      <span className={style.tip}>{getIn18Text('XINJIAN/SHANGCHUAN')}</span>
      <span onClick={closeCreateOrUploadTip} className={style.confirm}>
        {getIn18Text('ZHIDAOLE')}
      </span>
    </div>
  );
  const unitableCreateTipDiv = (
    <div>
      <p className={style.title}>{getIn18Text('XINZENGUNITABLETIPTITLE')}</p>
      <p className={style.tip}>{getIn18Text('XINZENGUNITABLETIPCONTENT')}</p>
      <p className={style.button}>
        <Button size="small" onClick={closeUnitableCreateTip} className={style.confirm}>
          {getIn18Text('ZHIDAOLE')}
        </Button>
      </p>
    </div>
  );
  return (
    <div className={style.diskHeadWrap}>
      {/* 个人空间 企业空间 主页的主页部分 */}
      <div className={style.indexPageWrap} hidden={curSideTab === 'recently' && currentPage !== 'index'}>
        <div className={style.breadAuthorityContainer}>
          {/* 目录与权限 */}
          <div className={style.breadAuthority}>
            <div className={style.breadContainer}>
              {/* 当前文件夹目录 */}
              <div className={style.bread} ref={breadRef}>
                <div className={style.breadArea}>
                  <BreadComp
                    bread={bread}
                    ellipsisIndex={ellipsisIndex}
                    setCurrentDirId={val => {
                      onclickBread(val);
                    }}
                  />
                </div>
                {showAuthorityTag && <div className={style.authorityTag}>{authorityText}</div>}
              </div>
              {/* 新建，上传按钮 */}
              {!hideNewUpload && (
                <Tooltip
                  visible={tipVisible}
                  overlayClassName={style.diskCreateTooltip}
                  placement="bottomRight"
                  title={createTipDiv}
                  getPopupContainer={node => document.getElementById('disk-main-page') || node}
                >
                  <div className={classnames(style.operate, { [style.nonList]: !list.length })} ref={oprButtsRef}>
                    <Dropdown overlay={menu} placement="bottomRight" trigger={['click']} overlayClassName={style.createMenu} disabled={!(canAddDir || canAddFile)}>
                      <Tooltip
                        visible={unitableTipVisible}
                        overlayClassName={style.diskUnitableCreateTooltip}
                        placement="bottomRight"
                        title={unitableCreateTipDiv}
                        getPopupContainer={node => document.getElementById('disk-main-page') || node}
                      >
                        <Tooltip title={!(canAddDir || canAddFile) ? getIn18Text('WUQUANXIAN\uFF0CXU') : ''}>
                          <Button
                            size="small"
                            type="primary"
                            className={classnames(style.btn, { disabled: !(canAddDir || canAddFile) })}
                            data-test-id="disk_create_btn"
                            onClick={() => {
                              closeCreateOrUploadTip();
                              trackerApi.track('pc_disk_click_new');
                            }}
                            icon={
                              <span className="anticon">
                                <IconCard type="create" />
                              </span>
                            }
                          >
                            {getIn18Text('XINJIAN')}
                          </Button>
                        </Tooltip>
                      </Tooltip>
                    </Dropdown>
                    <Tooltip title={!canAddFile ? getIn18Text('WUQUANXIAN\uFF0CXU') : ''}>
                      <Button
                        style={{
                          minWidth: 64,
                          width: 'auto',
                        }}
                        size="small"
                        icon={
                          <span className="anticon dark-svg-invert">
                            <IconCard className="anticon" type="doUpload" />
                          </span>
                        }
                        data-test-id="disk_upload_btn"
                        className={classnames({ disabled: !canAddFile })}
                        onClick={() => {
                          closeCreateOrUploadTip();
                          addFile();
                        }}
                      >
                        {getIn18Text('SHANGCHUAN')}
                      </Button>
                    </Tooltip>
                  </div>
                  <input ref={inputRef} type="file" style={{ display: 'none' }} accept=".docx,.xls,.xlsx" onChange={handleFileChange} multiple />
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DiskHead;
