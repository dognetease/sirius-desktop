import React, { useState, useEffect } from 'react';
import { Checkbox, Input, message } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import classnames from 'classnames';
import CopyToClipboard from 'react-copy-to-clipboard';
import { AICreateSeoConfig } from './AICreateSeoConfig';
import { SeoExample } from './SeoExample';
import SiriusModal from '@web-site/../../web-common/src/components/UI/Modal/SiriusModal';
import { navigate } from '@reach/router';
import { SEO_CONFIG_TYPE } from '../constants';
import { api, apis, apiHolder, SiteApi, SitePageSeoConfigItem, siteSeoConfigItem, DataTrackerApi, getIn18Text } from 'api';
import Breadcrumb from '@web-site/components/Breadcrumb';
import { ReactComponent as InputIcon } from '../../images/seo-config/input.svg';
import { ReactComponent as EarthDisabledIcon } from '../../images/seo-config/earth_disabled.svg';
import { ReactComponent as EarthActiveIcon } from '../../images/seo-config/earth_active.svg';
import styles from './index.module.scss';
import { goMySitePage } from '../utils';

const { TextArea } = Input;

const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface CommonProps {
  value: string;
  title: string;
  type: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, type: string) => void;
  onSubmit: (callback: React.Dispatch<React.SetStateAction<boolean>>) => void;
}

interface PageQueryString {
  siteId: string;
  pageId: string;
}
interface SeoConfigProps {
  qs: PageQueryString; // url 参数
}

const InputEdit: React.FC<CommonProps> = ({ value, type, title, placeholder, onChange, onSubmit }) => {
  const [isEdit, setIsEdit] = useState(false);
  const showKeywordMessage = isEdit && type === 'keyword';

  return (
    <>
      <div className={classnames(styles.configItem, { [styles.configItemEdit]: isEdit })}>
        <div className={styles.title}>{title}</div>
        {isEdit ? (
          <Input
            autoFocus
            placeholder={placeholder}
            onChange={e => onChange(e, type)}
            onBlur={() => onSubmit(setIsEdit)}
            value={value}
            onPressEnter={() => onSubmit(setIsEdit)}
            maxLength={500}
          />
        ) : (
          <div className={styles.text}>
            <p>
              {value || <span>{placeholder}</span>}
              <InputIcon onClick={() => setIsEdit(true)} />
            </p>
          </div>
        )}
      </div>
      {showKeywordMessage && <div className={styles.keywordMessage}>当输入多个关键词时，请用逗号隔开</div>}
    </>
  );
};

const TextAreaEdit: React.FC<CommonProps> = ({ value, title, type, placeholder, onChange, onSubmit }) => {
  const [isEdit, setIsEdit] = useState(false);

  // 初始化将光标和滚动条都移动到底部
  const setPosition = () => {
    let textarea = document.querySelector<HTMLTextAreaElement>('.seo-config-item-textarea');
    if (textarea?.setSelectionRange) {
      textarea?.setSelectionRange(-1, -1); // 设置选定区的开始和结束点
      textarea.scrollTop = textarea.scrollHeight;
    }
  };

  return (
    <div className={styles.configItem}>
      <div className={styles.title}>{title}</div>
      {isEdit ? (
        <TextArea
          className="seo-config-item-textarea"
          autoFocus
          placeholder={placeholder}
          onBlur={() => onSubmit(setIsEdit)}
          onFocus={setPosition}
          onChange={e => onChange(e, type)}
          onPressEnter={() => onSubmit(setIsEdit)}
          value={value}
          maxLength={1000}
        />
      ) : (
        <div className={`${styles.text} ${styles.textArea}`}>
          <p>
            {value || <span>{placeholder}</span>}
            <InputIcon
              onClick={() => {
                setIsEdit(true);
              }}
            />
          </p>
        </div>
      )}
    </div>
  );
};

