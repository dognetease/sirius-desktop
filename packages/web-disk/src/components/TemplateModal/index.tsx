/*
 * @Author: wangzhijie02
 * @Date: 2021-11-24 09:49:43
 * @LastEditTime: 2022-06-29 14:36:13
 * @LastEditors: wangzhijie02
 * @Description: 模版库组件
 */
import React from 'react';
// 组件
import { Modal, Select, ModalProps } from 'antd';
import throttle from 'lodash/throttle';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
// icon
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import OptionSelectedIcon from '@web-common/components/UI/Icons/svgs/disk/OptionsSelected';
//packages/web/src/images/icons/close_modal.svg
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';
import saveAsTemplateImg from './img/save-template-guide-v2.png';
import { apiHolder, apis, NetStorageApi, RequestNSFileCreateInfo, ResponseGetTemplateList, Template } from 'api';
// 样式
import styles from './index.module.scss';
import { TemplateItem } from './ItemplateItem';
import { DOC_TYPES, DOC_VALUES, TemplateCategoryEnum, templateCategorys, TemplateKind } from './definition';
import template from 'lodash/template';
import { createFile, createFileByTemplateId } from '../../helper/createDocByTemplate';
import { templateTrack, trackerCreateBaseCached, trackerTransitionCached } from '../MainPage/extra';
import { MenuItem } from './components/MenuItem';
import { Skeleton } from './components/Skeleton';
import { SvgIconTemplate, SvgIconProps } from './components/SvgIcon';
import { TemplatePlaceHolder } from './components/TemplatePlaceHolder';
import { unitableAvailable$ } from '../../commonHooks/useCheckCreateUnitableAvailable';
import { Subscription } from 'rxjs/internal/Subscription';
import { diskDataTrackerApi } from '../../dataTracker';
// import { mockList } from './template-list-mock';
import { getIn18Text } from 'api';
// 组件
const Options = Select.Option;
// api
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
type RecommendTemplatesList = ResponseGetTemplateList['recommendTemplates'];
export type TemplateModalSceneType = 'default' | 'tabs'; // 所处场景 - default 默认, tabs 多标签页
// 类型
interface TemplateModalState {
  pending: boolean;
  visibility: boolean;
  tabIndex: TemplateCategoryEnum;
  insideVisible: boolean;
  docType: DOC_VALUES;
  myTemplates: Template[];
  hotTemplates: Template[];
  recommendTemplates: RecommendTemplatesList;
  myTemplatesFinal: Template[];
  hotTemplatesFinal: Template[];
  recommendTemplatesFinal: RecommendTemplatesList;
  menuList: TemplateCategoryDes[];
  scene: TemplateModalSceneType;
  unitableAvailable: boolean;
}
type TemplateFilterType = Pick<TemplateModalState, 'hotTemplates' | 'myTemplates' | 'recommendTemplates'>;
type TemplateCategoryDes = {
  type: TemplateCategoryEnum;
  title: string;
  Icon: React.ComponentType<SvgIconProps>;
};
type Props = {
  curDirId: number;
  /**默认值为true */
  showEmptyTemplate?: boolean;
  /**
   * personal 个人空间
   * ent 企业空间
   */
  spaceKind: 'personal' | 'ent';
  /**默认全部 */
  docType?: DOC_VALUES;
  /**默认false */
  disableDocTypeSelect?: boolean;
  /**
   * 通过模板创建文件成功后 要执行的函数
   */
  onSuccess?: () => void;
  onSelect?: (template: Template, kind: TemplateKind) => void;
  scene?: TemplateModalSceneType;
};
function templatesFilter(templates: Template[], stateDocType: DOC_VALUES): Template[] {
  return templates.filter(temp => {
    return stateDocType === 'all' || stateDocType === temp.docType;
  });
}
function checkElFullVisible(boxEl: HTMLElement, curEl: HTMLElement) {
  const offset = 100; // 偏移量
  if (curEl.offsetTop - offset < boxEl.scrollTop && curEl.offsetTop + curEl.offsetHeight - offset > boxEl.scrollTop) {
    return true;
  } else {
    return false;
  }
}
/**
 * 模板库弹层组件
 */
