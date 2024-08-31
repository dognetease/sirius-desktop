import React, { FC, useState, useCallback, useEffect } from 'react';
import { apiHolder, getIn18Text, apis, MailTemplateApi, GetTemplateListReq, DataStoreApi, TemplateConditionRes, GetTemplateListRes } from 'api';
import { message, Modal, Skeleton, Drawer } from 'antd';
import classnames from 'classnames';
import Breadcrumb from '@web-common/components/UI/Breadcrumb';
import Tabs from '@web-common/components/UI/Tabs';
import { navigate } from '@reach/router';
import { Radio } from '@web-common/components/UI/Radio';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import NoResultImg from '@/images/icons/edm/empty.png';

import { CreateTemplateBtn } from '../CreateTemplateBtn';
import layoutStyles from '../mailTemplateV2.module.scss';
import styles from './TemplateListV2.module.scss';
import { PersonalCard } from '../MailTemplateListV2/PersonalCard';
import { RecommendCard } from '../MailTemplateListV2/RecommendCard';
import { Action, ActionType, ListType } from '../MailTemplateListV2/MailTemplateListV2';
import { setTemplateContent } from '../template-util';
import { TemplateAddModal } from '../template';
import Preview from '../template/preview';
import { edmDataTracker } from '../../tracker/tracker';

const systemApi = apiHolder.api.getSystemApi();
const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';
const YINGXIAO = 'LX-WAIMAO';
const templateApi = apiHolder.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
const { TabPane } = Tabs;

const dataOption = [
  {
    label: '测试1',
    value: 1,
  },
  {
    label: '测试2',
    value: 0,
  },
];

