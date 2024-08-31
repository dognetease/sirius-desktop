import React, { FC } from 'react';
import classnames from 'classnames';
import { GetTemplateTopRes } from 'api';
import ImgPreview from '@web-common/components/UI/ImagePreview';
import { Popover } from 'antd';
import Button from '@web-common/components/UI/Button';
import UnionIcon from '@/images/icons/edm/union-icon.svg';

import { OverflowShowTooltips } from '../../components/OverflowShowTooltips';
import styles from './MailTemplateListV2.module.scss';
import { ListType, Action } from './MailTemplateListV2';
import { edmDataTracker } from '../../tracker/tracker';

export const PersonalCard: FC<{
  templateInfo: GetTemplateTopRes[number]['templateList'][number];
  cardOp: Action;
  isFormWrite?: boolean;
  tagInfo?: string;
  isFromModal?: boolean;
}> = ({ templateInfo, cardOp, isFormWrite, tagInfo, isFromModal }) => {
  const handleImgPreview = (url: string) => {
    edmDataTracker.track('pc_markting_edm_taskCreate_contentSet', {
      type: 'preview',
    });
    ImgPreview.preview({
      data: [
        {
          previewUrl: url,
          downloadUrl: url,
          name: '',
        },
      ],
      startIndex: 0,
    });
  };

  const opPopover = (templateType: string, tabId?: number) => {
    if (templateType === 'PERSONAL' || tabId === 2) {
      return (
        <Popover
          title={null}
          trigger="click"
          getPopupContainer={node => node}
          placement="topLeft"
          content={
            <>
              <div className={styles.popoverContent}>
                <div className={classnames(styles.popoverBtn)} onClick={() => cardOp('edit', templateInfo.templateId)}>
                  编辑
                </div>
                <div className={classnames(styles.popoverBtn)} onClick={() => cardOp('delete', templateInfo.templateId)}>
                  删除
                </div>
              </div>
            </>
          }
        >
          <div className={styles.popoverWrap}>
            <img src={UnionIcon} alt="" />
          </div>
        </Popover>
      );
    }
    if (templateType === 'COMMON' || tabId === 3) {
      return (
        <Popover
          title={null}
          trigger="click"
          getPopupContainer={node => node}
          placement="topLeft"
          content={
            <>
              <div className={styles.popoverContent}>
                <div className={classnames(styles.popoverBtn)} onClick={() => cardOp('saveTemplate', templateInfo.templateId)}>
                  保存为个人模板
                </div>
              </div>
            </>
          }
        >
          <div className={styles.popoverWrap}>
            <img src={UnionIcon} alt="" />
          </div>
        </Popover>
      );
    }
    return null;
  };

  const renderTag = () => {
    if (templateInfo.templateType === 'COMMON') {
      if (tagInfo) {
        return <div className={classnames(styles.tag, styles.ellipsis)}>{tagInfo}</div>;
      }
      if (templateInfo.tagList != null && templateInfo.tagList.length > 0) {
        return <div className={classnames(styles.tag, styles.ellipsis)}>{templateInfo.tagList[0].tagName}</div>;
      }
    }
    return null;
  };

  return (
    <div className={classnames(styles.taskItem)}>
      <div className={classnames(styles.taskCard, isFormWrite ? styles.taskCardMin : '', styles.recommendCard)}>
        {/* 只有推荐有分组信息 */}
        {renderTag()}
        <div className={classnames(styles.taskCardTitle, styles.ellipsis)}>{templateInfo.templateName}</div>
        {/* 点击预览图直接查看模板 */}
        <div className={classnames(styles.taskCardImg, styles.taskCardImg1)} onClick={() => cardOp('display', templateInfo.templateId)}>
          {templateInfo.templateContentType === 1 && templateInfo.templateDesc && (
            <div className={styles.imgInfo}>
              <OverflowShowTooltips className={styles.infoText} value={templateInfo.templateDesc} />
              {/* <div className={styles.infoText}>
                该模板主要为圣诞节营销模板，您可以通过使用该模板向用户发布折扣和维护营销关系该模板主要为圣诞节营销模板，您可以通过使用该模板向护营销关系向用户发布折吧您可以通过使用该模板向护营销关系向用户发布折吧您可以通过使用该模板向护营销关系向用户发布折吧
              </div> */}
            </div>
          )}
          <img src={templateInfo.thumbnail.newUrl || templateInfo.thumbnail.url} alt="" />
        </div>
        <div className={styles.labels}>
          {templateInfo.openRate != null && <div className={styles.labelItem}>打开率: {templateInfo.openRate}</div>}
          {templateInfo.replyRate != null && <div className={styles.labelItem}>回复率: {templateInfo.replyRate}</div>}
        </div>
        <div className={classnames(styles.cardOp, isFormWrite ? styles.cardOpMin : '', isFromModal ? styles.cardOpSingle : '')}>
          {!isFromModal && opPopover(templateInfo.templateType, templateInfo.tabId)}
          {isFromModal ? (
            <Button
              className={classnames(styles.templateBtn, styles.templateBtn2)}
              style={{
                width: 74,
                height: 28,
              }}
              // type="primary"
              btnType="primary"
              onClick={() => cardOp('useAsRecommend', templateInfo.templateId)}
            >
              使用
            </Button>
          ) : (
            <>
              <Button
                className={styles.templateBtn}
                style={{
                  width: 74,
                  height: 28,
                }}
                onClick={() => cardOp('display', templateInfo.templateId)}
                btnType="minorLine"
              >
                查看
              </Button>
              <Button
                className={styles.templateBtn}
                style={{
                  width: 74,
                  height: 28,
                }}
                // type="primary"
                btnType="primary"
                onClick={() => cardOp('use', templateInfo.templateId)}
              >
                使用
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
