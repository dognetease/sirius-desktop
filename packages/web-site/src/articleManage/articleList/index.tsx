import React, { useState, useEffect, useRef, useMemo } from 'react';
import Breadcrumb from '@web-site/components/Breadcrumb';
import { Table, Input, Spin, message, Upload, Tooltip } from 'antd';
import type { RcFile } from 'antd/es/upload/interface';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { navigate } from '@reach/router';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { Select } from '@/components/Layout/Customer/components/commonForm/Components';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { api, apis, SiteApi, getIn18Text } from 'api';
import { config as envDefConfig } from 'env_def';
import { ReactComponent as EmptyIcon } from '../../images/empty-1.svg';
import { ReactComponent as SearchIcon } from '../../images/search.svg';
import { ReactComponent as SearchEmptyIcon } from '../../images/search-empty.svg';
import { ReactComponent as LoadingIcon } from '../../images/loading-small.svg';
import { ReactComponent as AddIcon } from '../../images/add.svg';
import { ReactComponent as ReplaceIcon } from '../../images/replace-icon-s.svg';
import { ReactComponent as DeleteIcon } from '../../images/delete-icon-s.svg';
import { ReactComponent as PreviewIcon } from '../../images/preview-icon.svg';
import { ReactComponent as WenhaoIcon } from '../../images/wenhao.svg';

import styles from './style.module.scss';
import edmStyle from '@web-edm/edm.module.scss';

const { Option } = Select;

const StatusList = [
  { label: getIn18Text('SITE_QUANBUZHUANGTAI'), value: '' },
  { label: getIn18Text('SITE_YIFABU'), value: 'online' },
  { label: getIn18Text('SITE_WEIFABU'), value: 'offline' },
];
interface SiteBindDomainListItem {
  customIndexUrl: string;
  domain: string;
  domainStatus: number;
}
export interface ArticleItem {
  articleId: string;
  categoryId: string;
  categoryName: string;
  createTime: number;
  siteName: string;
  siteId: string;
  status: string;
  thumbnail: string;
  title: string;
}