export class TemplateModal extends React.PureComponent<ModalProps & Props, TemplateModalState> {
  /*文档创建接口 等待状态，防止重复点击使用按钮 */
  createDocLoading = false;
  scrollTimer: any = null;
  /**手动设置scrollTop 会触发scroll 事件，为了阻止这个行为使用此变量加锁 */
  scrollEventHandleLock = false;
  sectionReactRefMap = new Map<number, React.RefObject<HTMLHeadingElement>>();
  contentReactRef = React.createRef<HTMLDivElement>();
  subscription: Subscription;
  constructor(props: ModalProps & Props) {
    super(props);
    this.state = {
      pending: true,
      visibility: true,
      tabIndex: TemplateCategoryEnum.hot,
      insideVisible: true,
      docType: props.docType ?? DOC_TYPES[0].value,
      menuList: [],
      myTemplates: [],
      hotTemplates: [],
      recommendTemplates: [],
      myTemplatesFinal: [],
      hotTemplatesFinal: [],
      recommendTemplatesFinal: [],
      scene: props.scene || 'default',
      unitableAvailable: unitableAvailable$.getValue(),
    };
    this.sectionReactRefMap.set(TemplateCategoryEnum.own, React.createRef());
    this.sectionReactRefMap.set(TemplateCategoryEnum.hot, React.createRef());
    this.subscription = unitableAvailable$.subscribe(value =>
      this.setState({
        unitableAvailable: value,
      })
    );
  }
  static getDerivedStateFromProps(props: ModalProps & Props, state: TemplateModalState): TemplateModalState {
    if (props.visible) {
      return {
        ...state,
        insideVisible: true,
      };
    }
    return state;
  }
  componentDidMount() {
    this.getDocTemplatesList();
  }
  componentWillUnmount() {
    this.subscription.unsubscribe();
  }
  componentDidUpdate(prevProps: ModalProps & Props) {
    if (prevProps.visible === false && this.props.visible) {
      this.setState({
        tabIndex: TemplateCategoryEnum.hot,
        visibility: false,
        docType: this.props.docType ?? 'all',
      });
      this.getDocTemplatesList().then(() => {
        const tableIndex = this.state.tabIndex;
        this.locateContent(tableIndex, this.sectionReactRefMap.get(tableIndex));
        this.setState({
          visibility: true,
        });
      });
    }
  }
  getMenuList(templates: ResponseGetTemplateList['recommendTemplates']) {
    const list: TemplateCategoryDes[] = [templateCategorys.get(TemplateCategoryEnum.own)!, templateCategorys.get(TemplateCategoryEnum.hot)!];
    templates.forEach(item => {
      if (item.templates && item.templates.length) {
        const templateCategory = templateCategorys.get(item.categoryCode);
        if (templateCategory) {
          list.push(templateCategory);
        }
      }
    });
    return list;
  }
  async getDocTemplatesList() {
    const res = await diskApi.getDocTemplateList();
    // const res = await mockList.data;
    if (res) {
      res.recommendTemplates.forEach(element => {
        if (element.categoryCode && element.templates.length) {
          this.sectionReactRefMap.set(element.categoryCode, React.createRef<HTMLHeadingElement>());
        }
      });
      const myTemplates = res.myTemplates || [];
      const hotTemplates = res.hotTemplates || [];
      const recommendTemplates = res.recommendTemplates || [];
      const clearTemplateData = this.filterTemplate(this.state.docType, { myTemplates, hotTemplates, recommendTemplates });
      this.setState({
        myTemplates,
        hotTemplates,
        recommendTemplates,
        myTemplatesFinal: clearTemplateData.myTemplates,
        hotTemplatesFinal: clearTemplateData.hotTemplates,
        recommendTemplatesFinal: clearTemplateData.recommendTemplates,
        menuList: this.getMenuList(clearTemplateData.recommendTemplates || []),
        pending: false,
      });
    }
  }
  filterTemplate(docType: DOC_VALUES, data: TemplateFilterType): TemplateFilterType {
    // 我的模板（过滤之后的）
    const myTemplatesFilterad = templatesFilter(data.myTemplates, docType);
    const hotTemplatesFilterad = templatesFilter(data.hotTemplates, docType);
    // 推荐模板 （过滤之后的）
    const recommendTemplatesFilterad: RecommendTemplatesList = [];
    data.recommendTemplates.forEach(rec => {
      const templates = templatesFilter(rec.templates, docType);
      if (template.length) {
        recommendTemplatesFilterad.push({
          ...rec,
          templates,
        });
      }
    });
    return {
      myTemplates: myTemplatesFilterad,
      hotTemplates: hotTemplatesFilterad,
      recommendTemplates: recommendTemplatesFilterad,
    };
  }
  /**
   * 文档类型切换
   */
  onDocTypeSelect = (value: DOC_VALUES) => {
    const { myTemplates, hotTemplates, recommendTemplates } = this.state;
    const clearTemplateData = this.filterTemplate(value, { myTemplates, hotTemplates, recommendTemplates });
    this.setState({
      docType: value,
      myTemplatesFinal: clearTemplateData.myTemplates,
      hotTemplatesFinal: clearTemplateData.hotTemplates,
      recommendTemplatesFinal: clearTemplateData.recommendTemplates,
      menuList: this.getMenuList(clearTemplateData.recommendTemplates || []),
    });
  };
  /**
   * 删除单个文档
   * @param templateId
   */
  onDelete = async (templateId: number) => {
    const res = await diskApi.deleteTemplate({
      templateId,
    });
    if (res === true) {
      const templates = this.state.myTemplatesFinal.filter(item => {
        return item.id !== templateId;
      });
      this.setState({
        myTemplatesFinal: templates,
      });
    }
  };
  /**
   * 点击使用模版
   * @param template
   */
  async onOk(template: Template, kind: TemplateKind) {
    // 已存在文件 使用模板填充 走这个逻辑。
    if (typeof this.props.onSelect === 'function') {
      this.props.onSelect(template, kind);
      return;
    }
    // 防止重复点击
    if (this.createDocLoading) {
      return;
    }
    templateTrack({
      operaType: 'use',
      way: trackerTransitionCached.way!,
      title: template.title,
      type: template.docType as any,
      kind: kind,
    });
    this.createDocLoading = true;
    const result = await createFileByTemplateId(template, this.props.spaceKind, this.props.curDirId, this.state.scene);
    if (result) {
      this.props.onSuccess && this.props.onSuccess();
      // 必须在 onSuccess 后面。 修复了 http://jira.netease.com/browse/COSPREAD-4517
      this.setState({
        insideVisible: false,
      });
      templateTrack({
        operaType: 'create',
        way: trackerTransitionCached.way!,
        title: template.title,
        type: template.docType as any,
        kind: kind,
      });
    }
    this.createDocLoading = false;
  }
  /**
   *
   * 创建空白文件
   *
   */
  async onEmtyTemplateClick(docType: Exclude<DOC_VALUES, 'all'>) {
    if (this.createDocLoading) {
      return;
    }
    this.createDocLoading = true;
    const req: RequestNSFileCreateInfo = {
      type: this.props.spaceKind,
      dirId: this.props.curDirId,
      fileName: getIn18Text('WEIMINGMING'),
      fileType: docType,
    };
    const bool = await createFile(req, {
      way: 'List-new',
      docType: docType,
    });
    if (bool) {
      this.props.onSuccess && this.props.onSuccess();
      this.setState({
        insideVisible: false,
      });
      diskDataTrackerApi('creat_base', {
        creat_type: trackerCreateBaseCached.creat_type!,
        type: docType,
      });
      trackerCreateBaseCached.creat_type = undefined;
    }
    this.createDocLoading = false;
  }
  locateContent(tabIndex: TemplateCategoryEnum, ref: React.RefObject<HTMLHeadingElement> | undefined) {
    const contentEle = this.contentReactRef.current;
    const curEle = ref?.current;
    if (contentEle && curEle) {
      // 可视区域高度
      const contentWindowHeight = this.contentReactRef.current?.offsetHeight!;
      // 内容高度
      const contentScrollHeight = this.contentReactRef.current?.scrollHeight!;
      // 最大滚动高度
      const maxScrollTop = contentScrollHeight - contentWindowHeight;
      // 防止scroll event handle执行
      this.scrollEventHandleLock = true;
      setTimeout(() => (this.scrollEventHandleLock = false), 200);
      // 设置滚动距离
      contentEle.scrollTop = Math.min(curEle.offsetTop, maxScrollTop);
      this.setState({
        tabIndex: tabIndex,
      });
    }
  }
  onContentScroll = throttle(() => {
    // 防抖
    clearTimeout(this.scrollTimer);
    const contentEl = this.contentReactRef.current;
    if (contentEl && !this.scrollEventHandleLock) {
      this.scrollTimer = setTimeout(() => {
        this.state.menuList.some(item => {
          const titleEl = this.sectionReactRefMap.get(item.type)?.current;
          if (titleEl) {
            const bool = checkElFullVisible(contentEl, titleEl.parentElement!);
            if (bool) {
              this.setState({
                tabIndex: item.type,
              });
              return true;
            }
          }
          return false;
        });
      });
    }
  }, 100);
  render(): React.ReactNode {
    const state = this.state;
    const props = this.props;
    if (!state.insideVisible) {
      return null;
    }
    return (
      <SiriusHtmlModal
        destroyOnClose={true}
        visible={props.visible}
        onCancel={props.onCancel}
        wrapClassName={styles.modalWrapClassName}
        className={styles.templateModalLayout}
        closeIcon={<CloseIcon className="dark-invert" />}
        footer={false}
        title={
          <div className={styles.rowHeaderWrap}>
            <SvgIconTemplate />
            <div className={styles.title}>{getIn18Text('MOBANKU')}</div>
            <Select
              disabled={this.props.disableDocTypeSelect}
              className={styles.select}
              dropdownClassName={`ant-allow-dark ${styles.dropdown}`}
              bordered={false}
              value={state.docType}
              onSelect={this.onDocTypeSelect}
              size={'small'}
              suffixIcon={<DownTriangle className="dark-invert" />}
              menuItemSelectedIcon={<OptionSelectedIcon />}
            >
              {DOC_TYPES.map(item => {
                if (!state.unitableAvailable && item.value === 'unitable') return null;
                return (
                  <Options key={item.value} value={item.value}>
                    {item.label}
                  </Options>
                );
              })}
            </Select>
          </div>
        }
      >
        <div className={styles.layout}>
          <div className={styles.menu}>
            {this.state.pending ? (
              <>
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
              </>
            ) : (
              this.state.menuList.map((item, index) => {
                return (
                  <div key={item.title}>
                    <MenuItem
                      key={item.title}
                      Icon={item.Icon}
                      active={item.type === this.state.tabIndex}
                      title={item.title}
                      onClick={() => {
                        this.locateContent(item.type, this.sectionReactRefMap.get(item.type));
                      }}
                    />
                    {index === 0 ? <div className={styles.segement}></div> : null}
                  </div>
                );
              })
            )}
          </div>

          <div
            className={styles.content}
            onScroll={this.onContentScroll}
            ref={this.contentReactRef}
            style={{
              visibility: this.state.visibility ? 'visible' : 'hidden',
            }}
          >
            {/* 我的模板 */}
            <div>
              <h3 ref={this.sectionReactRefMap.get(TemplateCategoryEnum.own)!}>{getIn18Text('WODEMOBAN')}</h3>
              {/* 没有模板的缺省图 */}
              {!state.myTemplatesFinal.length ? (
                <div className={styles.saveAsTemplateImg}>
                  <img src={saveAsTemplateImg} alt="save-as-template" />
                  <p>{getIn18Text('ZAIBIAOGEYUNWEN')}</p>
                </div>
              ) : null}
              {/* 渲染模板list */}
              {state.myTemplatesFinal.length ? (
                <div className={styles.templateListWrap}>
                  {state.myTemplatesFinal.map(temp => {
                    return (
                      <div key={temp.id}>
                        <TemplateItem
                          key={temp.id}
                          {...temp}
                          kind={TemplateKind.My}
                          onDelete={() => {
                            this.onDelete(temp.id);
                          }}
                          onOk={() => {
                            this.onOk(temp, TemplateKind.My);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
            {/* 热门推荐 */}
            <div>
              <h3 ref={this.sectionReactRefMap.get(TemplateCategoryEnum.hot)!}>{getIn18Text('REMENTUIJIAN')}</h3>

              {/* 渲染模板list */}
              <div className={styles.templateListWrap}>
                {this.state.docType !== 'all' && this.props.showEmptyTemplate !== false ? (
                  <div
                    onClick={() => {
                      this.onEmtyTemplateClick(this.state.docType as unknown as Exclude<DOC_VALUES, 'all'>);
                    }}
                  >
                    <TemplatePlaceHolder docType={this.state.docType} />
                  </div>
                ) : null}

                {state.hotTemplatesFinal.map(temp => {
                  return (
                    <div key={temp.id}>
                      <TemplateItem
                        key={temp.id}
                        {...temp}
                        kind={TemplateKind.Recommend}
                        onOk={() => {
                          this.onOk(temp, TemplateKind.My);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            {state.recommendTemplatesFinal.map(rec => {
              const { templates } = rec;
              if (templates && templates.length) {
                return (
                  <div key={rec.categoryCode}>
                    <h3 ref={this.sectionReactRefMap.get(rec.categoryCode)}>{rec.categoryName}</h3>
                    <div className={styles.templateListWrap}>
                      {templates.map(temp => {
                        return (
                          <div key={temp.id}>
                            <TemplateItem
                              key={temp.id}
                              {...temp}
                              kind={TemplateKind.Recommend}
                              onOk={() => {
                                this.onOk(temp, TemplateKind.Recommend);
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return undefined;
            })}
          </div>
        </div>
      </SiriusHtmlModal>
    );
  }
}
