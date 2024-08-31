import React, { useCallback, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { apiHolder, apis, DataTrackerApi, DataTransApi, NetStorageApi, NetStorageShareApi, NSFileContent } from 'api';
import SiriusLayout from '@/layouts';
import Doc from './components/Doc/doc';
import Unitable from './components/Unitable';
import { PermissionApply } from './components/PermissionApply';
import { usePermissionApply } from './components/PermissionApply/hooks';
import { parseShareUrlParams } from '@web-common/utils/utils';
import { formatAuthority } from './utils';
import { presentationManagr } from './components/Doc/full-screen';
import { getIn18Text } from 'api';
const nsShareApi = apiHolder.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const trackerApi = apiHolder.api.requireLogicalApi('dataTrackerApiImp') as DataTrackerApi;
const httpApi = apiHolder.api.getDataTransApi() as DataTransApi;
const inElectron = apiHolder.api.getSystemApi().isElectron;
const isMac = inElectron() ? window.electronLib.env.isMac : apiHolder.env.isMac;
const { forElectron } = apiHolder.env;
const ts = Date.now();
interface DocPageProps {
  hash: string;
  type: 'doc' | 'sheet' | 'unitable';
  from?: string;
  onFetchDetail?: (hash, detail) => void;
  extheme?: boolean; // 用户开启暗黑模式后，当前组件是否要启用暗黑样式。true则不管是否开启暗黑，都展示亮色
}
const DocPage: React.FC<DocPageProps> = props => {
  const { hash, type, onFetchDetail = () => {}, from, extheme } = props;
  const params = parseShareUrlParams(hash);
  const [loading, setLoading] = useState(true);
  const [authority, setAuthority] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  // const [hasAuthority, setHasAuthority] = useState<boolean>(false);
  const [item, setItem] = useState<NSFileContent>();
  const [previewLink, setPreviewLink] = useState<string>('');
  const [fileReq, setFileReq] = useState<any>();
  // 获取权限申请信息
  const closeLoading = useCallback(() => setLoading(false), []);
  const { permissionApplyInfo, getPermissionApplyInfo, noPermission, setNoPermission } = usePermissionApply(
    {
      resourceId: params.id,
      resourceType: 'FILE',
      ref: params.ref,
    },
    fetchDocsFileInfo,
    closeLoading
  );
  async function fetchDocsFileInfo() {
    setNoPermission(false);
    setLoading(true);
    let _authority = '';
    const _fileReq = {
      type: params.from,
      fileId: params.id,
      dirId: params.parentResourceId,
      spaceId: params.spaceId,
    };
    setFileReq(_fileReq);
    function handleErr(data, noPermission = false) {
      let info = { name: getIn18Text('YEMIANCHUCUOLE'), fileType: '' };
      if (noPermission || +data?.code === 10100) {
        setNoPermission(true);
        getPermissionApplyInfo();
        info = { name: getIn18Text('WUQUANXIAN'), fileType: '' };
      } else {
        setErrorMessage(data.message);
        setLoading(false);
      }
      onFetchDetail(hash, info);
      trackerApi.track('pc_disk_view_error', {
        viewWay: 'innerShareView',
        data,
        info,
      });
    }
    //不用翻译
    const READ_AUTH_STR = '查看';
    try {
      const shareAuth = await nsShareApi
        .checkShareAuth({
          resourceId: params.id,
          resourceType: 'FILE',
          ref: params.ref,
        })
        .catch(e => e?.data);
      if (shareAuth?.success === false || shareAuth.roleInfos?.length === 0) {
        handleErr(shareAuth, shareAuth.roleInfos?.length === 0);
        return;
      }
      _authority = formatAuthority(shareAuth.roleInfos, '') || READ_AUTH_STR;
      const _item = await diskApi.doGetNSFileInfo(_fileReq).catch(e => e?.data);
      if (_item?.success === false) {
        handleErr(_item);
        return;
      }
      setItem(_item);
      onFetchDetail(hash, _item);
      trackerApi.track('pc_disk_view', {
        viewWay: 'innerShareView',
        fileType: _item.fileType,
        fileId: _item.id,
      });
      if (_authority.includes(READ_AUTH_STR)) {
        const ret = await diskApi.doGetNSDownloadInfo(_fileReq, 'preview');
        const _previewLink = ret.data?.success ? ret.data?.data : '';
        setPreviewLink(httpApi.buildUrl(_previewLink, { t: ts, tab: params.activedSheetIndex || '' }));
      }
      setAuthority(_authority);
      setLoading(false);
    } catch (_) {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (hash) {
      fetchDocsFileInfo();
    }
  }, [hash]);
  useEffect(() => {
    if (inElectron() && isMac && presentationManagr.documentFullscreen) {
      /**
       * 在Mac客户端下，需要延时执行 500 毫秒用于修复 http://jira.netease.com/browse/COSPREAD-4601 bug
       */
      setTimeout(() => {
        presentationManagr.exitFullScreen();
      }, 500);
      return;
    }
    // 有新加入的窗口，自动退出演示模式
    presentationManagr.exitFullScreen();
  }, []);
  const content = loading ? (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        backgroundColor: 'transparent',
      }}
      className={extheme ? 'extheme' : ''}
    >
      <Spin size="large" />
    </div>
  ) : noPermission ? (
    <PermissionApply type={type} info={permissionApplyInfo} extheme={!!extheme} />
  ) : type === 'unitable' ? (
    <Unitable
      type={type}
      item={item}
      previewLink={previewLink}
      authority={authority}
      fileReq={fileReq}
      errMsg={errorMessage}
      hashData={hash}
      initPage={fetchDocsFileInfo}
      onFetchDetail={onFetchDetail}
      extheme={!!extheme}
    />
  ) : (
    <Doc
      type={type}
      item={item}
      previewLink={previewLink}
      authority={authority}
      fileReq={fileReq}
      errMsg={errorMessage}
      hashData={hash}
      initPage={fetchDocsFileInfo}
      onFetchDetail={onFetchDetail}
      extheme={!!extheme}
    />
  );
  return forElectron && from !== 'tab' ? <SiriusLayout.ContainerLayout>{content}</SiriusLayout.ContainerLayout> : content;
};
export default DocPage;