const SeoConfig: React.FC<SeoConfigProps> = props => {
  const { siteId, pageId } = props.qs;
  const [aICreateSeoConfigVisible, setAICreateSeoConfigVisible] = useState(false);
  const [seoConfigList, setSeoConfigList] = useState<SitePageSeoConfigItem[]>([]);
  const [searchEngineConfigList, setSearchEngineConfigList] = useState<siteSeoConfigItem[]>([]);
  const [seoExampleVisible, setSeoExampleVisible] = useState(false);
  const homePageSeoConfig = seoConfigList[0] || {};
  const googleSearchEngineConfig = searchEngineConfigList[0] || {};
  const { title = '', keyword = '', description = '' } = homePageSeoConfig;
  const { pushed = false, sitemap = '' } = googleSearchEngineConfig;
  const seoIncludeMessage = pushed ? '站点已自动为您提交搜索引擎收录' : '站点已关闭搜索引擎收录功能';
  const earth = pushed ? <EarthActiveIcon /> : <EarthDisabledIcon />;
  const noIncludeClass = pushed ? '' : styles.noInclude;

  useEffect(() => {
    trackApi.track('site_seo_click');
    // 初始化获取seo config
    getSeoConfig();
  }, []);

  /*获取初始化SEO TKD值和SEO收录状态*/
  const getSeoConfig = async () => {
    try {
      const res = await siteApi.getSeoConfig({
        siteId,
      });

      let { sitePageSeoConfig, siteSeoConfig } = res;

      let seoConfigList = sitePageSeoConfig.map(({ keyword, title, description }) => {
        return { keyword, title, description };
      });

      let searchEngineConfigList = siteSeoConfig.map(({ pushed, sitemap }) => {
        return { pushed, sitemap };
      });

      setSeoConfigList(seoConfigList);
      setSearchEngineConfigList(searchEngineConfigList);
    } catch (e) {
      message.error('获取SEO配置失败 ！');
    }
  };

  /**
   * 更新seo收录状态
   * @param checked
   */
  const updateSiteSeoConfig = async (checked: boolean) => {
    try {
      await siteApi.updateSiteSeoConfig({
        siteId,
        type: '1',
        pushed: checked,
      });
      return true;
    } catch (e) {
      return false;
    }
  };

  /**
   * 更改seo 收录状态
   * @param e
   * @returns
   */
  const changeSeoStatus = async (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    if (!checked) {
      SiriusModal.confirm({
        title: '确定要关闭搜索引擎收录吗？',
        content: '关闭后搜索关键词将无法展示网站内容',
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          trackApi.track('site_seoinclude_click', { result: 'off' });
          const res = await updateSiteSeoConfig(checked);
          res && setSearchEngineConfigList([{ ...googleSearchEngineConfig, pushed: checked }]);
        },
      });
      return;
    }
    trackApi.track('site_seoinclude_click', { result: 'on' });
    const res = await updateSiteSeoConfig(checked);
    res && setSearchEngineConfigList([{ ...googleSearchEngineConfig, pushed: checked }]);
  };

  /**
   * 复制成功
   */
  const handleCopySuccess = () => {
    message.success('复制成功');
  };

  /**
   * 更新seo TKD
   * @param e
   * @param type
   */
  const handleChangeSeoConfig = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, type: string) => {
    const value = e.target.value;
    switch (type) {
      case SEO_CONFIG_TYPE.TITLE:
        {
          setSeoConfigList([{ ...homePageSeoConfig, title: value }]);
        }
        break;
      case SEO_CONFIG_TYPE.KEYWORD:
        {
          setSeoConfigList([{ ...homePageSeoConfig, keyword: value }]);
        }
        break;
      case SEO_CONFIG_TYPE.DESCRIPTION:
        {
          setSeoConfigList([{ ...homePageSeoConfig, description: value }]);
        }
        break;
      default:
        break;
    }
  };

  /**
   * 提交 seo TKD
   * @param setIsEdit
   */
  const handleSubmit = async (setIsEdit: React.Dispatch<React.SetStateAction<boolean>>) => {
    try {
      setIsEdit(false);
      await siteApi.updatePageSeoConfig({
        siteId,
        pageId,
        title,
        keyword,
        description,
      });
    } catch (e) {
      message.error('提交TKD失败 ！');
    }
  };

  const handleAISubmit = async (title: string, keyword: string, description: string) => {
    try {
      setSeoConfigList([{ title, keyword, description }]);
      await siteApi.updatePageSeoConfig({
        siteId,
        pageId,
        title,
        keyword,
        description,
      });
    } catch (e) {
      message.error('提交TKD失败 ！');
    }
  };

  // 展示AI智能生成弹窗
  const openAICreateSeoConfig = () => {
    setAICreateSeoConfigVisible(true);
  };

  // 关闭AI智能生成弹窗
  const closeAICreateSeoConfig = () => {
    setAICreateSeoConfigVisible(false);
  };

  // 打开事例
  const openSeoExample = () => {
    setSeoExampleVisible(true);
  };

  // 关闭事例
  const closeSeoExample = () => {
    setSeoExampleVisible(false);
  };

  return (
    <div className={styles.seoConfig}>
      <Breadcrumb>
        <Breadcrumb.Item onClick={goMySitePage}>{getIn18Text('WODEZHANDIAN')}</Breadcrumb.Item>
        <Breadcrumb.Item>SEO优化</Breadcrumb.Item>
      </Breadcrumb>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.siteMapTitle}>搜索引擎收录</div>
          <div className={styles.siteMap}>
            <Checkbox onChange={changeSeoStatus} checked={pushed}>
              允许搜索引擎捕捉页面信息
            </Checkbox>
            <div className={`${styles.message} ${noIncludeClass}`}>
              {earth}
              {seoIncludeMessage}
            </div>
            <Input.Group compact className={styles.siteMapUrl}>
              <Input disabled style={{ width: 'calc(100% - 30px)' }} value={sitemap} />
              <CopyToClipboard onCopy={handleCopySuccess} text={sitemap}>
                <div>复制</div>
              </CopyToClipboard>
            </Input.Group>
          </div>
          <div className={styles.seoHeader}>
            <div className={styles.seoHeaderTitle}>SEO配置</div>
            <div onClick={openAICreateSeoConfig}>AI智能生成</div>
          </div>
          <div className={styles.config}>
            <InputEdit value={title} placeholder="请输入标题" type="title" title="标题" onChange={handleChangeSeoConfig} onSubmit={handleSubmit} />
            <InputEdit value={keyword} type="keyword" placeholder="请输入关键词" title="关键词" onChange={handleChangeSeoConfig} onSubmit={handleSubmit} />
            <TextAreaEdit value={description} title="描述" placeholder="请输入描述内容" type="description" onChange={handleChangeSeoConfig} onSubmit={handleSubmit} />
          </div>
          <span className={styles.checkDemo} onClick={openSeoExample}>
            查看示例
          </span>
        </div>
      </div>
      <AICreateSeoConfig visible={aICreateSeoConfigVisible} onClose={closeAICreateSeoConfig} onSubmit={handleAISubmit} />
      <SeoExample visible={seoExampleVisible} onClose={closeSeoExample} />
    </div>
  );
};

export default SeoConfig;
