import React, { useState, useRef, useEffect } from 'react';
import { CardList } from '../components/CardList';
import { ChooseTemplate } from '../components/ChooseTemplate';
import { CreateMarket } from './components/CreateMarket';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { api, apis, SiteApi, apiHolder, DataTrackerApi, SystemApi, MarketPageItem } from 'api';
import { config } from 'env_def';
import { PAGE_TYPE, TemplateItem } from '../constants';
import MarketTable from './components/MarketTable';
import styles from './style.module.scss';
import { navigateToEditor } from './utils';
import { getTransText } from '@/components/util/translate';

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

type CreateMarketReq = {
  pageName: string;
  siteId: string;
  templateData: TemplateItem;
};

const DEFAULT_TEMPLATE_ID = 'default8fc78c0a82b72ea';

// 营销落地页
export const Market = () => {
  const currentChooseTemplateIdRef = useRef('');
  const parentRef = useRef({ chooseTemplate: (data: any) => {} });
  const isEditRef = useRef(false);
  const currentUpdatePage = useRef<MarketPageItem>({} as MarketPageItem);
  const [createMarketVisible, setCreateMarketVisible] = useState(false);
  const [chooseTemplateVisible, setChooseTemplateVisible] = useState(false);
  const [siteOptions, setSiteOptions] = useState([
    {
      value: DEFAULT_TEMPLATE_ID,
      label: '默认站点',
    },
  ]);

  const [marketData, setMarketData] = useState({
    pageName: '',
    templateData: { templateId: '', templateName: '' },
    siteId: '',
  });

  // 表格相关数据
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<Array<any>>([]);

  // 打开新建营销落地页弹窗
  const openCreateMarket = () => {
    // 清空数据
    isEditRef.current = false;
    setMarketData({
      pageName: '',
      templateData: { templateId: '', templateName: '' },
      siteId: marketData.siteId || DEFAULT_TEMPLATE_ID,
    });
    setCreateMarketVisible(true);
    trackApi.track('marketing_new_winshow'); // 新建弹窗出现
  };

  // 关闭新建营销落地页弹窗
  const closeCreateMarket = () => {
    setCreateMarketVisible(false);
    currentChooseTemplateIdRef.current = '';
  };

  const openChooseTemplate = () => {
    // 将装修状态设置为模板状态
    setChooseTemplateVisible(true);
  };

  const closeChooseTemplate = () => {
    setChooseTemplateVisible(false);
  };

  // 获取所属站点列表
  const getSiteList = async () => {
    try {
      const data = (await siteApi.getSiteList()) ?? [];
      if (data.length > 0) {
        setSiteOptions(data.map(site => ({ value: site.siteId, label: site.siteName })));
      }
      setMarketData({
        pageName: '',
        templateData: { templateId: '', templateName: '' },
        siteId: data.length > 0 ? data[0].siteId : DEFAULT_TEMPLATE_ID,
      });
    } catch (e) {
      Toast.error('获取所属站点列表数据失败');
    }
  };

  /**
   * 新建营销落地页选择模板
   * @param data
   */
  const handleCreateMarketChooseTemplate = (data: TemplateItem) => {
    parentRef.current.chooseTemplate(data);
    currentChooseTemplateIdRef.current = data.templateId;
    closeChooseTemplate();
  };

  /**
   * 新建或编辑营销落地页
   * @param {
   *  templateId 模板id
   *  marketName 营销落地页名称
   */
  const submitMarket = async ({
    templateData,
    pageName,
    siteId, // 所属站点
  }: CreateMarketReq) => {
    if (isEditRef.current) {
      // 编辑营销落地页
      try {
        const { id, pageId, code } = currentUpdatePage.current;
        await siteApi.updateMarket({ id, siteId, pageName, pageId, code, srcSiteId: currentUpdatePage.current.siteId });
        closeCreateMarket();
      } catch (e) {
        Toast.error({ content: '编辑营销落地页失败' });
      }
    } else {
      // 新建营销落地页
      try {
        const res = await siteApi.createMarket({ templateId: templateData.templateId, siteId, pageName });
        Toast.success({ content: '新建营销落地页成功' });
        closeCreateMarket();
        navigateToEditor(res.siteId, res.pageId);
        trackApi.track('marketing_new_winsucc'); // 新建成功（点击确定）
      } catch (e) {
        Toast.error({ content: '新建营销落地页失败' });
      }
    }
    getMarketList();
  };

  // 获取表格数据
  const getMarketList = async () => {
    setLoading(true);
    try {
      const list = await siteApi.getMarketList();
      setDataSource(list || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 获取站点列表
    getSiteList();
    // 获取落地页列表
    getMarketList();

    trackApi.track('marketing_click');
  }, []);

  return (
    <div className={styles.marketContainer}>
      <header className={styles.header}>
        <div className={styles.title}>{getTransText('YINGXIAOLUODIYE')}</div>
        {dataSource.length > 0 && (
          <div className={styles.addMarket} onClick={openCreateMarket}>
            {getTransText('XINJIANLUODIYE')}
          </div>
        )}
      </header>
      <section className={styles.marketContent}>
        <div className={styles.contentLeft}>
          <MarketTable
            loading={loading}
            dataSource={dataSource}
            getMarketList={getMarketList}
            openCreateMarket={openCreateMarket}
            showUpdateModal={(data: MarketPageItem) => {
              isEditRef.current = true;
              currentUpdatePage.current = data;
              setMarketData({
                siteId: data.siteId,
                pageName: data.pageName,
                templateData: {
                  templateId: data.templateId,
                  templateName: data.templateName,
                },
              });
              setCreateMarketVisible(true);
            }}
          />
        </div>
        <div className={styles.contentRight}>
          <CardList pageType={PAGE_TYPE.MARKET} />
        </div>
      </section>
      {createMarketVisible && (
        <CreateMarket
          visible={createMarketVisible}
          onClose={closeCreateMarket}
          onOk={submitMarket}
          onChoose={openChooseTemplate}
          parentRef={parentRef}
          data={marketData}
          siteOptions={siteOptions}
          isEdit={isEditRef.current}
        />
      )}
      {chooseTemplateVisible && (
        <ChooseTemplate
          visible={chooseTemplateVisible}
          onClose={closeChooseTemplate}
          onOk={() => {}}
          showChoose={createMarketVisible}
          currentChooseTemplateId={currentChooseTemplateIdRef.current}
          onChoose={handleCreateMarketChooseTemplate}
          pageType={PAGE_TYPE.MARKET}
        />
      )}
    </div>
  );
};
