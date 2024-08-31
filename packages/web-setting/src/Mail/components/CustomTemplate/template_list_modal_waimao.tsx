import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, Menu, Dropdown, Popover, Button } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import MoreOutlined from '@ant-design/icons/MoreOutlined';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import {
  apiHolder as api,
  apis,
  MailTemplateApi,
  TemplateDetail,
  TemplateInfo,
  MailApi,
  WriteMailInitModelParams,
  SystemApi,
  ProductTagEnum,
  WaimaoRecommendTemplateTag,
  WaimaoRecommendTemplateOrder,
  WaimaoRecommendTemplateListReq,
  AccountApi,
} from 'api';
import Popconfirm from './popconfirm';
import Preview from './preview';
import './listmodal.scss';
import './listmodal_waimao.scss';
import NoWifi from '@/images/no-wifi.png';
import NoDoc from '@/images/empty/doc.png';
import { useActions, useAppSelector, MailTemplateActions } from '@web-common/state/createStore';
import { formatViewMail } from './util';
import { ViewMail } from '@web-common/state/state';
import { ReactComponent as DeleteIcon } from '@/images/icons/modal_close_temp.svg';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import WaimaoRecommendTemplateFilter from './waimao_recommend_template_filter';
import { getIn18Text } from 'api';
const templateApi = api.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const { TabPane } = Tabs;
interface Props {
  emitResult?: (data: ViewMail) => void; // 写信页模板点击”使用“的回调
  templateCategory?: string; // 业务划分，LX: 灵犀业务； EDM: 外贸业务
}
/** 邮件模板列表Modal */
export const TemplateListModalWaimao = (props: Props) => {
  const { emitResult, templateCategory = 'LX' } = props;
  const showTemplateList = useAppSelector(state => state.mailTemplateReducer.showTemplateList); // 是否展示”模板列表“弹窗
  const defaultActiveTab = useAppSelector(state => state.mailTemplateReducer.defaultActiveTab); // 默认展示tab
  const { changeShowTemplateList, changeShowAddTemplatePop, doWriteTemplate, doModifyTemplateName } = useActions(MailTemplateActions);
  const [templates, setTemplates] = useState<TemplateDetail[]>([]);
  const [tabActiveKey, setTabActiveKey] = useState<number>(3);
  const [apiSuccess, setApiSuccess] = useState<boolean>(true); // 接口是否请求成功
  const [isLoading, setIsLoading] = useState<boolean>(true); // 是否展示loading
  const inElectron = systemApi.isElectron();
  const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
  const timeLimitedTmp = [
    { templateId: '118376158952722521', templateName: getIn18Text('RIBAO/ZHOUBAO') },
    { templateId: '118376486322339889', templateName: getIn18Text('GONGZUOJINDUHUI') },
    { templateId: '118737047174283357', templateName: getIn18Text('HUIYIJIYAO\uFF08') },
    { templateId: '125706462616911918', templateName: getIn18Text('XIANGMUGUIHUA') },
    { templateId: '125706745904398355', templateName: getIn18Text('HUODONGCEHUAFANG') },
    { templateId: '125707310466109463', templateName: getIn18Text('SWOTFEN') },
    { templateId: '125707542893461556', templateName: getIn18Text('SHEJIXUQIU') },
    { templateId: '125708100782035009', templateName: getIn18Text('FEIYONGSHENPI') },
    { templateId: '125708348568932425', templateName: getIn18Text('GONGZUOJIAOJIE') },
    { templateId: '125708606527012904', templateName: getIn18Text('GONGZIBIAO') },
    { templateId: '125708807736168472', templateName: getIn18Text('BAOXIAODAN') },
    { templateId: '125709628926361609', templateName: getIn18Text('HEZUOYIXIANGSHU') },
  ];
  /**
   * 获取模板列表
   */
  const getTemplates = async () => {
    setIsLoading(true);
    setApiSuccess(true);
    setTabActiveKey(defaultActiveTab);
    // curAccount && accountApi.setCurrentAccount({ email: curAccount.mailEmail });
    await templateApi.doGetMailTemplateList({ templateCategory, supportNewTemplateType: 'ENTERPRISE' }, curAccount?.mailEmail).then(res => {
      res.data || (res.data = []);
      setTemplates(res.data);
      setApiSuccess(res.success);
      setIsLoading(false);
      if (defaultActiveTab) {
        // 如果有默认展示tab，设置默认展示tab（1:最近使用 2:个人模板  4:企业模板  3:推荐）默认展示不同的tab
        for (let i = 0; i < res.data.length; i++) {
          if (res.data[i].tabId === defaultActiveTab) {
            // 防止 defaultActiveTab 不存在接口返回的数据中
            setTabActiveKey(res.data[i].tabId);
            return;
          }
        }
      }
      for (let i = 0; i < res.data.length; i++) {
        if (res.data[i].templateList.length > 0) {
          setTabActiveKey(res.data[i].tabId);
          return;
        }
      }
      // 兜底的默认值
      setTabActiveKey(1);
    });
  };
  useEffect(() => {
    if (showTemplateList) {
      getTemplates();
    }
  }, [showTemplateList]);

  const [waimaoRecommendTags, setWaimaoRecommendTags] = useState<WaimaoRecommendTemplateTag[]>([]);

  const [waimaoRecommendOrders] = useState<WaimaoRecommendTemplateOrder[]>([
    { orderKey: 'sendCount', orderName: '发送数' },
    { orderKey: 'deliveryRate', orderName: '送达率' },
    { orderKey: 'openRate', orderName: '打开率' },
  ]);

  const defaultWaimaoRecommendParams: WaimaoRecommendTemplateListReq = {
    tag: undefined,
    order: '',
    templateCategory: 'LX-WAIMAO',
  };

  const [waimaoRecommendTemplates, setWaimaoRecommendTemplates] = useState<TemplateInfo[]>([]);

  const [waimaoRecommendParams, setWaimaoRecommendParams] = useState<WaimaoRecommendTemplateListReq>({
    ...defaultWaimaoRecommendParams,
  });

  const waimaoRecommendVisible = useMemo(() => showTemplateList && tabActiveKey === 3, [showTemplateList, tabActiveKey]);

  useEffect(() => {
    if (waimaoRecommendVisible) {
      const templateCategory = 'LX-WAIMAO';
      templateApi.getWaimaoRecommendTemplateTagList(templateCategory).then(res => {
        if (res.success) {
          const tags = (res.data && res.data.tags) || [];

          setWaimaoRecommendTags([{ tagId: undefined, tagName: '全部' }, ...tags]);
        } else {
          message.error({
            content: '获取推荐模板标签失败',
          });
        }
      });
    } else {
      setWaimaoRecommendParams({ ...defaultWaimaoRecommendParams });
      setWaimaoRecommendTemplates([]);
    }
  }, [waimaoRecommendVisible]);

  useEffect(() => {
    if (waimaoRecommendVisible) {
      templateApi.getWaimaoRecommendTemplateList(waimaoRecommendParams).then(res => {
        if (res.success) {
          if (res.data) {
            const recommendData = res.data.find(item => item.tabId === 3); // 推荐

            if (recommendData) {
              setWaimaoRecommendTemplates(recommendData.templateList || []);
            } else {
              setWaimaoRecommendTemplates([]);
            }
          }
        } else {
          message.error({
            content: '获取推荐模板列表失败',
          });
        }
      });
    }
  }, [waimaoRecommendVisible, waimaoRecommendParams]);

  // 新建模板
  const newTemplate = () => {
    changeShowTemplateList({ isShow: false });
    changeShowAddTemplatePop({ isShow: true, source: 'list' });
  };
  const operations = (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <p className="add-temp-btn" onClick={newTemplate}>
      <PlusOutlined style={{ marginRight: '6px' }} />
      {getIn18Text('XINJIANGERENMO')}
    </p>
  );
  const TabItem = (itemProps: { templateData: TemplateInfo }) => {
    const { templateData } = itemProps;
    const [showBtn, setShowBtn] = useState<boolean>(false);
    const [showDeletePop, setShowDeletePop] = useState<boolean>(false);
    // 删除模板
    const handleDelete = () => {
      setShowDeletePop(false);
      // curAccount && accountApi.setCurrentAccount({ email: curAccount.mailEmail });
      templateApi.doDeleteMailTemplate({ templateId: templateData.templateId }, curAccount?.mailEmail).then(res => {
        if (res.data === 'success') {
          message.success({
            content: getIn18Text('SHANCHUCHENGGONG'),
          });
          const tabId = tabActiveKey;
          getTemplates().then(() => {
            setTabActiveKey(tabId);
          });
        } else {
          message.error({
            content: getIn18Text('SHANCHUSHIBAI'),
          });
        }
      });
    };
    // 再次编辑
    const editTemplate = () => {
      // curAccount && accountApi.setCurrentAccount({ email: curAccount.mailEmail });
      templateApi.doGetMailTemplateDetail({ templateId: templateData.templateId }, curAccount?.mailEmail).then(async res => {
        if (res.success && res.data) {
          const viewMail = await formatViewMail(res.data);
          changeShowTemplateList({ isShow: false }); // 需要先关闭TemplateList，再打开AddTemplatePop，changeShowTemplateList会重置source
          changeShowAddTemplatePop({ isShow: true, source: 'list' });
          doWriteTemplate(viewMail);
          doModifyTemplateName(res.data.templateName);
        }
      });
    };
    // 使用模板
    const useMailTemplate = () => {
      // curAccount && accountApi.setCurrentAccount({ email: curAccount.mailEmail });
      // 上报模板使用
      templateApi.doSaveMailTemplateUseTime({ templateId: templateData.templateId, time: new Date().getTime() }, curAccount?.mailEmail);
      // curAccount && accountApi.setCurrentAccount({ email: curAccount.mailEmail });
      // 获取模板详情，唤起写信
      templateApi.doGetMailTemplateDetail({ templateId: templateData.templateId }, curAccount?.mailEmail).then(async res => {
        if (res.success && res.data) {
          const viewMail = await formatViewMail(res.data);
          viewMail.form = 'template';
          if (emitResult) {
            emitResult(viewMail);
          } else {
            const params: WriteMailInitModelParams = {
              contact: [],
              writeType: 'common',
              mailType: 'common',
              result: viewMail,
            };
            inElectron || changeShowTemplateList({ isShow: false });
            mailApi.callWriteLetterFunc(params);
          }
        }
      });
    };
    const menu = (
      <Menu>
        <Menu.Item onClick={editTemplate}>{getIn18Text('BIANJI')}</Menu.Item>
        <Menu.Item>
          {/* eslint-disable-next-line max-len */}
          <Popover
            placement="right"
            content={<Popconfirm setShowDeletePop={setShowDeletePop} handleDelete={handleDelete} />}
            trigger="click"
            visible={showDeletePop}
            onVisibleChange={visible => {
              setShowDeletePop(visible);
            }}
          >
            {getIn18Text('SHANCHU')}
          </Popover>
        </Menu.Item>
      </Menu>
    );
    return (
      <div
        className="tab-item"
        onMouseEnter={() => {
          setShowBtn(true);
        }}
        onMouseLeave={() => {
          setShowBtn(false);
        }}
      >
        {/* <div className="tab-item-tag tab-item-tag-send">送达率高</div> */}
        {/* <div className="tab-item-tag tab-item-tag-open">打开率高</div> */}
        {timeLimitedTmp.some(item => item.templateId === templateData.templateId) ? (
          <ProductAuthTag tagName={ProductTagEnum.EMAIL_TEMPLATE} flowTipStyle={{ left: '87px', top: '-7px', borderRadius: '0px 8px 0px 8px' }}>
            <div className="tab-body-content" style={{ backgroundImage: `url(${templateData.thumbnail.url})` }} />
          </ProductAuthTag>
        ) : (
          <div className="tab-body-content" style={{ backgroundImage: `url(${templateData.thumbnail.url})` }} />
        )}
        {/* <div className="tab-body-content" style={{ backgroundImage: `url(${templateData.thumbnail.url})` }} /> */}
        <div className="tab-body-btn" hidden={showBtn}>
          <p className="tab-body-title">{templateData.templateName}</p>
        </div>
        <div className="tab-body-btn" hidden={!showBtn}>
          <Dropdown overlay={menu} placement="topLeft">
            <p className="tab-body-btn-grey" hidden={templateData.templateType !== 'PERSONAL'}>
              <MoreOutlined twoToneColor="#FFFFFF" rotate={90} />
            </p>
          </Dropdown>
          <Popover placement="right" content={<Preview templateId={templateData.templateId} />} trigger="click">
            <p className="tab-body-btn-grey">{getIn18Text('YULAN')}</p>
          </Popover>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <p className="tab-body-btn-primary" onClick={useMailTemplate}>
            {getIn18Text('SHIYONG')}
          </p>
        </div>
      </div>
    );
  };

  const WaimaoRecommendTemplates = () => (
    <>
      <WaimaoRecommendTemplateFilter
        tags={waimaoRecommendTags}
        tagId={waimaoRecommendParams.tag}
        orders={waimaoRecommendOrders}
        orderKey={waimaoRecommendParams.order}
        onTagChange={tagId => setWaimaoRecommendParams({ ...waimaoRecommendParams, tag: tagId })}
        onOrderChange={orderKey => setWaimaoRecommendParams({ ...waimaoRecommendParams, order: orderKey })}
      />
      {waimaoRecommendTemplates.map(item => (
        <TabItem key={item.templateId} templateData={item} />
      ))}
      {!waimaoRecommendTemplates.length && (
        <div className="tab-nodoc" style={{ width: '100%' }}>
          <img style={{ width: 160, margin: '12px auto' }} src={NoDoc} alt="noDoc" />
          <p className="nodoc-txt" style={{ marginTop: 0 }}>
            暂无推荐模板
          </p>
        </div>
      )}
    </>
  );

  const TabBody = (tabBodyprops: { onTabTemplate: TemplateDetail }) => {
    const { onTabTemplate } = tabBodyprops;
    const haveList = onTabTemplate?.templateList.length > 0;
    return (
      <div className="tab-body-box">
        <p className="tab-body-topDesc" hidden={onTabTemplate.tabId !== 4}>
          {getIn18Text('QIYEMOBANYOU')}
          <a href="https://mailhz.qiye.163.com" target="_blank" rel="noreferrer">
            https://mailhz.qiye.163.com
          </a>
          {getIn18Text('QIYEWENHUA')}
        </p>
        <div className="tab-body">
          {waimaoRecommendVisible ? (
            <WaimaoRecommendTemplates />
          ) : haveList ? (
            <>
              {onTabTemplate?.templateList?.map(_ => (
                <TabItem key={_.templateId} templateData={_} />
              ))}
              <p className="tab-body-tailDesc">{onTabTemplate?.tailDesc}</p>
            </>
          ) : (
            <div className="tab-nodoc">
              <img style={{ width: 160, height: 160, margin: '60px auto 0' }} src={NoDoc} alt="noDoc" />
              {/* 1:最近使用 2: 个人模板 4 企业模板 */}
              <p hidden={onTabTemplate.tabId !== 1} className="nodoc-txt">
                最近6个月内没有使用过模板，快去
                <span className="add-temp-btn" onClick={newTemplate}>
                  新建个人模板
                </span>
                试试吧～
              </p>
              <p hidden={onTabTemplate.tabId !== 2} className="nodoc-txt">
                你还没有自定义过模板，快去
                <span className="add-temp-btn" onClick={newTemplate}>
                  新建个人模板
                </span>
                试试吧～
              </p>
              <p hidden={onTabTemplate.tabId !== 4} className="nodoc-txt">
                暂无企业模板，可联系本企业管理员统一添加
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };
  const tabTag = (tab: TemplateDetail) => {
    if (tab.tabId === 3) {
      // 推荐
      return <ProductAuthTag tagName={ProductTagEnum.EMAIL_TEMPLATE}>{tab.tab}</ProductAuthTag>;
    }
    return tab.tab;
  };
  return (
    // eslint-disable-next-line max-len
    <Modal
      closeIcon={<DeleteIcon />}
      visible={showTemplateList}
      footer={null}
      title={getIn18Text('YOUJIANMOBAN')}
      width="726px"
      className="mail-template-list-modal mail-template-list-modal-waimao"
      onCancel={() => changeShowTemplateList({ isShow: false })}
    >
      {/* eslint-disable-next-line max-len */}
      <Tabs
        tabBarExtraContent={operations}
        activeKey={tabActiveKey.toString()}
        onChange={_tabActiveKey => {
          setTabActiveKey(parseInt(_tabActiveKey, 10));
        }}
        hidden={templates.length <= 0}
      >
        {templates.map(_ => (
          <TabPane tab={tabTag(_)} key={_.tabId}>
            <TabBody onTabTemplate={_} />
          </TabPane>
        ))}
      </Tabs>
      <div className="loading-box" hidden={apiSuccess}>
        <img style={{ width: 160, height: 160, marginBottom: 8 }} src={NoWifi} alt="noWifi" />
        <p style={{ fontSize: 14, color: '#7D8085', marginBottom: 8 }}>{getIn18Text('WANGLUBUKEYONG')}</p>
        <Button style={{ width: 72, background: '#F4F4F5' }} onClick={getTemplates}>
          {getIn18Text('SHUAXIN')}
        </Button>
      </div>
      <div className="loading-box" hidden={!isLoading}>
        <LoadingOutlined />
      </div>
    </Modal>
  );
};
