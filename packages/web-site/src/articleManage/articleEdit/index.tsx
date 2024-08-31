import React, { useState, useEffect, useRef, useMemo } from 'react';
import Breadcrumb from '@web-site/components/Breadcrumb';
import { Input, Spin, message, Upload, Tooltip } from 'antd';
import type { RcFile } from 'antd/es/upload/interface';
import { navigate } from '@reach/router';
import { Select } from '@/components/Layout/Customer/components/commonForm/Components';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { downloadImg } from '@web-mail/components/ReadMail/util';
import { lingxi, LingxiSDK, DefaultFeature, OptionFeature } from '@cowork/bulb-sdk';
import { api, apis, SiteApi, getIn18Text } from 'api';
import { config as envDefConfig } from 'env_def';
import { ArticleItem } from '../articleList';
import { ReactComponent as LoadingIcon } from '../../images/loading-small.svg';
import { ReactComponent as AddIcon } from '../../images/add.svg';
import { ReactComponent as ReplaceIcon } from '../../images/replace-icon-s.svg';
import { ReactComponent as DeleteIcon } from '../../images/delete-icon-s.svg';
import { ReactComponent as WenhaoIcon } from '../../images/wenhao.svg';

import styles from './style.module.scss';

interface PageQueryString {
  articleId: string;
  siteId: string;
  type: string;
}

interface ArticleEditProps {
  qs: PageQueryString; // url 参数
}

interface SiteBindDomainListItem {
  customIndexUrl: string;
  domain: string;
  domainStatus: number;
}

const mimeTypeMap: any = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/bmp': 'bmp',
  'image/webp': 'webp',
};