const DomainNameTip = (props: { name: string }) => {
  return (
    <Tooltip title={props.name}>
      <div className={styles.domainNameTip}>{props.name}</div>
    </Tooltip>
  );
};

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
export const ArticleList = () => {
  const columns: ColumnsType<ArticleItem> = [
    {
      title: getIn18Text('SITE_BIAOTI'),
      dataIndex: 'title',
      render: (value, record) => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('SITE_FENGMIANTU'),
      dataIndex: 'thumbnail',
      render: value =>
        value ? (
          <div className={styles.thumbnailContainer}>
            <div className={styles.thumbnailMask} onClick={() => previewPic(value)}>
              <PreviewIcon />
            </div>
            <img className={styles.thumbnail} src={value} />
          </div>
        ) : null,
    },
    {
      title: getIn18Text('SITE_FENLEI'),
      dataIndex: 'categoryName',
      render: value => <EllipsisTooltip>{value && value !== 'root' ? value : '未分类'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('SITE_SUOSHUZHANDIAN'),
      dataIndex: 'siteName',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('SITE_ZHUANGTAI'),
      dataIndex: 'status',
      render: (value, record) => (
        <div className={styles[value === 'online' ? 'success' : 'disable']}>{value === 'online' ? getIn18Text('SITE_YIFABU') : getIn18Text('SITE_WEIFABU')}</div>
      ),
    },
    {
      title: getIn18Text('SITE_CHUANGJIANRIQI'),
      dataIndex: 'createTime',
      render: value => <EllipsisTooltip>{value ? dayjs(value).format('YYYY-MM-DD') : '-'}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('SITE_CAOZUO'),
      fixed: 'right',
      dataIndex: 'articleId',
      width: '210px',
      render: (value, record) => {
        return (
          <div className={styles.linkGroup}>
            <div className={styles.link} onClick={() => previewArticle(record)}>
              {getIn18Text('SITE_YULAN')}
            </div>
            {record.status === 'online' ? (
              <div className={styles.link} onClick={() => offlineArticle(record)}>
                {getIn18Text('SITE_XIAXIAN')}
              </div>
            ) : (
              <>
                <div className={styles.link} onClick={() => onlineArticle(record)}>
                  发布
                </div>
                <div className={styles.link} onClick={() => editArticle(record)}>
                  编辑
                </div>
              </>
            )}
            <div className={styles.link} onClick={() => deleteArticle(record)}>
              {getIn18Text('SITE_SHANCHU')}
            </div>
          </div>
        );
      },
    },
  ];

  const [list, setList] = useState<ArticleItem[]>([]);
  const [siteList, setSiteList] = useState<{ value: string; label: string; deleted: boolean; siteBindDomainList: SiteBindDomainListItem[]; indexUrl: string }[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, { value: string; label: string }[]>>({});
  const [categoryList, setCategoryList] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [siteId, setSiteId] = useState('');
  const [status, setStatus] = useState('');
  const [submiting, setSubmiting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleTitleError, setArticleTitleError] = useState('');
  const [articleSiteId, setArticleSiteId] = useState<string>();
  const [articleSiteIdError, setArticleSiteIdError] = useState('');
  const [articleUrl, setArticleUrl] = useState<string>('');
  const [articleUrlError, setArticleUrlError] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [category, setCategory] = useState<string>();
  const [showPic, setShowPic] = useState(false);
  const [pic, setPic] = useState('');
  const submitingRef = useRef(false);

  const getAllBindSite = async () => {
    try {
      const allSite = await siteApi.siteInfo({ publishStatusList: ['ONLINE', 'DRAFT'], isShowOuterSite: false });
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
      if (options.length >= 1) options.unshift({ value: '', label: getIn18Text('SITE_QUANBUZHANDIAN') });
      setSiteList(options);
    } catch {}
  };

  const domainName = useMemo(() => {
    const selectSite = siteList.find(item => {
      return item.value === articleSiteId;
    });
    if (!selectSite) return '';

    const { indexUrl, siteBindDomainList } = selectSite;
    if (siteBindDomainList.length > 0) {
      return `${siteBindDomainList[0].customIndexUrl}/`;
    }
    if (indexUrl === '') return indexUrl;
    return `${indexUrl}/`;
  }, [siteList, articleSiteId]);

  const goCategory = () => {
    navigate('#site?page=categoryList');
  };

  const getList = async () => {
    setLoading(true);
    try {
      let page = 0;
      const res = await siteApi.listArticle({
        title,
        status,
        siteId,
        page,
        size: 500,
      });
      let result = res.data;
      let total = res.total;
      while (total > result.length) {
        page += 1;
        const nextRes = await siteApi.listArticle({
          title,
          status,
          siteId,
          page,
          size: 500,
        });
        result = result.concat(nextRes.data);
        total = nextRes.total;
      }
      setList([]);
      setTimeout(() => setList(result));
    } finally {
      setLoading(false);
    }
  };

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
    } catch {}
  };

  useEffect(() => {
    getAllBindSite();
    getList();
    getCategorys();
  }, []);

  useEffect(() => {
    getList();
  }, [title, siteId, status]);

  const goSite = () => {
    navigate('#site?page=mySite');
  };

  const goEdit = (id: string, siteId: string, isCreate = false) => {
    navigate(`#site?page=articleEdit&type=${isCreate ? 'create' : 'edit'}&articleId=${id}&siteId=${siteId}`);
  };

  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const onSiteIdChange = (v: any) => {
    setSiteId(v ?? '');
  };

  const onStatusChange = (v: any) => {
    setStatus(v ?? '');
  };

  const deleteArticleHandler = async (record: ArticleItem) => {
    const { articleId, siteId } = record;
    try {
      await siteApi.deleteArticle({ articleId, siteId });
      getList();
    } catch {}
  };

  const deleteArticle = (record: ArticleItem) => {
    Modal.error({
      className: styles.errorModal,
      title: '删除文章将同时删除站点中的对应文章，是否继续？',
      content: '删除后不可恢复，请谨慎删除',
      okText: '确认删除',
      cancelText: '取消',
      onOk: () => deleteArticleHandler(record),
    });
  };

  const offlineArticle = (record: ArticleItem) => {
    Modal.error({
      className: styles.errorModal,
      title: '下线文章后站点将不展示此文章',
      content: '下线后可在「未发布」进行文章的发布上线',
      okText: '确认下线',
      cancelText: '取消',
      onOk: () => offlineArticleHandler(record),
    });
  };

  const previewArticle = (record: ArticleItem) => {
    const { siteId, articleId } = record;
    const path =
      envDefConfig('stage') === 'prod'
        ? `https://sirius-it-site.lx.netease.com/${siteId}/news/${articleId}.html?previewSiteId=${siteId}`
        : `https://sirius-it-site.cowork.netease.com/${siteId}/news/${articleId}.html?previewSiteId=${siteId}`;
    window.open(path);
  };

  const editArticle = (record: ArticleItem) => {
    goEdit(record.articleId, record.siteId);
  };

  const offlineArticleHandler = async (record: ArticleItem) => {
    const { articleId, siteId } = record;
    try {
      await siteApi.changeStatus({ articleId, siteId, status: 'offline' });
      message.success('下线成功');
      setLoading(true);
      setTimeout(() => getList(), 1000);
    } catch {}
  };

  const onlineArticle = async (record: ArticleItem) => {
    const hide = message.loading('发布中，请稍等…', 0);
    const { articleId, siteId } = record;
    let res;
    try {
      res = await siteApi.changeStatus({ articleId, siteId, status: 'online' });
    } catch {
      hide();
      message.error('发布失败');
      return;
    }
    hide();
    if (res.code == 90001002) {
      message.error('填写的内容不合法，请检查更正后发布');
    } else {
      message.success('发布成功');
      setLoading(true);
      setTimeout(() => getList(), 1000);
    }
  };

  const createArticle = () => {
    let cur: string | undefined = undefined;
    if (siteId) {
      const target = siteList.find(i => i.value === siteId);
      if (target && target.value && !target.deleted) {
        cur = target.value;
        setCategoryList(categoryMap[cur] ?? []);
      }
    }
    setArticleSiteId(cur);
    setShowCreate(true);
  };

  const closeModal = () => {
    setShowCreate(false);
    setArticleSiteId(undefined);
    setArticleTitle('');
    setArticleSiteIdError('');
    setArticleTitleError('');
    setUpdating(false);
    setThumbnail('');
    setCategory(undefined);
  };

  const createArticleHandler = async () => {
    let withError = false;
    if (!articleTitle) {
      setArticleTitleError(getIn18Text('SITE_QINGSHURUWENZHANGBIAOTI'));
      withError = true;
    }
    if (!articleSiteId) {
      setArticleSiteIdError(getIn18Text('SITE_QINGSHURUWENZHANGBIAOTI'));
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
      const res = await siteApi.createArticle({
        title: articleTitle,
        siteId: articleSiteId!,
        thumbnail,
        categoryId: category || '0',
        pagePath: articleUrl,
      });
      closeModal();
      if (!res?.articleId) return message.error('创建失败');
      goEdit(res.articleId, res.siteId, true);
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
    if (e.target.value !== '' && !/^[a-zA-Z0-9\-_~]*(\.html)?$/.test(e.target.value)) {
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

  const closeShowPic = () => {
    setShowPic(false);
    setPic('');
  };

  const previewPic = (url: string) => {
    setPic(url);
    setShowPic(true);
  };

  return (
    <div className={styles.articleListContainer}>
      <div className={styles.articleListHeader}>
        <div onClick={getList} className={styles.articleListHeaderTabActive}>
          {getIn18Text('SITE_WENZHANGGUANLI')}
          <span />
        </div>
        <div onClick={goCategory} className={styles.articleListHeaderTab}>
          {getIn18Text('SITE_WENZHANGFENLEI')}
        </div>
      </div>
      <div className={styles.articleListContent}>
        {!loading && siteList.length === 0 ? (
          <div className={styles.emptyContainer}>
            <EmptyIcon />
            <span>
              创建站点后才可以创建和管理文章，去
              <span className={styles.link} onClick={goSite}>
                我的站点
              </span>
              创建新的站点
            </span>
          </div>
        ) : (
          <>
            <div className={styles.articleListSearchbar}>
              <Input
                value={title}
                style={{ width: '220px', marginRight: '12px', height: '32px' }}
                onChange={onTitleChange}
                prefix={<SearchIcon />}
                placeholder={getIn18Text('SITE_SHURUBIAOTISOUSUOWENZHANG')}
              />
              <Select value={siteId} style={{ width: '260px', marginRight: '12px', height: '32px' }} onChange={onSiteIdChange}>
                {siteList.map(i => {
                  const { label, value, deleted } = i;
                  return (
                    <Option value={value} label={label}>
                      <div className={styles.option}>
                        <div>{label}</div>
                        {deleted && <span className={styles.deleted}>已删除</span>}
                      </div>
                    </Option>
                  );
                })}
              </Select>
              <Select value={status} style={{ width: '140px', height: '32px' }} onChange={onStatusChange} options={StatusList} />
              <button className={styles.addBtn} onClick={createArticle}>
                {getIn18Text('SITE_XINJIAN')}
              </button>
            </div>
            <div className={styles.articleListTable}>
              {!loading && list.length === 0 ? (
                <div className={styles.emptyContainer}>
                  {title ? <SearchEmptyIcon /> : <EmptyIcon />}
                  <span>{title ? '暂未找到搜索内容' : '暂无文章内容'}</span>
                </div>
              ) : (
                <Table
                  locale={{ emptyText: <div /> }}
                  className={`${edmStyle.contactTable}`}
                  rowKey="articleId"
                  loading={loading}
                  columns={columns}
                  dataSource={list}
                  scroll={{ x: list.length ? 910 : 0 }}
                  pagination={false}
                />
              )}
            </div>
          </>
        )}
      </div>
      <Modal
        zIndex={800}
        visible={showCreate}
        getContainer={false}
        width={480}
        className={styles.selectModal}
        title={getIn18Text('SITE_XINJIANWENZHANG')}
        footer={null}
        maskClosable={false}
        destroyOnClose={true}
        onCancel={closeModal}
      >
        <div className={styles.formLine}>
          <div className={styles.formLabel}>
            <span>*</span>
            {getIn18Text('SITE_WENZHANGBIAOTI')}
          </div>
          <div className={articleTitleError ? styles.errorSelectContainer : styles.selectContainer}>
            <Input
              style={{ flex: 1, width: '360px' }}
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
            <Select
              style={{ width: '360px' }}
              value={articleSiteId}
              onChange={handleSelect}
              options={siteList.filter(i => i.value !== '' && !i.deleted)}
              placeholder={getIn18Text('SITE_QINGXUANZEZHANDIAN')}
            />
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
                                <div className={styles.replaceText}>{getIn18Text('SITE_SHANCHU')}</div>
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
            <div className={styles.uploadTips}>建议上传尺寸440x248，大小不超过5M，格式jpg、png</div>
          </div>
        </div>
        <div className={styles.formLine}>
          <div className={styles.formLabel}>{getIn18Text('SITE_WENZHANGFENLEI')}</div>
          <div className={styles.selectContainer}>
            <Select
              style={{ width: '360px' }}
              value={category}
              onChange={handleSelectCategory}
              options={categoryList}
              placeholder={getIn18Text('SITE_QINGXUANZEFENLEI')}
            />
          </div>
        </div>
        <div className={styles.formLine}>
          <div className={styles.formLabel}>
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
              style={{ flex: 1, width: '360px' }}
              value={articleUrl}
              onChange={handleUrlChange}
              placeholder={getIn18Text('SITE_QINGSHURUWENZHANGLIANJIE')}
              maxLength={250}
            />
            {articleUrlError && <div className={styles.errorTip}>{articleUrlError}</div>}
          </div>
        </div>
        <div className={styles.submitBtnGroup}>
          <button className={styles.cancelBtn} onClick={closeModal}>
            取消
          </button>
          <button className={submiting ? styles.submitBtnDisabled : styles.submitBtn} onClick={createArticleHandler}>
            {submiting ? '提交中...' : '确定'}
          </button>
        </div>
      </Modal>
      <Modal
        zIndex={800}
        visible={showPic}
        getContainer={false}
        width={480}
        className={styles.certModal}
        title="预览封面图"
        maskClosable={false}
        destroyOnClose={true}
        footer={null}
        onCancel={closeShowPic}
      >
        {pic ? <img src={pic} className={styles.picPreview} /> : null}
      </Modal>
    </div>
  );
};
