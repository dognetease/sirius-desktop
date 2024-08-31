/*
 * @Author: wangzhijie02
 * @Date: 2022-05-27 14:49:16
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-05-27 17:27:17
 * @Description: file content
 */
import { Select } from 'antd';
import React from 'react';

import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import OptionSelectedIcon from '@web-common/components/UI/Icons/svgs/disk/OptionsSelected';
import { ReactComponent as CloseIcon } from '@/images/icons/close_modal.svg';

// api
import { apiHolder, apis, NetStorageApi, ResponseGetTemplateList, Template } from 'api';

import { SvgIconTemplate } from '../SvgIcon';

import styles from './index.module.scss';
import { DOC_TYPES, DOC_VALUES, Template } from '../../definition';

const Options = Select.Option;

type RecommendTemplatesList = ResponseGetTemplateList['recommendTemplates'];

interface TemplateViewProps {}
interface TemplateViewState {
  insideVisible: boolean;
  docType: DOC_VALUES;
  myTemplates: Template[];
  recommendTemplates: RecommendTemplatesList;
  scene: TemplateModalSceneType;
}

export class TemplateView extends React.PureComponent<TemplateViewProps, TemplateViewState> {
  render() {
    return (
      <div className={styles.templateModelViewLayout}>
        <header>
          <div className={styles.headerContent}>
            <SvgIconTemplate />
            <span>模板库</span>
            <Select
              className={styles.select}
              bordered={false}
              value={state.docType}
              onSelect={this.onDocTypeSelect}
              size={'small'}
              suffixIcon={<DownTriangle />}
              menuItemSelectedIcon={<OptionSelectedIcon />}
            >
              {DOC_TYPES.map(item => {
                return (
                  <Options key={item.value} value={item.value}>
                    {item.label}
                  </Options>
                );
              })}
            </Select>
          </div>
        </header>
      </div>
    );
  }
}
