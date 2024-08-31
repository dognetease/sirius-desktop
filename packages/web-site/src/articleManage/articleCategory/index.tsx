import React, { useState, useEffect, useRef } from 'react';
import Breadcrumb from '@web-site/components/Breadcrumb';
import { Table, Input, Spin, message } from 'antd';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { ColumnsType } from 'antd/lib/table';
import { navigate } from '@reach/router';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { Select } from '@/components/Layout/Customer/components/commonForm/Components';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { api, apis, SiteApi, getIn18Text } from 'api';
import { ReactComponent as EmptyIcon } from '../../images/empty-1.svg';
import { ReactComponent as DragIcon } from '../../images/drag-icon.svg';
import styles from './style.module.scss';
import edmStyle from '@web-edm/edm.module.scss';

const { Option } = Select;

export interface CategoryItem {
  categoryId: string;
  categoryName: string;
  siteId: string;
}

const DragHandle = SortableHandle(() => <DragIcon />);
const SortableItem = SortableElement((props: object) => <tr {...props} />);
const SortableBody = SortableContainer((props: object) => <tbody {...props} />);

interface IDraggableContainerProps {
  onSortEnd: ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => void;
}
const DraggableContainer = (props: IDraggableContainerProps) => (
  <SortableBody useDragHandle disableAutoscroll helperClass={styles.rowDragging} {...props} onSortEnd={props.onSortEnd} />
);

interface IDraggableBodyRowProps {
  className?: string;
  style?: object;
  dataSource: CategoryItem[];
  'data-row-key'?: string;
}

