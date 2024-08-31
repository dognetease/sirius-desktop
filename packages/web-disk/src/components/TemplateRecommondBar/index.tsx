/*
 * @Author: wangzhijie02
 * @Date: 2022-05-26 18:51:52
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-06-27 19:58:46
 * @Description: file content
 */
import React from 'react';
import { apiHolder, apis, NetStorageApi, Template } from 'api';
import cn from 'classnames';
import { DOC_TYPE, TemplateKind } from '../TemplateModal/definition';
import { TemplateItem } from '../TemplateModal/ItemplateItem';
import { TemplateModal } from '../TemplateModal';
import { ReactComponent as IconClose } from './img/close.svg';
import moreTemplateImg from './img/more-template.png';
import styles from './index.module.scss';
import { DataTrackerTypes } from './../../dataTracker';
import { getIn18Text } from 'api';
type BlankFileTemplateUseTypes = DataTrackerTypes['blank_file_temple_use'];
interface TemplateRecommondBarProps {
  docType: DOC_TYPE;
  identity: string;
  onOk: (templateId: number, dataTrackParams: BlankFileTemplateUseTypes) => void;
}
interface TemplateRecommondBarState {
  hotTemplates: Template[];
  visible: boolean;
  templateModalVisible: boolean;
  viewMenuBarVisible: boolean;
}
const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
export class TemplateRecommondBar extends React.PureComponent<TemplateRecommondBarProps, TemplateRecommondBarState> {
  createDocLoading = false;
  constructor(props: TemplateRecommondBarProps) {
    super(props);
    this.state = {
      hotTemplates: [],
      visible: false,
      templateModalVisible: false,
      viewMenuBarVisible: true,
    };
  }
  componentDidMount() {
    this.getRecommondTemplates();
  }
  async show(viewMenuBarVisible: boolean) {
    if (this.state.hotTemplates.length === 0) {
      await this.getRecommondTemplates();
    }
    this.setState({
      visible: true,
      templateModalVisible: false,
      viewMenuBarVisible,
    });
  }
  hide = () => {
    this.setState({
      visible: false,
      templateModalVisible: false,
      viewMenuBarVisible: false,
    });
  };
  private async getRecommondTemplates() {
    const res = await diskApi.getDocTemplateList();
    // const res = await mockList.data;
    if (res) {
      /**
             * id: number,
                docType: DOC_TYPE,
                title: string,
                previewImageUrl: string
             */
      const hotTemplates = ((res as any).hotTemplates || []) as unknown as Template[];
      const list = hotTemplates.filter(item => item.docType === this.props.docType).slice(0, 4);
      this.setState({
        hotTemplates: list,
      });
    }
  }
  /**
   * 点击使用模版
   * @param template
   */
  private onOk = async (template: Template, dataTrackParams: DataTrackerTypes['blank_file_temple_use']) => {
    this.props.onOk(template.id, dataTrackParams);
  };
  private showTemplateModal = () => {
    this.setState({
      templateModalVisible: true,
    });
  };
  private hideTemplateModal = () => {
    this.setState({
      templateModalVisible: false,
    });
  };
  render() {
    if (!this.state.visible) {
      return null;
    }
    return (
      <>
        <div
          className={cn(styles.templateRecommondBarContainer, {
            [styles.smallModeLayout]: this.state.viewMenuBarVisible,
          })}
        >
          <div className={styles.listWrap}>
            {this.state.hotTemplates.map(template => {
              return (
                <TemplateItem
                  key={template.id}
                  withMask={true}
                  kind={TemplateKind.Recommend}
                  {...template}
                  docType={template.docType}
                  onOk={() => {
                    this.onOk(template, {
                      kind: 'Recommend',
                      title: template.title,
                      type: template.docType as unknown as BlankFileTemplateUseTypes['type'],
                      way: 'blank_page',
                    });
                  }}
                />
              );
            })}
            <div className={styles.moreTemplate} onClick={this.showTemplateModal}>
              <div>
                <img src={moreTemplateImg} alt="more" />
                <span>{getIn18Text('GENGDUOMOBANCHA')}</span>
              </div>
              {/* 关闭icon */}
              <span className={styles.close} onClick={this.hide}>
                <IconClose />
              </span>
            </div>
          </div>
        </div>

        <TemplateModal
          visible={this.state.templateModalVisible}
          curDirId={999}
          showEmptyTemplate={false}
          spaceKind="personal"
          onCancel={this.hideTemplateModal}
          onSelect={(template, kind) => {
            this.onOk(template, {
              kind,
              title: template.title,
              type: template.docType as unknown as BlankFileTemplateUseTypes['type'],
              way: 'more',
            });
          }}
          docType={this.props.docType}
          disableDocTypeSelect={true}
        />
      </>
    );
  }
}