export const TemplateListV2: FC<{
  tabId: number;
  goBack?: () => void;
  pageTitle?: string;
  /**
   * 是否从写信页进入
   */
  isFormWrite?: boolean;
  /**
   * 查看模板
   */
  displayTemplate?: (id: string) => void;
  addNewTemplate?: (content?: string) => Promise<void>;
  goTemplateAdd?: () => void;
  goRecommendPage?: () => void;
  onUse?: (templateId?: string, content?: string) => void;
  /**
   * 用来定制推荐弹窗样式和按钮
   */
  isFromModal?: boolean;
  useRecommendContent?: (content: string) => void;
  goTaskList?: () => void;
  listType: ListType;
}> = props => {
  const {
    goBack,
    pageTitle,
    tabId,
    displayTemplate,
    addNewTemplate: addNewTemplateOrigin,
    isFormWrite,
    goTemplateAdd,
    goRecommendPage,
    onUse,
    isFromModal,
    useRecommendContent,
    goTaskList,
    listType,
  } = props;
  const [activeKey, setActiveKey] = useState<number>();
  const [showDrawer, setShowDrawer] = useState(false);
  const [previewId, setPreviewId] = useState('');
  const [allTemplateId, setAllTemplateId] = useState<Array<string>>([]);

  const [tagList, setTagList] = useState<TemplateConditionRes['tabList'][number]['tagList']>();
  const [orderList, setOrderList] = useState<TemplateConditionRes['tabList'][number]['orderList']>();
  const [typeList, setTypeList] = useState<TemplateConditionRes['tabList'][number]['typeList']>();

  const [conditionQuery, setConditionQuery] = useState<GetTemplateListReq>();

  const [templateList, setTemplateList] = useState<GetTemplateListRes['templateList']>();
  const [editContent, setEditContent] = useState('');
  const [curTemplateId, setCurTemplateId] = useState('');
  const [loading, setLoading] = useState(false);

  const addNewTemplate = (content: string, id: string = '') => {
    setCurTemplateId(id);
    setEditContent(content);
  };

  // 获取条件
  const getQueryCondition = useCallback(async () => {
    setLoading(true);
    try {
      const { tabList } = await templateApi.getQueryCondition({
        fromPage: 2, // 固定2
      });
      const curTabInfo = tabList.find(tabInfo => tabInfo.tab.tabId === tabId);
      if (curTabInfo) {
        setTagList(curTabInfo.tagList);
        setOrderList(curTabInfo.orderList);
        setTypeList(curTabInfo.typeList);

        let curTag = curTabInfo.tagList ? curTabInfo.tagList[0].tagId : undefined;
        let curOrder = curTabInfo.orderList ? curTabInfo.orderList[0].orderId : undefined;
        let curType = curTabInfo.typeList ? curTabInfo.typeList[0].typeId : undefined;
        const query: GetTemplateListReq = {
          templateCategory: YINGXIAO,
          tabType: tabId,
          ...{ tagId: curTag },
          ...(curOrder != null
            ? {
                order: {
                  index: curOrder,
                  sort: 1,
                },
              }
            : {}),
          ...(curType != null ? { templateContentType: curType } : {}),
        };
        setConditionQuery(query);
      }
    } catch (err) {
      message.error((err as Error).message || '未知错误');
    }
    setLoading(false);
  }, [tabId]);

  // 获取列表
  const getTemplateList = useCallback(async (req: GetTemplateListReq) => {
    setLoading(true);
    try {
      const list = await templateApi.getTemplateList(req);
      setTemplateList(list?.templateList);
      setAllTemplateId(list?.templateList.map(item => item.templateId) || []);
    } catch (err) {
      message.error((err as Error).message || '未知错误');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    conditionQuery && getTemplateList(conditionQuery);
  }, [conditionQuery]);

  useEffect(() => {
    getQueryCondition();
  }, [tabId]);

  const renderTagAggregationList = () => (
    <div className={styles.aggregationList}>
      <div className={styles.aggregationLabel}>标签</div>
      <div className={styles.aggregationRight}>
        {tagList?.map(tag => (
          <div
            key={tag.tagId}
            onClick={() => {
              if (conditionQuery) {
                setConditionQuery({
                  ...conditionQuery,
                  tagId: tag.tagId,
                });
              }
            }}
            className={classnames(styles.myRadio, styles.ellipsis, isFormWrite ? styles.modalRadio : '', conditionQuery?.tagId === tag.tagId ? styles.activeRadio : '')}
          >
            {tag.tagName}
          </div>
        ))}
      </div>
    </div>
  );

  const renderOrderAggregationList = () => (
    <div className={styles.aggregationList}>
      <div className={styles.aggregationLabel}>排序</div>
      <div className={styles.aggregationRight}>
        {orderList?.map(order => (
          <div
            key={order.orderId}
            onClick={() => {
              if (conditionQuery) {
                setConditionQuery({
                  ...conditionQuery,
                  order: {
                    index: order.orderId,
                    sort: 1,
                  },
                });
              }
            }}
            className={classnames(
              styles.myRadio,
              styles.ellipsis,
              isFormWrite ? styles.modalRadio : '',
              conditionQuery?.order?.index === order.orderId ? styles.activeRadio : ''
            )}
          >
            {order.orderName}
          </div>
        ))}
      </div>
    </div>
  );

  const saveTaskAsTemplate = async (templateId: string, callback: (content: string) => any) => {
    try {
      const res = await templateApi.doGetMailTemplateDetail({ templateId });
      if (res.success && res.data) {
        callback(res.data.content);
      }
    } catch (err) {
      message.error('获取任务详情失败，请稍后重试！');
    }
  };

  const renderTypeAggregationList = () => (
    <div className={styles.aggregationList}>
      <div className={styles.aggregationLabel}>类型</div>
      <div className={styles.aggregationRight}>
        {typeList?.map(type => (
          <div
            key={type.typeId}
            onClick={() => {
              if (conditionQuery) {
                setConditionQuery({
                  ...conditionQuery,
                  templateContentType: type.typeId,
                });
              }
            }}
            className={classnames(
              styles.myRadio,
              styles.ellipsis,
              isFormWrite ? styles.modalRadio : '',
              conditionQuery?.templateContentType === type.typeId ? styles.activeRadio : ''
            )}
          >
            {type.typeName}
          </div>
        ))}
      </div>
    </div>
  );

  const actionTrace = (type: ActionType | 'more', source: ListType) => {
    if (!isFormWrite) {
      if (type === 'use') {
        edmDataTracker.templatePageOp('use', source);
      } else if (type === 'saveTemplate') {
        edmDataTracker.templatePageOp('save', source);
      } else if (type === 'display') {
        edmDataTracker.templatePageOp('viewTemplate', source);
      }
    }
  };

  // 所有的卡片操作
  const cardOp: Action = (type, templateId) => {
    actionTrace(type, listType);
    if (type === 'use') {
      // 使用模板
      templateApi.doSaveMailTemplateUseTime({ templateId, time: new Date().getTime() });
      // 获取模板详情，唤起写信
      templateApi.doGetMailTemplateDetail({ templateId }).then(async res => {
        if (res.success && res.data) {
          // if (emitResult) {
          //   const viewMail = await formatViewMail(res.data);
          //   viewMail.form = 'template';
          //   emitResult(viewMail);
          // } else {

          // }
          setTemplateContent(res.data.content, templateId);
          if (isFormWrite) {
            onUse && onUse(templateId, res.data.content);
          } else {
            navigate(`${routerWord}?page=write&from=template`);
          }
        }
      });
    } else if (type === 'display') {
      // 查看
      setShowDrawer(true);
      setPreviewId(templateId);
    } else if (type === 'edit') {
      saveTaskAsTemplate(templateId, content => {
        // 这是邮件模板的跳转
        addNewTemplate && addNewTemplate(content, templateId);
      });
    } else if (type === 'saveTemplate') {
      saveTaskAsTemplate(templateId, content => {
        // 这是邮件模板的跳转
        addNewTemplate && addNewTemplate(content);
      });
    } else if (type === 'delete') {
      Modal.confirm({
        title: getIn18Text('QUEDINGYAOSHANCHUGAIMOBANMA\uFF1F'),
        okText: getIn18Text('QUEDING'),
        cancelText: getIn18Text('QUXIAO'),
        centered: true,
        onOk: () => {
          templateApi
            .doDeleteMailTemplate({
              templateId,
            })
            .then(res => {
              if (res.data === 'success') {
                message.success(getIn18Text('SHANCHUCHENGGONG'));
                conditionQuery && getTemplateList(conditionQuery);
              } else {
                message.error(getIn18Text('SHANCHUSHIBAI\uFF0CQINGZHONGSHI'));
              }
            });
        },
      });
    } else if (type === 'useAsRecommend') {
      saveTaskAsTemplate(templateId, content => {
        // 这是邮件模板的跳转
        useRecommendContent && useRecommendContent(content);
      });
    }
  };

  const renderList = () => {
    return (
      <>
        <div className={styles.aggregationWrap}>
          {tagList != null && renderTagAggregationList()}
          {orderList != null && renderOrderAggregationList()}
          {typeList != null && renderTypeAggregationList()}
        </div>
        {loading ? (
          <div
            style={{
              padding: 16,
            }}
          >
            <Skeleton active />
          </div>
        ) : (
          <div className={styles.cardList}>
            {templateList != null ? (
              templateList.map(templateInfo => (
                <div className={styles.cardItem} key={templateInfo.templateId}>
                  <PersonalCard isFromModal={isFromModal} isFormWrite={isFormWrite} tagInfo="" templateInfo={templateInfo} cardOp={cardOp} />
                </div>
              ))
            ) : (
              <div className={styles.noResult}>
                <img src={NoResultImg} alt="" />
                <div>暂无模板</div>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  // 需要previewId、showDrawer
  const renderTemplateView = () => (
    <Drawer
      bodyStyle={{ padding: '0px' }}
      width={872}
      title={null}
      closable={false}
      onClose={() => {
        setShowDrawer(false);
      }}
      visible={showDrawer}
      destroyOnClose
    >
      <Preview
        templateId={previewId}
        allTemplateId={allTemplateId}
        closeModal={() => {
          setShowDrawer(false);
        }}
        emitResult={() => {}}
        onUse={(content, templateId) => {
          if (isFormWrite) {
            onUse && onUse(templateId, content);
          } else {
            setTemplateContent(content, templateId);
            navigate(`${routerWord}?page=write&from=template`);
          }
        }}
      />
    </Drawer>
  );

  // if (isFormWrite) {
  //   // todo 做一个编辑页UI兼容的列表
  //   // return (
  //   //   <div className={layoutStyles.subWrap}>
  //   //     <div className={layoutStyles.subWrapInner}>{renderList()}</div>
  //   //   </div>
  //   // );
  // }

  const renderAddModal = () => {
    if (isFormWrite) {
      return (
        <SiriusModal
          mask={false}
          getContainer={() => document.querySelector('#edm-write-root')!}
          className={layoutStyles.myModal3}
          visible={editContent !== ''}
          onCancel={() => setEditContent('')}
          title=""
          width={900}
          footer={null}
        >
          <TemplateAddModal
            content={editContent}
            templateId={curTemplateId}
            goMailTemplate={refresh => {
              if (refresh) {
                conditionQuery && getTemplateList(conditionQuery);
              }
              setEditContent('');
              setCurTemplateId('');
              // setPreviewId('');
            }}
          />
        </SiriusModal>
      );
    }
    return (
      <div className={layoutStyles.templateWrapper}>
        <div className={layoutStyles.templateWrapperContent}>
          <div
            className={layoutStyles.editWrap}
            style={{
              marginTop: 0,
            }}
          >
            <TemplateAddModal
              content={editContent}
              templateId={curTemplateId}
              goMailTemplate={refresh => {
                if (refresh) {
                  conditionQuery && getTemplateList(conditionQuery);
                }
                setEditContent('');
                setCurTemplateId('');
                // setPreviewId('');
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    // 以下除了list部分都可以复制
    <>
      {editContent ? (
        renderAddModal()
      ) : (
        <div className={layoutStyles.templateWrapper}>
          <div className={layoutStyles.templateWrapperContent}>
            {!isFormWrite && (
              <div className={layoutStyles.templateHeader}>
                <div className={layoutStyles.topOp}>
                  <div className={layoutStyles.breadcrumbWrap}>
                    <Breadcrumb separator={<SeparatorSvg />}>
                      <Breadcrumb.Item className={layoutStyles.breadcrumb} onClick={goBack}>
                        内容库
                      </Breadcrumb.Item>
                      <Breadcrumb.Item>{pageTitle}</Breadcrumb.Item>
                    </Breadcrumb>
                  </div>
                  <div className={layoutStyles.rightFilter}>
                    <CreateTemplateBtn
                      goTaskList={() => {
                        goTaskList && goTaskList();
                      }}
                      goTemplateAdd={() => {
                        goTemplateAdd && goTemplateAdd();
                      }}
                      goRecommendPage={() => {
                        goRecommendPage && goRecommendPage();
                      }}
                      addNewTemplate={content => {
                        addNewTemplateOrigin && addNewTemplateOrigin(content);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className={classnames(layoutStyles.subWrap, isFormWrite ? layoutStyles.subWrap2 : '')}>
              <div className={layoutStyles.subWrapInner}>{renderList()}</div>
            </div>
          </div>
          {renderTemplateView()}
        </div>
      )}
    </>
  );
};
