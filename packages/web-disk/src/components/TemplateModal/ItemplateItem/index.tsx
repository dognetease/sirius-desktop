/*
 * @Author: wangzhijie02
 * @Date: 2021-11-24 15:23:36
 * @LastEditTime: 2022-06-29 11:53:37
 * @LastEditors: wangzhijie02
 * @Description: 模板库单个模板组件
 */
import React from 'react';
import { Button } from 'antd';
import cn from 'classnames';
import DocSvg from '@web-common/components/UI/Icons/svgs/disk/docSvg';
import ExcelSvg from '@web-common/components/UI/Icons/svgs/disk/excelSvg';
import MultableSvg from '@web-common/components/UI/Icons/svgs/disk/MultableSvg';
import { TemplateKind } from '../definition';
import { Template } from 'api';
import styles from './index.module.scss';
import { getIn18Text } from 'api';
interface TemplateItemPropsComnetd {
  kind: TemplateKind.Recommend;
  withMask?: boolean;
  onOk: () => void;
}
interface TemplateItemPropsMy {
  kind: TemplateKind.My;
  onOk: () => void;
  onDelete: () => void;
  withMask?: boolean;
}
type TemplateItemProps = TemplateItemPropsMy | TemplateItemPropsComnetd;
export const TemplateItem = (props: Template & TemplateItemProps) => {
  const docTypeClass = props.docType === 'doc' ? styles.doc : props.docType === 'unitable' ? styles.unitable : '';
  return (
    <div className={cn(styles.templateItemWrap, docTypeClass, 'tp-tmplate-item', props.withMask ? styles.mask : '')}>
      <div>
        <img src={props.previewImageUrl} />
        <div className={styles.oprationBox}>
          {/* 我的模板 可以删除 (推荐模板不可以删除)*/}
          {props.kind === TemplateKind.My ? (
            <Button type="default" className={styles.delete} onClick={props.onDelete}>
              {getIn18Text('SHANCHU')}
            </Button>
          ) : null}

          <Button type="primary" className={styles.btn} onClick={props.onOk}>
            {getIn18Text('SHIYONG')}
          </Button>
        </div>
        <p>
          {props.docType === 'excel' ? <ExcelSvg /> : null}
          {props.docType === 'doc' ? <DocSvg /> : null}
          {props.docType === 'unitable' ? <MultableSvg /> : null}
          <span className={styles.title}>{props.title}</span>
        </p>
      </div>
    </div>
  );
};