const DraggableBodyRow = ({ className, style, dataSource, ...restProps }: IDraggableBodyRowProps) => {
  const index = dataSource.findIndex(x => x.categoryId === restProps['data-row-key']);
  return <SortableItem index={index} {...restProps} />;
};

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
export const ArticleCategory = () => {
  const columns: ColumnsType<CategoryItem> = [
    {
      title: '分类名',
      dataIndex: 'categoryName',
      ellipsis: true,
      render: (value, record) => (
        <div className={styles.dragIcon}>
          <DragHandle />
          <EllipsisTooltip>{value}</EllipsisTooltip>
        </div>
      ),
    },
    {
      title: '操作',
      width: 200,
      dataIndex: 'categoryId',
      render: (value, record) => {
        return (
          <div className={styles.linkGroup}>
            <div className={styles.link} onClick={() => editArticle(record)}>
              编辑
            </div>
            <div className={styles.link} onClick={() => deleteArticle(record)}>
              {getIn18Text('SITE_SHANCHU')}
            </div>
          </div>
        );
      },
    },
  ];

  const [list, setList] = useState<CategoryItem[]>([]);
  const [siteList, setSiteList] = useState<{ value: string; label: string; deleted: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteId, setSiteId] = useState<string>('');
  const [submiting, setSubmiting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleTitleError, setArticleTitleError] = useState('');
  const [articleSiteId, setArticleSiteId] = useState<string>();
  const [articleSiteIdError, setArticleSiteIdError] = useState('');
  const [modalTitle, setModalTitle] = useState('新建文章分类');
  const [categoryId, setCategoryId] = useState('');
  const submitingRef = useRef(false);
  const openRef = useRef(false);

  const getAllBindSite = async () => {
    try {
      const allSite = await siteApi.siteInfo({ publishStatusList: ['ONLINE', 'DRAFT'], isShowOuterSite: false });
      const options = (allSite ?? []).map(({ siteId, siteName, deleted }: { siteId: string; siteName: string; deleted: boolean }) => {
        return { value: siteId, label: siteName, deleted };
      });
      setSiteList(options);
      setSiteId(options[0].value);
    } catch {}
  };

  const getList = async () => {
    setLoading(true);
    try {
      if (siteId) {
        const list = await siteApi.listCategory({ siteId });
        setList(list ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllBindSite();
    getList();
  }, []);

  useEffect(() => {
    getList();
  }, [siteId]);

  const goSite = () => {
    navigate('#site?page=mySite');
  };

  const goList = () => {
    navigate('#site?page=articleList');
  };

  const onSiteIdChange = (v: any) => {
    setSiteId(v ?? '');
  };

  const deleteArticleHandler = async (record: CategoryItem) => {
    const { siteId, categoryId } = record;
    try {
      await siteApi.deleteCategory({ siteId, categoryId });
      getList();
    } catch {}
  };

  const deleteArticle = (record: CategoryItem) => {
    Modal.error({
      className: styles.errorModal,
      title: '删除分类将同时删除站点中对应分类，分类下文章将转移至「未分类」中，是否继续？',
      content: '删除后不可恢复，请谨慎删除',
      okText: '确认删除',
      cancelText: '取消',
      onOk: () => deleteArticleHandler(record),
    });
  };

  const editArticle = (record: CategoryItem) => {
    setModalTitle('编辑文章分类');
    setArticleTitle(record.categoryName);
    setArticleSiteId(record.siteId);
    setCategoryId(record.categoryId);
    setShowCreate(true);
    openRef.current = true;
  };

  const createArticle = () => {
    let cur: string | undefined = undefined;
    if (siteId) {
      const target = siteList.find(i => i.value === siteId);
      if (target && target.value && !target.deleted) cur = target.value;
    }
    setArticleSiteId(cur);
    setModalTitle('新建文章分类');
    setArticleTitle('');
    setCategoryId('');
    setShowCreate(true);
    openRef.current = true;
  };

  const closeModal = () => {
    setShowCreate(false);
    openRef.current = false;
    setArticleSiteId(undefined);
    setArticleTitle('');
    setArticleSiteIdError('');
    setArticleTitleError('');
    setCategoryId('');
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
    if (withError) return;
    if (submitingRef.current || !openRef.current) return;
    submitingRef.current = true;
    setSubmiting(true);
    try {
      if (modalTitle === '新建文章分类') {
        await siteApi.createCategory({ categoryName: articleTitle, siteId: articleSiteId! });
      } else {
        await siteApi.updateCategory({ categoryId, categoryName: articleTitle, siteId: articleSiteId!, originSiteId: siteId });
      }
      message.success('保存成功');
      closeModal();
      getList();
    } finally {
      setSubmiting(false);
      submitingRef.current = false;
    }
  };

  const handleSelect = (v: any) => {
    setArticleSiteId(v);
    setArticleSiteIdError('');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArticleTitle(e.target.value);
    setArticleTitleError('');
  };

  const onSortEnd = async ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
    if (oldIndex !== newIndex) {
      const isAfter = newIndex > oldIndex;
      const current = list[oldIndex];
      const target = list[newIndex];
      try {
        setLoading(true);
        await siteApi.orderCategory({
          categoryId: current.categoryId,
          siteId: current.siteId,
          dragAction: isAfter ? 'down' : 'up',
          targetNodeId: target.categoryId,
        });
        await getList();
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.articleCategoryContainer}>
      <div className={styles.articleCategoryHeader}>
        <div onClick={goList} className={styles.articleCategoryHeaderTab}>
          {getIn18Text('SITE_WENZHANGGUANLI')}
        </div>
        <div className={styles.articleCategoryHeaderTabActive}>
          {getIn18Text('SITE_WENZHANGFENLEI')}
          <span />
        </div>
      </div>
      <div className={styles.articleCategoryContent}>
        {!loading && siteList.length === 0 ? (
          <div className={styles.emptyContainer}>
            <EmptyIcon />
            <span>
              创建站点后才可以创建和管理分类，去
              <span className={styles.link} onClick={goSite}>
                我的站点
              </span>
              创建新的站点
            </span>
          </div>
        ) : (
          <>
            <div className={styles.articleCategorySearchbar}>
              <div>所属站点：</div>
              <Select value={siteId} style={{ width: '160px' }} onChange={onSiteIdChange}>
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
              <button className={styles.addBtn} onClick={createArticle}>
                {getIn18Text('SITE_XINJIAN')}
              </button>
            </div>
            <div className={styles.articleCategoryTable}>
              {!loading && list.length === 0 ? (
                <div className={styles.emptyContainer}>
                  <EmptyIcon />
                  <span>该站点下暂无分类</span>
                </div>
              ) : (
                <Table
                  locale={{ emptyText: <div /> }}
                  className={`${edmStyle.contactTable}`}
                  rowKey="categoryId"
                  loading={loading}
                  columns={columns}
                  dataSource={list}
                  pagination={false}
                  components={{
                    body: {
                      wrapper: (props: object) => <DraggableContainer {...props} onSortEnd={onSortEnd} />,
                      row: (props: object) => <DraggableBodyRow {...props} dataSource={list} />,
                    },
                  }}
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
        title={modalTitle}
        footer={null}
        maskClosable={false}
        destroyOnClose={true}
        onCancel={closeModal}
      >
        <div className={styles.formLine}>
          <div className={styles.formLabel}>
            <span>*</span>
            {getIn18Text('SITE_FENLEIMINGCHENG')}
          </div>
          <div className={articleTitleError ? styles.errorSelectContainer : styles.selectContainer}>
            <Input style={{ flex: 1 }} value={articleTitle} onChange={handleTitleChange} placeholder="请输入分类名称" maxLength={250} />
            {articleTitleError && <div className={styles.errorTip}>请输入分类名称</div>}
          </div>
        </div>
        <div className={styles.formLine}>
          <div className={styles.formLabel}>
            <span>*</span>
            {getIn18Text('SITE_SUOSHUZHANDIAN')}
          </div>
          <div className={articleSiteIdError ? styles.errorSelectContainer : styles.selectContainer}>
            <Select style={{ width: '360px' }} value={articleSiteId} onChange={handleSelect} placeholder={getIn18Text('SITE_QINGXUANZEZHANDIAN')}>
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
        <div className={styles.submitBtnGroup}>
          <button className={styles.cancelBtn} onClick={closeModal}>
            取消
          </button>
          <button className={submiting ? styles.submitBtnDisabled : styles.submitBtn} onClick={createArticleHandler}>
            {submiting ? '提交中...' : '确定'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
