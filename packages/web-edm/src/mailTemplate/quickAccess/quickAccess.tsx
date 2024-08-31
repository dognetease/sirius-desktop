import React, { FC, useState, useEffect, useRef } from 'react';
import style from './quickAccess.module.scss';
import MailAddProdSvg from '@/images/icons/mail/mail-template-add-prod.svg';
import { apiHolder, apis, MailTemplateApi, Thumbnail } from 'api';
import { Tooltip } from 'antd';
import { formatViewMail } from '@web-setting/Mail/components/CustomTemplate/util';
import { ViewMail } from '@web-common/state/state';
import { Image } from 'antd';
import AlertClose from '@/images/electron/about_close.svg';
import { edmDataTracker } from '../../tracker/tracker';
import { getIn18Text } from 'api';

const templateApi = apiHolder.api.requireLogicalApi(apis.mailTemplateImplApi) as unknown as MailTemplateApi;
const storeApi = apiHolder.api.getDataStoreApi();

const has_showed_quick_access_key = 'has_showed_quick_access_key';

export interface QuickAccessConfig {
  productList?: Production;
  templateList?: Template[];
}

export interface Production {
  productDesc?: string;
  productImage?: string;
  onClickInsertFunc?: () => void;
}

export interface Template {
  templateId?: string;
  templateName?: string;
  thumbnail?: Thumbnail;
  templateType?: string;
  usedCount?: number;
  deliveryRate?: string;
  openRate?: string;
  replyRate?: string;
}

export interface QuickAccessProp {
  insertProdInfoFunc?: () => void;
  templateDidClickFunc?: (t: ViewMail) => void;
  moreTemplateFunc?: () => void;
  closeDidClickFunc?: () => void;
}

export const QuickAccessProductionItem = (prop: Production) => {
  const { onClickInsertFunc } = prop;
  return (
    <div className={style.prod}>
      <Image preview={false} className={style.image} src={MailAddProdSvg} />
      <div
        className={style.button}
        onClick={() => {
          onClickInsertFunc && onClickInsertFunc();
        }}
      >
        {getIn18Text('CHARUSHANGPINXINXI')}
      </div>
    </div>
  );
};

export const QuickAccessTemplateItem = (prop: Template) => {
  const { templateName, thumbnail, replyRate } = prop;
  return (
    <div className={style.template}>
      <Tooltip title={templateName}>
        <div className={style.title}>{templateName}</div>
      </Tooltip>
      <Image preview={false} className={style.image} src={thumbnail && thumbnail.url} />
      {replyRate && <div className={style.desc}>{getIn18Text('HUIFULV') + replyRate}</div>}
    </div>
  );
};

export const QuickAccess: React.FC<QuickAccessProp> = Props => {
  const { insertProdInfoFunc, templateDidClickFunc, moreTemplateFunc, closeDidClickFunc } = Props;
  const [suggestInfo, setSuggestInfo] = useState<QuickAccessConfig | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const hasShowed = storeApi.getSync(has_showed_quick_access_key).data;

  useEffect(() => {
    fetchSuggest();
  }, []);

  const fetchSuggest = async () => {
    const suggest = (await templateApi.fetchSuggestTemplates()) as QuickAccessConfig;
    setSuggestInfo(suggest);
  };

  const inner_TemplateDidClickFunc = (item: Template) => {
    edmDataTracker.track('pc_markting_edm_writeMailPage_shortcut_area_click', {
      click_content: getIn18Text('TUWENMOBAN'),
    });
    templateApi.doGetMailTemplateDetail({ templateId: item.templateId || '' }).then(async res => {
      if (res.success && res.data && templateDidClickFunc) {
        const viewMail = await formatViewMail(res.data);
        templateDidClickFunc(viewMail);
        dismiss(false);
      }
    });
  };

  const dismiss = (withAnimation: boolean) => {
    if (withAnimation) {
      closeAnimation();
    }
    setTimeout(() => {
      closeDidClickFunc && closeDidClickFunc();
    }, 502);
  };

  const findActionNode = () => {
    const nodes = document.querySelectorAll('.tox-toolbar__group[role=toolbar]');
    if (nodes) {
      return Array.from(nodes).find(node => node.innerHTML.includes(getIn18Text('MOBAN')));
    }
  };

  // 关闭时动画, 只有有动画的消失, 才达到引导的作用. 下次不再展示
  const closeAnimation = () => {
    storeApi.putSync(has_showed_quick_access_key, 'true', { noneUserRelated: false });
    edmDataTracker.track('pc_markting_edm_writeMailPage_shortcut_area_click', {
      click_content: getIn18Text('CLOSE_TXT'),
    });
    const node = findActionNode();
    if (node != null && ref.current) {
      const { x: targetPositionX, y: targetPositionY, width: targetPositionW, height: targetPositionH } = node.getBoundingClientRect();
      const { x: currentPositionX, y: currentPositionY, width: currentPositionW, height: currentPositionH } = ref.current.getBoundingClientRect();
      const xDistance = targetPositionX + targetPositionW / 2 - (currentPositionX + ref.current.offsetWidth / 2);
      const yDistance = targetPositionY + targetPositionH / 2 - (currentPositionY + ref.current.offsetHeight / 2);
      ref.current.style.transform = `translateX(${xDistance}px) translateY(${yDistance}px) scale(${targetPositionW / currentPositionW}, ${
        targetPositionH / currentPositionH
      })`;
    }
  };

  if (hasShowed === 'true') {
    return null;
  }

  const inner_InsertProdFunc = () => {
    edmDataTracker.track('pc_markting_edm_writeMailPage_shortcut_area_click', {
      click_content: getIn18Text('CHANPINZHONGXIN'),
    });
    insertProdInfoFunc && insertProdInfoFunc();
  };

  const inner_MoreTemplateFunc = () => {
    edmDataTracker.track('pc_markting_edm_writeMailPage_shortcut_area_click', {
      click_content: getIn18Text('GENGDUOMOBAN'),
    });
    moreTemplateFunc && moreTemplateFunc();
  };

  edmDataTracker.track('pc_markting_edm_writeMailPage_shortcut_area_view');

  return suggestInfo ? (
    <div ref={ref} className={style.root} id="quick-access-root">
      <div className={style.header}>
        <div className={style.title}>{getIn18Text('KUAIJIESHIYONG')}</div>
        <Image className={style.close} src={AlertClose} preview={false} onClick={() => dismiss(true)} />
      </div>
      <div className={style.body}>
        <QuickAccessProductionItem onClickInsertFunc={() => inner_InsertProdFunc()}></QuickAccessProductionItem>
        <div className={style.templateArea}>
          {suggestInfo.templateList &&
            suggestInfo.templateList.length > 0 &&
            suggestInfo.templateList.map(item => {
              return (
                <div
                  onClick={() => {
                    inner_TemplateDidClickFunc(item);
                  }}
                >
                  <QuickAccessTemplateItem {...item}></QuickAccessTemplateItem>
                </div>
              );
            })}
          {
            <div className={style.moreTemplate} onClick={() => inner_MoreTemplateFunc()}>
              <div className={style.title}>{getIn18Text('GENG')}</div>
              <div className={style.title}>{getIn18Text('DUO')}</div>
              <div className={style.title}>{getIn18Text('MO')}</div>
              <div className={style.title}>{getIn18Text('BAN')}</div>
            </div>
          }
        </div>
      </div>
    </div>
  ) : null;
};
