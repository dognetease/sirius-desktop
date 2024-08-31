/* eslint-disable no-plusplus */
/* eslint-disable no-inner-declarations */
import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { PageProps } from 'gatsby';
import { apiHolder, apis, inWindow, NetStorageShareApi, ResponseAnonymousFileInfo, StringMap, ResourceType } from 'api';

import { AnonymousPreviewPage } from '@web-disk/components/Preview/preview_anonymous';
import { AnonymousPreviewFolder } from '@web-disk/components/Preview/preview_folder_anonymous';
import SiriusLayout from '../layouts';
import style from '../styles/pages/shareAnonymous.module.scss';

const typeReg = /type=([a-z]+)/i;
const idReg = /shareIdentity=([a-z0-9]+)/i;
const dirIdReg = /dirId=([0-9]+)/i;
const fileIdReg = /fileId=([0-9]+)/i;

const parse = (hash: string) => {
  const ret: StringMap = {};
  const type = typeReg.exec(hash);
  if (type && type[1]) {
    ret.type = type[1] === 'FILE' ? 'FILE' : 'DIRECTORY';
  }
  const id = idReg.exec(hash);
  if (id && id[1]) {
    ret.shareIdentity = id[1];
  } else {
    // TODO: url error warn
  }
  const dirId = dirIdReg.exec(hash);
  if (dirId && dirId[1]) {
    ret.dirId = dirId[1];
  }
  const fileId = fileIdReg.exec(hash);
  if (fileId && fileId[1]) {
    ret.fileId = fileId[1];
  }
  return ret;
};

const ShareAnonymousPage: React.FC<PageProps> = props => {
  const nsShareApi = apiHolder.api.requireLogicalApi(apis.netStorageShareImpl) as NetStorageShareApi;
  const { forElectron } = apiHolder.env;
  // type=folder&id=19000000001588&from=PERSONAL&parentResourceId=19000000001554&spaceId=504685414
  const { hash } = props.location;
  const [hasAuthority, setHasAuthority] = useState<boolean>(false);
  const [errorCode, setErrorCode] = useState<number>();
  // const [authority, setAuthority] = useState('');
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(true);
  const [item, setItem] = useState<ResponseAnonymousFileInfo>();
  const [type, setType] = useState<string>('');
  // const [typeOrg, setTypeOrg] = useState<'personal' | 'ent'>('ent');
  const [fileOrDir, setFileOrDir] = useState<ResourceType>('FILE');
  const [shareIdentity, setShareIdentity] = useState<string>();
  const [dirId, setDirId] = useState<number>(0);
  const [previewLink, setPreviewLink] = useState<string>('');
  const [fileId, setFileId] = useState<number>();

  async function fetchShareFileInfo() {
    setLoading(true);
    setSpinning(true);
    const params = parse(hash);
    // let authority = '';
    setFileOrDir(params.type as ResourceType);
    const sid = params.shareIdentity;
    setShareIdentity(sid);

    if (params.type === 'FILE') {
      const fileId = Number(params.fileId);
      setFileId(fileId);
      const fileReq = {
        fileId,
        shareIdentity: sid,
      };
      // 文件
      try {
        const [detail, preview] = await Promise.allSettled([nsShareApi.checkAnonymousFileInfo(fileReq), nsShareApi.previewAnonymousFileInfo(fileReq)]);
        setLoading(false);
        if (detail.status === 'fulfilled') {
          setItem(detail.value);
          setHasAuthority(true);
        } else {
          errorHandle(detail.reason);
        }
        if (preview.status === 'fulfilled') {
          const link = preview.value.content;
          if (link.includes('file-preview')) {
            setPreviewLink(link + '&hideLoading=true');
            setTimeout(() => setSpinning(false), 8000);
          } else {
            setPreviewLink(link);
            setSpinning(false);
          }
        } else {
          errorHandle(preview.reason);
        }
      } catch (reason) {
        errorHandle(reason);
      }
      function errorHandle(reason) {
        // eslint-disable-next-line no-console
        console.warn('share_anonymous error', reason);
        setLoading(false);
        setSpinning(false);
        reason?.data?.code && setErrorCode(reason.data.code);
      }
    } else if (params.type === 'DIRECTORY') {
      // 文件夹
      setDirId(Number(params.dirId));
      setHasAuthority(!!sid && sid.length > 8);
      // setTypeOrg(params.from);
      // setFileOrDir(params['type']);
      // setId(params['id']);
      // setSpaceId(params['spaceId']);
      // setHasAuthority(true);
      setLoading(false);
      setSpinning(false);
    } else {
      setLoading(false);
      setSpinning(false);
    }
  }

  useEffect(() => {
    fetchShareFileInfo().then();
  }, [hash]);

  const onMessageCb = (e: MessageEvent) => {
    if (e.data === 'hideSpinner') {
      setSpinning(false);
    }
  };

  useEffect(() => {
    window.addEventListener('message', onMessageCb);
    return () => {
      window.removeEventListener('message', onMessageCb);
    };
  }, []);

  const page =
    fileOrDir === 'FILE' ? (
      <AnonymousPreviewPage
        hasAuthority={hasAuthority}
        errorCode={errorCode}
        // authority={authority}
        item={item}
        type={type}
        previewLink={previewLink}
        fileId={fileId}
        shareIdentity={shareIdentity}
      />
    ) : (
      <AnonymousPreviewFolder
        folderId={dirId}
        contentWidth={inWindow() ? window.document.body.clientWidth : 1000}
        hasAuthority={hasAuthority}
        shareIdentity={shareIdentity}
      />
      // null
    );

  const spin = (
    <div className={style.spinContainer} hidden={!spinning}>
      <Spin size="large" spinning={spinning} />
    </div>
  );

  const content = (
    <>
      {spin}
      {!loading && page}
    </>
  );

  return forElectron ? (
    <SiriusLayout.ContainerLayout isLogin showMin={false} showMax={false}>
      {content}
    </SiriusLayout.ContainerLayout>
  ) : (
    content
  );
};

export default ShareAnonymousPage;
