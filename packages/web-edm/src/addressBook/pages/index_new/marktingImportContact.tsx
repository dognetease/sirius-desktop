import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import style from './marktingGuide.module.scss';
import classnames from 'classnames/bind';
import { ReactComponent as LightIcon } from './images/lightIcon.svg';
import { navigate } from '@reach/router';
import { TableId, showUniDrawer, UniDrawerModuleId } from '@lxunit/app-l2c-crm';

const realStyle = classnames.bind(style);

export const MarktingAddContact: React.FC<{
  isDone: boolean;
  count: number;
}> = ({ isDone, count }) => {
  const [] = useState();

  // const { changeAiHostingInitObj } = useActions(AiWriteMailReducer);

  const gotoWM = () => {
    navigate('#wmData?page=globalSearch');
  };
  const gotoCRM = () => {
    // navigate('#/unitable-crm/lead/list?action=import');
    showUniDrawer({
      moduleId: UniDrawerModuleId.LeadsImport,
      moduleProps: {
        tableId: TableId.LeadsContact,
        closeHandler() {},
      },
    });
  };
  const gotoExtension = () => {
    navigate('#wmData?page=extension');
  };

  return (
    <div className={realStyle('marktingGuideWrapper')}>
      <p className={realStyle('tips', [isDone ? 'success' : 'unsuccess'])}>
        {/* <LightIcon /> */}
        {isDone
          ? `非常棒!已录入${count}个联系人，建议对联系人进行长期多轮营销，以获得更多有效回身`
          : '当前录入联系人较少，无法获得理想的营销效果，建议增加联系人数量，可以尝试以下方法'}
      </p>

      <div className={realStyle('guideList')}>
        <div className={realStyle('guideItem')}>
          在数据获客模块搜索更多目标客户，新建线索进行营销。建议至少录入10000个联系人进行营销
          <span className={realStyle('marktingAction')} onClick={gotoWM}>
            去查看
          </span>
        </div>
        <div className={realStyle('guideItem')}>
          上传文件导入已有联系人进入线索进行营销，可以导入老客户或历史营销过的联系人进行多轮营销，建议导入1000个联系人
          <span className={realStyle('marktingAction')} onClick={gotoCRM}>
            去导入
          </span>
        </div>
        <div className={realStyle('guideItem')}>
          使用插件，快速抓取网页上联系人信息，极大提升客户获取效率
          <span className={realStyle('marktingAction')} onClick={gotoExtension}>
            去使用
          </span>
        </div>
      </div>
    </div>
  );
};