function dataURLtoFile(dataurl: string, filename: string) {
  const arr = dataurl.split(',');
  const mime = (arr[0] ?? '').match(/:(.*?);/)?.[1];
  const bstr = atob(arr[arr.length - 1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export const uploadImg = async (file: Blob): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const data = await siteApi.siteUploadFileNew(formData);
  return data.fileUrl;
};

const uploadFilesOverride = async (files: File | FileList, name?: string) => {
  if (files instanceof File) {
    return Promise.all([uploadImg(files)]);
  }
  return Promise.all(Array.from(files).map(f => uploadImg(f)));
};

const download = async (file: string, fileName: string) => {
  downloadImg(file, fileName);
};

const DomainNameTip = (props: { name: string }) => {
  return (
    <Tooltip title={props.name}>
      <div className={styles.domainNameTip}>{props.name}</div>
    </Tooltip>
  );
};

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const DEFAULT_CONTENT = '{"2":"1","3":"Ju9C-1621846617594","4":{"fv":"0"},"5":[{"3":"3060-1621846615933","5":[{"2":"2","3":"p5PQ-1621846617594"}]}],"__compress__":true}';
export const ArticleEdit = (props: ArticleEditProps) => {
  const { articleId, siteId, type } = props.qs;
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState<ArticleItem | null>({} as any);
  const [siteList, setSiteList] = useState<{ value: string; label: string; deleted: boolean; siteBindDomainList: SiteBindDomainListItem[]; indexUrl: string }[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, { value: string; label: string }[]>>({});
  const [categoryList, setCategoryList] = useState<{ value: string; label: string }[]>([]);
  const [submiting, setSubmiting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [articleTitle, setArticleTitle] = useState<string>();
  const [articleTitleError, setArticleTitleError] = useState('');
  const [articleUrl, setArticleUrl] = useState<string>('');
  const [articleUrlError, setArticleUrlError] = useState('');
  const [articleSiteId, setArticleSiteId] = useState<string>();
  const [articleSiteIdError, setArticleSiteIdError] = useState('');
  const [articleCenterPath, setArticleCenterPath] = useState('');
  const [thumbnail, setThumbnail] = useState<string>();
  const [category, setCategory] = useState<string>();
  const [fullScreen, setFullScreen] = useState(false);
  const closeModalRef = useRef<any>();
  const editorRef = useRef<any>();
  const contentRef = useRef<string>(DEFAULT_CONTENT);
  const submitingRef = useRef(false);

  const getAllBindSite = async () => {
    try {
      const allSite = await siteApi.siteInfo({ publishStatusList: ['ONLINE', 'DRAFT'], isShowOuterSite: false, isGetBindDomain: true });
      const options = (allSite ?? []).map(
        ({
          siteId,
          siteName,
          deleted,
          siteBindDomainList = [],
          indexUrl = '',
        }: {
          siteId: string;
          siteName: string;
          deleted: boolean;
          siteBindDomainList: SiteBindDomainListItem[];
          indexUrl: string;
        }) => {
          return { value: siteId, label: siteName, deleted, siteBindDomainList, indexUrl };
        }
      );
      setSiteList(options);
      getSite();
    } catch {}
  };

  const domainName = useMemo(() => {
    const selectSite = siteList.find(item => {
      return item.value === articleSiteId;
    });
    if (!selectSite) return '';

    const { indexUrl, siteBindDomainList } = selectSite;
    if (siteBindDomainList.length > 0) {
      return `${siteBindDomainList[0].customIndexUrl}${articleCenterPath}/`;
    }
    if (indexUrl === '') return indexUrl;
    return `${indexUrl}${articleCenterPath}/`;
  }, [siteList, articleSiteId, articleCenterPath]);

  const getCategorys = async () => {
    try {
      const map: Record<string, { value: string; label: string }[]> = {};
      const res = await siteApi.getSiteCategory();
      res.forEach((i: any) => {
        const { siteId, categoryId, categoryName } = i;
        const item = { value: categoryId, label: categoryName };
        if (map[siteId]) {
          map[siteId].push(item);
        } else {
          map[siteId] = [item];
        }
      });
      setCategoryMap(map);
      setCategoryList(map[siteId] ?? []);
    } catch {}
  };

  const getSite = async () => {
    try {
      setLoading(true);
      const res = await siteApi.getArticle({ articleId, siteId });
      const { pagePath, pathPattern = '' } = res ?? {};
      const centerPath = pathPattern.split('/');
      centerPath.pop();
      setItem(res);
      contentRef.current = res.content || DEFAULT_CONTENT;
      setArticleTitle(res.title);
      setArticleSiteId(res.siteId);
      setThumbnail(res.thumbnail);
      setArticleCenterPath(pagePath ? '' : centerPath.join('/'));
      setArticleUrl(!pagePath ? `${res.articleId}.html` : pagePath);
      setCategory(res.categoryId && res.categoryId !== '0' ? res.categoryId : undefined);
      lingxi({
        container: document.querySelector(`.${styles.articleEditor}`)!,
        content: contentRef.current,
        overrideMethod: {
          openLink: (url: string) => {
            window.open(url);
          },
          uploadFiles: uploadFilesOverride,
          downloadFile: download,
        },
        disableDefaultFeatures: [
          DefaultFeature.SideCatalog,
          DefaultFeature.BackTop,
          DefaultFeature.WordCount,
          DefaultFeature.Print,
          DefaultFeature.SearchMenu,
          DefaultFeature.PageMode,
          DefaultFeature.Code,
          DefaultFeature.Todo,
        ],
        enableOptionFeatures: [OptionFeature.Attachment, OptionFeature.Image],
      }).then((sdk: LingxiSDK) => {
        editorRef.current = sdk;
      });
    } finally {
      setLoading(false);
    }
  };

  const goList = () => {
    navigate('#site?page=articleList');
  };

  useEffect(() => {
    if (!siteId || !articleId) {
      goList();
      return;
    }
    getAllBindSite();
    getCategorys();

    return () => {
      editorRef.current?.disconnect();
    };
  }, []);

  const previewArticle = async () => {
    try {
      let content = await editorRef.current?.getContent();
      content = content ?? contentRef.current;
      const categoryId = item?.categoryId && categoryList.some(i => i.value === item.categoryId) ? item.categoryId : '0';
      await siteApi.updateArticle({
        articleId,
        title: item?.title,
        siteId: item?.siteId,
        thumbnail: item?.thumbnail,
        categoryId,
        content,
        originSiteId: item?.siteId ?? siteId,
      });
      const path =
        envDefConfig('stage') === 'prod'
          ? `https://sirius-it-site.lx.netease.com/${siteId}/news/${articleId}.html?previewSiteId=${siteId}`
          : `https://sirius-it-site.cowork.netease.com/${siteId}/news/${articleId}.html?previewSiteId=${siteId}`;
      window.open(path);
    } catch {}
  };

  const closeModal = () => {
    closeModalRef.current = Modal.confirm({
      title: '正在编辑内容，要保存更改的内容吗？',
      content: '不保存将丢失更改的内容',
      okText: '保存',
      cancelText: '不保存',
      onOk: updateArticleHandler,
      onCancel: goList,
    });
  };

  const updateArticleHandler = async () => {
    setFullScreen(false);
    if (closeModalRef.current) {
      closeModalRef.current.destroy?.();
      closeModalRef.current = null;
    }
    let withError = false;
    if (!articleTitle) {
      setArticleTitleError(getIn18Text('SITE_QINGSHURUWENZHANGBIAOTI'));
      withError = true;
    }
    if (!articleSiteId) {
      setArticleSiteIdError(getIn18Text('SITE_QINGSHURUWENZHANGBIAOTI'));
      withError = true;
    }
    if (articleUrl === '' && type !== 'create') {
      setArticleUrlError('文章链接不能为空');
      withError = true;
    }
    if (articleUrl !== '' && !/^[a-zA-Z0-9\-_~]*(\.html)?$/.test(articleUrl)) {
      setArticleUrlError('URL只允许包含英文，数字，-_~，.html四种类型！');
      withError = true;
    }
    if (withError) return;
    if (submitingRef.current) return;
    submitingRef.current = true;
    setSubmiting(true);
    try {
      let content = await editorRef.current?.getContent();
      content = content ?? contentRef.current;
      const categoryId = category && categoryList.some(i => i.value === category) ? category : '0';
      await siteApi.updateArticle({
        articleId,
        title: articleTitle,
        siteId: articleSiteId!,
        thumbnail,
        categoryId: categoryId,
        content,
        originSiteId: siteId,
        pagePath: articleUrl,
      });
      goList();
    } finally {
      setSubmiting(false);
      submitingRef.current = false;
    }
  };

  const handleSelect = (v: any) => {
    setArticleSiteId(v);
    setArticleSiteIdError('');
    setCategoryList(categoryMap[v] ?? []);
    setCategory(undefined);
  };

  const handleSelectCategory = (v: any) => {
    setCategory(v);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArticleTitle(e.target.value);
    setArticleTitleError('');
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArticleUrl(e.target.value);
    if (e.target.value === '' && type !== 'create') {
      setArticleUrlError('文章链接不能为空');
    } else if (e.target.value !== '' && !/^[a-zA-Z0-9\-_~]*(\.html)?$/.test(e.target.value)) {
      setArticleUrlError('URL只允许包含英文，数字，-_~，.html四种类型！');
    } else {
      setArticleUrlError('');
    }
  };

  const beforeUpload = async (file: RcFile, _fileList: RcFile[]) => {
    const isJpgOrPng = file.type === 'image/png' || file.type === 'image/jpeg';
    if (!isJpgOrPng) {
      message.error('请选择png/jpg格式图片');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 2;
    if (!isLt5M) {
      message.error('图片大小不能超过 2MB!');
      return false;
    }
    setUpdating(true);
    const formData = new FormData();
    formData.append('file', file);
    siteApi
      .siteUploadFile(formData)
      .then(data => {
        if (data) {
          setThumbnail(data.fileUrl);
          setUpdating(false);
        }
      })
      .finally(() => setUpdating(false));
    return false;
  };

  const toggleFullScreen = () => {
    setFullScreen(v => !v);
  };

  return (
    <div className={styles.articleInfoContainer}>
      <div className={styles.articleInfoHeader}>
        <Breadcrumb>
          <Breadcrumb.Item onClick={goList}>{getIn18Text('SITE_WENZHANGGUANLI')}</Breadcrumb.Item>
          <Breadcrumb.Item>{type === 'create' ? '新建' : '编辑'}文章</Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <div className={styles.articleInfoContent}>
        {!fullScreen ? (
          <>
            <div className={styles.articleInfoTitle}>基本信息</div>
            {item ? (
              <div className={styles.mainInfo}>
                <div className={styles.formLine}>
                  <div className={styles.formLabel}>
                    <span>*</span>
                    {getIn18Text('SITE_WENZHANGBIAOTI')}
                  </div>
                  <div className={articleTitleError ? styles.errorSelectContainer : styles.selectContainer}>
                    <Input
                      style={{ flex: 1 }}
                      value={articleTitle}
                      onChange={handleTitleChange}
                      placeholder={getIn18Text('SITE_QINGSHURUWENZHANGBIAOTI')}
                      maxLength={250}
                    />
                    {articleTitleError && <div className={styles.errorTip}>{getIn18Text('SITE_QINGSHURUWENZHANGBIAOTI')}</div>}
                  </div>
                </div>
                <div className={styles.formLine}>
                  <div className={styles.formLabel}>
                    <span>*</span>
                    {getIn18Text('SITE_SUOSHUZHANDIAN')}
                  </div>
                  <div className={articleSiteIdError ? styles.errorSelectContainer : styles.selectContainer}>
                    <Select style={{ width: '298px' }} value={articleSiteId} onChange={handleSelect} placeholder={getIn18Text('SITE_QINGXUANZEZHANDIAN')}>
                      {siteList
                        .filter(i => i.value !== '' && (!i.deleted || i.value === articleSiteId))
                        .map(i => {
                          const { label, value, deleted } = i;
                          return (
                            <Select.Option value={value} label={label}>
                              <div className={styles.option}>
                                <div>{label}</div>
                                {deleted && <span className={styles.deleted}>已删除</span>}
                              </div>
                            </Select.Option>
                          );
                        })}
                    </Select>
                    {articleSiteIdError && <div className={styles.errorTip}>{getIn18Text('SITE_QINGXUANZEZHANDIAN')}</div>}
                  </div>
                </div>
                <div className={styles.formLine}>
                  <div className={styles.formLabel}>{getIn18Text('SITE_FENGMIANTU')}</div>
                  <div className={styles.uploaderContainer}>
                    <div className={styles.uploaderDragger}>
                      <Upload.Dragger accept="image/png,image/jpeg" beforeUpload={beforeUpload} showUploadList={false}>
                        <div className={styles.uploaderContent}>
                          {updating ? (
                            <div className={styles.uploaderFileBox}>
                              <div className={styles.loading}>
                                <LoadingIcon />
                                <div className={styles.loadingText}>上传中...</div>
                              </div>
                            </div>
                          ) : (
                            <>
                              {thumbnail ? (
                                <div className={styles.uploaderFileBox}>
                                  <div className={styles.uploaded}>
                                    <div className={styles.mask}>
                                      <div className={styles.opContainer}>
                                        <ReplaceIcon />
                                        <div className={styles.replaceText}>替换</div>
                                      </div>
                                      <div
                                        className={styles.opContainer}
                                        onClick={e => {
                                          e.stopPropagation();
                                          setThumbnail('');
                                        }}
                                      >
                                        <DeleteIcon />
                                        <div className={styles.replaceText}>删除</div>
                                      </div>
                                    </div>
                                    <img src={thumbnail} />
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                  <AddIcon />
                                  <div className={styles.uploadText}>{getIn18Text('SITE_DIANJISHANGCHUAN')}</div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </Upload.Dragger>
                    </div>
                  </div>
                </div>
                <div className={styles.formLine}>
                  <div className={styles.formLabel}>{getIn18Text('SITE_WENZHANGFENLEI')}</div>
                  <div className={styles.selectContainer}>
                    <Select
                      style={{ width: '298px' }}
                      value={categoryList.some(i => i.value === category) ? category : undefined}
                      onChange={handleSelectCategory}
                      options={categoryList}
                      placeholder={getIn18Text('SITE_QINGXUANZEFENLEI')}
                    />
                  </div>
                </div>

                <div className={styles.formLine}>
                  <div className={styles.formLabel}>
                    {type === 'create' ? null : <span>*</span>}
                    {getIn18Text('SITE_WENZHANGLIANJIE')}
                    <Tooltip placement="topLeft" title="该文章详情页的链接名 URL">
                      <span style={{ marginLeft: 4, display: 'flex', alignItems: 'center' }}>
                        <WenhaoIcon />
                      </span>
                    </Tooltip>
                  </div>
                  <div className={articleUrlError !== '' ? styles.errorSelectContainer : styles.selectContainer}>
                    <Input
                      addonBefore={domainName === '' ? null : <DomainNameTip name={domainName} />}
                      style={{ flex: 1 }}
                      value={articleUrl}
                      onChange={handleUrlChange}
                      placeholder={getIn18Text('SITE_QINGSHURUWENZHANGLIANJIE')}
                      maxLength={250}
                    />
                    {articleUrlError && <div className={styles.errorTip}>{articleUrlError}</div>}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
        <div className={styles.articleInfoTitle}>
          {getIn18Text('SITE_WENZHANGXIANGQING')}
          <div className={styles.operator}>
            <span onClick={previewArticle}>{getIn18Text('SITE_YULAN')}</span>
            <span onClick={toggleFullScreen}>{fullScreen ? '收起' : getIn18Text('SITE_QUANPING')}</span>
          </div>
        </div>
        <div className={fullScreen ? styles.articleEditorFull : styles.articleEditor}></div>
      </div>
      <div className={styles.submitBtnGroup}>
        <button className={styles.cancelBtn} onClick={closeModal}>
          取消
        </button>
        <button className={submiting || loading ? styles.submitBtnDisabled : styles.submitBtn} onClick={updateArticleHandler}>
          {submiting ? '保存中...' : loading ? '加载中...' : '保存'}
        </button>
      </div>
    </div>
  );
};
