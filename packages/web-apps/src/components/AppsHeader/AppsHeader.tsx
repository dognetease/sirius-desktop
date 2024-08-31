/*
 * @Author: wangzhijie02
 * @Date: 2022-06-10 14:48:03
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-07-18 15:00:51
 * @Description: file content
 */
import React, { useContext } from 'react';
import { Button, Dropdown, Menu } from 'antd';
import cn from 'classnames';
import BreadComp from '@web-disk/components/BreadComp';
import { Bread } from '@web-disk/disk';
import { AppsContext, authHelper } from '../../context';
import { doReportInvite } from '../../api';
import { PageIds, appsPagesConf, getLocationBarVals, pageIdDict } from './../../pageMapConf';

import styles from './index.module.scss';
import { useDataTracker } from '../../hooks/useTracker';

interface AppsHeaderProps {
  locationList: Bread[];
  viewReportBtnVisable: boolean;
  templateEditBtnVisable: boolean;
  reportInviteBtnVisable: boolean;
  onViewReportClick: () => void;
  onTemplateEditClick: () => void;
  onReportInviteClick: () => void;
}

const AppsHeader: React.FC<AppsHeaderProps> = props => {
  const { setPageId } = useContext(AppsContext);
  // true 展示右侧按钮区域
  const rightAreaVisible = props.viewReportBtnVisable || props.templateEditBtnVisable || props.reportInviteBtnVisable;
  // true 有下拉菜单选项
  const dropdownVisible = props.templateEditBtnVisable || props.reportInviteBtnVisable;

  const menu = (
    <Menu className={styles.menu}>
      {props.templateEditBtnVisable ? (
        <Menu.Item key="modify" onClick={props.onTemplateEditClick}>
          修改模板
        </Menu.Item>
      ) : null}
      {props.reportInviteBtnVisable ? (
        <Menu.Item key="invite" onClick={props.onReportInviteClick}>
          邀请他人填写
        </Menu.Item>
      ) : null}
    </Menu>
  );
  return (
    <div className={styles.appHeader}>
      <BreadComp
        bread={props.locationList}
        ellipsisIndex={[3]}
        setCurrentDirId={(a, b) => {
          setPageId(a as unknown as PageIds);
        }}
      />
      {rightAreaVisible ? (
        <div className={styles.right}>
          {props.viewReportBtnVisable ? (
            <Button className={cn(styles.btnCommon, styles.btnViewAll)} onClick={props.onViewReportClick}>
              查看全部汇报
            </Button>
          ) : null}
          {dropdownVisible ? (
            <Dropdown overlay={menu} trigger={['click']} placement={'bottomRight'}>
              <Button className={cn(styles.btnCommon, styles.btnMore)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M5 8C5 8.55228 4.55228 9 4 9C3.44772 9 3 8.55228 3 8C3 7.44772 3.44772 7 4 7C4.55228 7 5 7.44772 5 8ZM9 8C9 8.55228 8.55228 9 8 9C7.44772 9 7 8.55228 7 8C7 7.44772 7.44772 7 8 7C8.55228 7 9 7.44772 9 8ZM12 9C12.5523 9 13 8.55228 13 8C13 7.44772 12.5523 7 12 7C11.4477 7 11 7.44772 11 8C11 8.55228 11.4477 9 12 9Z"
                    fill="#232D47"
                  />
                </svg>
              </Button>
            </Dropdown>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export const AppsHeaderContainer: React.FC<{
  pageId: PageIds;
}> = props => {
  const { setPageId, userAppInfo } = useContext(AppsContext);
  const pageConf = appsPagesConf[props.pageId];
  const trackerApi = useDataTracker();

  const currentAppUserBasicInfo = userAppInfo && pageConf.appId ? userAppInfo[pageConf.appId] : undefined;
  const locationList = getLocationBarVals(pageConf.locationList);
  const headerConf = pageConf.header;
  const reportType = headerConf?.reportType;
  const btnGroupVisable = !!headerConf?.btnGroupVisable;

  return (
    <>
      {locationList ? (
        <AppsHeader
          locationList={locationList ?? []}
          templateEditBtnVisable={btnGroupVisable && authHelper.hasEdit(currentAppUserBasicInfo)}
          viewReportBtnVisable={btnGroupVisable}
          reportInviteBtnVisable={btnGroupVisable}
          onViewReportClick={() => {
            if (reportType) {
              trackerApi.track('report_fillin_behavior', {
                opera_type: 'view_all',
                template_type: reportType,
              });
            }
            setPageId(reportType === 'daily' ? pageIdDict.appsDailyReportDetail : pageIdDict.appsWeeklyReportDetail);
          }}
          onTemplateEditClick={() => {
            if (reportType) {
              trackerApi.track('report_fillin_behavior', {
                opera_type: 'modify',
                template_type: reportType,
              });
              setPageId(reportType === 'daily' ? pageIdDict.appsDailyReportTemplateEdit : pageIdDict.appsWeeklyReportTemplateEdit);
            }
          }}
          onReportInviteClick={() => {
            if (reportType) {
              trackerApi.track('report_fillin_behavior', {
                opera_type: 'invite',
                template_type: reportType,
              });
              doReportInvite(reportType);
            }
          }}
        />
      ) : null}
    </>
  );
};
