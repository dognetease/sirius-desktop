import React, { useState, useEffect } from 'react';
import { Pagination, PaginationProps } from 'antd';
import styles from './index.module.scss';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { api, apiHolder, apis, SiteApi, SystemApi, getIn18Text } from 'api';
import CloseIcon from '../../images/close.svg';
import { TemplateItem, PAGE_TYPE } from '../../constants';
import { EmptyDataContent } from '../EmptyDataContent';
import { config } from 'env_def';
import AISiteBanner from '../AISiteBanner';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const jzHost = config('jzHost') as string;

interface GuideModalProps {
  visible: boolean;
  showChoose: boolean;
  onClose: () => void;
  onOk: (templateId: string) => void;
  onChoose: ({ templateId, templateName }: { templateId: string; templateName: string }) => void;
  onExperienceClick?: () => void;
  currentChooseTemplateId: string;
  pageType: PAGE_TYPE;
}

export const ChooseTemplate = (props: GuideModalProps) => {
  const { pageType, onExperienceClick = () => {} } = props;
  const title = pageType === PAGE_TYPE.MY_SITE ? getIn18Text('XUANZEMOBANDAJIANGUANWANG') : getIn18Text('XUANZEMOBANCHUANGJIANYINGXIAOLUODIYE');

  const [templateList, setTemplateList] = useState<TemplateItem[]>([]);

  const [tags, setTags] = useState<any>([
    {
      tag: '全部',
      tagId: '',
    },
  ]);
  const [currentTag, setCurrentTag] = useState(''); // 空字符串表示全部
  const [pagination, setPagination] = useState({
    pageNo: 1,
    pageSize: 30,
  });
  const [total, setTotal] = useState(0);

  // 获取营销落地页模板列表
  const fetchTemplateList = async (pageNo: number, pageSize: number) => {
    try {
      const res = await siteApi.getTemplateData({
        tagId: currentTag,
        pageNo: pageNo - 1,
        pageSize: pageSize,
        templateType: pageType === PAGE_TYPE.MARKET ? 'LANDING_PAGE' : '',
      });
      setTemplateList(res.data.data || []);
      setTotal(res.data.total ?? 0);
    } catch (e) {
      Toast.error('获取模板数据失败');
    }
  };

  const fetchTagList = async () => {
    const data = (await siteApi.getSiteTemplateTag()) || [];
    setTags([
      {
        tag: '全部',
        tagId: '',
      },
      ...(data || []),
    ]);
  };

  useEffect(() => {
    fetchTagList();
  }, []);

  useEffect(() => {
    fetchTemplateList(pagination.pageNo, pagination.pageSize);
  }, [currentTag, pagination.pageNo, pagination.pageSize]);

  const onPaginationChange: PaginationProps['onChange'] = (page: number, pageSize: any) => {
    setPagination({
      pageNo: page,
      pageSize,
    });
  };

  // 去预览
  const goPreview = (templateId: string) => {
    // props.onClose();
    const isElectron = systemApi.isElectron();
    if (isElectron) {
      const url = jzHost + `/site/editor/#/templates?from=preview&templateId=${templateId}`;
      templateId && systemApi.openNewWindow(url, false);
    } else {
      templateId && window.open(`/site/editor/#/templates?from=preview&templateId=${templateId}`, '_blank');
    }
  };

  return (
    <Modal
      visible={true}
      getContainer={false}
      width={'auto'}
      className={styles.chooseTemplateModal}
      destroyOnClose={true}
      maskClosable={false}
      onCancel={props.onClose}
      footer={null}
      closeIcon={<img src={CloseIcon} />}
    >
      <div className={styles.header}>{title}</div>
      <div className={styles.main}>
        {pageType === PAGE_TYPE.MY_SITE && (
          <div className={styles.mainTabs}>
            {tags.map((item: any) => (
              <div
                key={item.tagId}
                onClick={() => {
                  setPagination({
                    pageNo: 1,
                    pageSize: pagination.pageSize,
                  });
                  setCurrentTag(item.tagId);
                }}
                className={styles.mainTabsItem + (currentTag == item.tagId ? ' active' : '')}
              >
                <EllipsisTooltip>{item.tag}</EllipsisTooltip>
              </div>
            ))}
          </div>
        )}

        <div className={styles.mainRight}>
          <div className={styles.mainRightContent}>
            {pageType === PAGE_TYPE.MY_SITE && currentTag === '' && <AISiteBanner style={{ marginBottom: 25 }} onExperienceClick={onExperienceClick} />}
            {templateList.length > 0 ? (
              <div className={styles.list}>
                {templateList.map(template => (
                  <div className={styles.listItem} key={template.templateId}>
                    <div
                      className={styles.cover}
                      style={{
                        backgroundImage: `url(${template.thumbnail})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {props.currentChooseTemplateId === template.templateId && <div className={styles.used}>使用中</div>}
                      <div className={styles.mask}>
                        <button onClick={() => goPreview(template.templateId)}>{getIn18Text('YULAN')}</button>
                        {props.showChoose ? (
                          <button
                            onClick={() =>
                              props.onChoose({
                                templateId: template.templateId,
                                templateName: template.templateName,
                              })
                            }
                            style={{ marginLeft: '24px' }}
                          >
                            {getIn18Text('XUANZE')}
                          </button>
                        ) : (
                          <button onClick={() => props.onOk(template.templateId)} style={{ marginLeft: '24px' }}>
                            进入编辑
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={styles.message}>{template.templateName}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyDataContent style={{ marginTop: pageType === PAGE_TYPE.MY_SITE ? '170px' : '41px' }} />
            )}
          </div>

          {pageType === PAGE_TYPE.MY_SITE && (
            <div className={styles.mainRightPagination}>
              <Pagination
                total={total}
                showTotal={total => `共${total}条数据`}
                pageSize={pagination.pageSize}
                current={pagination.pageNo}
                pageSizeOptions={['30', '60', '100']}
                onChange={onPaginationChange}
                showSizeChanger={true}
                size="small"
                className="pagination-wrap"
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
