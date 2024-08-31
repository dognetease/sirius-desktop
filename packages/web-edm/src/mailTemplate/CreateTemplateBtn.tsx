import React, { FC, useRef } from 'react';
import { getIn18Text, GetDiagnosisDetailRes, apiHolder, apis, EdmSendBoxApi, GetSummaryInfoRes } from 'api';
import { Popover } from 'antd';
import classnames from 'classnames';
import { getSendCount } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import { ReactComponent as ZhanKaiIcon } from '@web-common/images/newIcon/tongyong_zhankai_xia.svg';
import Button from '@web-common/components/UI/Button';
import { ReactComponent as ArrowIcon } from '@/images/icons/edm/arrow-icon.svg';
import { ReactComponent as TuPianIcon } from '@/images/icons/edm/tupian.svg';
import { ReactComponent as SelectItemIcon } from '@/images/icons/edm/select-item.svg';
import { ReactComponent as CaoGaoIcon } from '@/images/icons/edm/caogao.svg';

import { edmDataTracker } from '../tracker/tracker';
import { MarketingTemplateList, MarketingTemplateListRefType } from '../components/MarketingTemplateList';
import { setTemplateContent } from './template-util';

import styles from './mailTemplateV2.module.scss';
const systemApi = apiHolder.api.getSystemApi();
const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';

export const CreateTemplateBtn: FC<{
  addNewTemplate: (content?: string) => Promise<void>;
  goTemplateAdd: () => void;
  goRecommendPage: () => void;
  goTaskList: () => void;
}> = ({ addNewTemplate, goTemplateAdd, goRecommendPage, goTaskList }) => {
  const marketingTemplateListRef = useRef<MarketingTemplateListRefType | null>(null);

  let button = (
    <Button
      className={`${styles.searchBtn} ${styles.searchBtn1}`}
      style={{
        width: 140,
        height: 32,
        color: '#fff',
        padding: 0,
        marginLeft: 8,
      }}
      btnType="primary"
    >
      <span
        style={{
          marginRight: 8,
        }}
      >
        新建个人模板
      </span>
      <ZhanKaiIcon
        className={styles.arrowIcon}
        style={{
          flexShrink: 0,
        }}
      />
    </Button>
  );

  return (
    <>
      {/* 新建任务 */}
      <Button
        className={`${styles.searchBtn2}`}
        style={{
          width: 100,
          height: 32,
          padding: 0,
          marginLeft: 8,
        }}
      >
        <div
          className={styles.addTaskBtn}
          onClick={() => {
            edmDataTracker.templatePageOp('newTask', '');
            setTemplateContent('', '');
            getSendCount({
              emailList: [],
              from: 'template',
              back: encodeURIComponent(`${routerWord}?page=mailTemplate&version=v2`),
            });
          }}
        >
          新建任务
        </div>
        <div className={styles.splitLine}></div>
        <Popover
          // trigger="click"
          placement="bottomRight"
          getPopupContainer={node => node}
          className={classnames(styles.popoverWrapper, styles.popoverWrapper2)}
          // visible
          content={
            <div className={classnames(styles.addBtn, styles.addBtn2)}>
              <div
                className={styles.addBtnItem}
                onClick={() => {
                  edmDataTracker.templatePageOp('newList', '');
                  goTaskList();
                }}
              >
                <CaoGaoIcon />
                从任务列表选择
              </div>
            </div>
          }
        >
          <div className={styles.btnAction}>
            <ZhanKaiIcon
              className={styles.arrowIcon}
              style={{
                flexShrink: 0,
              }}
            />
          </div>
        </Popover>
      </Button>
      {/* 新建个人模板 */}
      <Popover
        getPopupContainer={node => node}
        className={styles.popoverWrapper}
        content={
          <div className={classnames(styles.addBtn, styles.addBtn2)}>
            <div
              className={styles.addBtnItem}
              onClick={() => {
                edmDataTracker.templatePageOp('newTemplate', '');
                goTemplateAdd();
              }}
            >
              <TuPianIcon />
              新建图文模版
            </div>
            <div
              className={styles.addBtnItem}
              onClick={() => {
                edmDataTracker.templatePageOp('newRecommend', '');
                goRecommendPage();
              }}
            >
              <SelectItemIcon />
              从推荐模版选择
            </div>
          </div>
        }
      >
        {button}
      </Popover>
      <MarketingTemplateList
        insertContent={(content, needSave, successLabel) => {}}
        afterModalClose={() => {}}
        addNewTemplate={addNewTemplate}
        fromPage={1}
        ref={marketingTemplateListRef}
      />
    </>
  );
};
