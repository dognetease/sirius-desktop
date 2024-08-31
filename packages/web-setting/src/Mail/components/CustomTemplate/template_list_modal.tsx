import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Menu, Dropdown, Popover, Button } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
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
  AccountApi,
  DataStoreApi,
} from 'api';
import { useActions, useAppSelector, MailTemplateActions } from '@web-common/state/createStore';
import { ViewMail } from '@web-common/state/state';
// import { setCurrentAccount } from '@web-mail/util';
import Popconfirm from './popconfirm';
import Preview from './preview';
import './listmodal.scss';
import previewStyle from './preview.module.scss';
import NoWifi from '@/images/no-wifi.png';
import NoDoc from '@/images/empty/doc.png';
import { formatViewMail } from './util';
import { ReactComponent as DeleteIcon } from '@/images/icons/modal_close_temp.svg';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import ProductAuthTag from '@web-common/components/UI/ProductAuthTag/ProductAuthTag';
import { getIn18Text } from 'api';

const templateApi = api.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const storeApi: DataStoreApi = api.api.getDataStoreApi();
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const { TabPane } = Tabs;
interface Props {
  emitResult?: (data: ViewMail) => void; // 写信页模板点击”使用“的回调
  templateCategory?: string; // 业务划分，LX: 灵犀业务； EDM: 外贸业务
  operateMail?: string; // 当前操作的账号
}
/** 邮件模板列表Modal */
export const TemplateListModal = (props: Props) => {
  const { emitResult, templateCategory = 'LX', operateMail = '' } = props;
  const showTemplateList = useAppSelector(state => state.mailTemplateReducer.showTemplateList); // 是否展示”模板列表“弹窗
  const defaultActiveTab = useAppSelector(state => state.mailTemplateReducer.defaultActiveTab); // 默认展示tab
  const { changeShowTemplateList, changeShowAddTemplatePop, doWriteTemplate, doModifyTemplateName } = useActions(MailTemplateActions);
  const curAccount = useAppSelector(state => state.mailReducer.currentMail?.optSender);
  const [templates, setTemplates] = useState<TemplateDetail[]>([]);
  const [tabActiveKey, setTabActiveKey] = useState<number>(3);
  const [apiSuccess, setApiSuccess] = useState<boolean>(true); // 接口是否请求成功
  const [isLoading, setIsLoading] = useState<boolean>(true); // 是否展示loading
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const notFirstTaskMail = storeApi.getSync('notFirstAccount').data; // 第一次绑定多账号后
  const inElectron = systemApi.isElectron();
  const modalRef = useRef(null);
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

  useEffect(() => {
    accountApi.doGetAllAccountList().then(res => {
      const account = res[0];
      if (account.length > 1 && !notFirstTaskMail) {
        setTooltipOpen(true);
        storeApi.put('notFirstAccount', 'true');
      }
    });
  }, []);

  /**
   * 获取模板列表
   */
  const getTemplates = async () => {
    setIsLoading(true);
    setApiSuccess(true);
    setTabActiveKey(defaultActiveTab);
    // setCurrentAccount(operateMail);
    // curAccount && accountApi.setCurrentAccount({ email: curAccount.mailEmail });
    const _account = curAccount ? curAccount.mailEmail : operateMail;
    await templateApi
      .doGetMailTemplateList({ templateCategory, supportNewTemplateType: 'ENTERPRISE' }, _account)
      .then(res => {
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
      })
      .catch(e => {
        setIsLoading(false);
        setTemplates([]);
      });
  };
  useEffect(() => {
    if (showTemplateList) {
      getTemplates();
    }
  }, [showTemplateList]);
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
      // setCurrentAccount(operateMail);
      // curAccount && accountApi.setCurrentAccount({ email: curAccount.mailEmail });
      const _account = curAccount ? curAccount.mailEmail : operateMail;
      templateApi.doDeleteMailTemplate({ templateId: templateData.templateId }, _account).then(res => {
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
      // setCurrentAccount(operateMail);
      // curAccount && accountApi.setCurrentAccount({ email: curAccount.mailEmail });
      const _account = curAccount ? curAccount.mailEmail : operateMail;
      templateApi.doGetMailTemplateDetail({ templateId: templateData.templateId }, _account).then(async res => {
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
      // 上报模板使用
      // setCurrentAccount(operateMail);
      // curAccount && accountApi.setCurrentAccount({ email: curAccount.mailEmail });
      const _account = curAccount ? curAccount.mailEmail : operateMail;
      templateApi.doSaveMailTemplateUseTime({ templateId: templateData.templateId, time: new Date().getTime() }, _account);
      // 获取模板详情，唤起写信
      // setCurrentAccount(operateMail);
      // curAccount && accountApi.setCurrentAccount({ email: curAccount.mailEmail });
      templateApi.doGetMailTemplateDetail({ templateId: templateData.templateId }, _account).then(async res => {
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
          {haveList ? (
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
                {getIn18Text('ZUIJIN6GEYUE')}
                <span className="add-temp-btn" onClick={newTemplate}>
                  {getIn18Text('XINJIANGERENMO')}
                </span>
                {getIn18Text('SHISHIBA\uFF5E')}
              </p>
              <p hidden={onTabTemplate.tabId !== 2} className="nodoc-txt">
                {getIn18Text('NIHAIMEIYOUZI')}
                <span className="add-temp-btn" onClick={newTemplate}>
                  {getIn18Text('XINJIANGERENMO')}
                </span>
                {getIn18Text('SHISHIBA\uFF5E')}
              </p>
              <p hidden={onTabTemplate.tabId !== 4} className="nodoc-txt">
                {getIn18Text('ZANWUQIYEMO')}
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

  const closeTip = () => {
    setTooltipOpen(false);
  };

  const title = (
    <div className={classnames(previewStyle.modalTitle)}>
      {getIn18Text('YOUJIANMOBAN')}
      <div className={classnames(previewStyle.toolTip)} hidden={!tooltipOpen}>
        绑定多个账号后，仅展示属于当前账号下的模板
        <span className={classnames(previewStyle.closeBtn)} onClick={closeTip}>
          {getIn18Text('ZHIDAOLE')}
        </span>
      </div>
    </div>
  );
  return (
    // eslint-disable-next-line max-len
    <Modal
      closeIcon={<DeleteIcon className="dark-invert" />}
      visible={showTemplateList}
      footer={null}
      title={title}
      width="716px"
      className="mail-template-list-modal"
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
        onClick={e => e.stopPropagation()} // 阻止事件冒泡到写信页，防止写信页刷新
      >
        {templates.map(_ => (
          <TabPane tab={tabTag(_)} key={_.tabId}>
            <TabBody onTabTemplate={_} />
          </TabPane>
        ))}
      </Tabs>
      <div className="loading-box extheme" hidden={apiSuccess}>
        <img style={{ width: 160, height: 160, marginBottom: 8 }} src={NoWifi} alt="noWifi" />
        <p style={{ fontSize: 14, color: '#7D8085', marginBottom: 8 }}>{getIn18Text('WANGLUBUKEYONG')}</p>
        <Button style={{ width: 72, background: '#F4F4F5' }} onClick={getTemplates}>
          {getIn18Text('SHUAXIN')}
        </Button>
      </div>
      <div className="loading-box extheme" hidden={!isLoading}>
        <LoadingOutlined />
      </div>
    </Modal>
  );
};
