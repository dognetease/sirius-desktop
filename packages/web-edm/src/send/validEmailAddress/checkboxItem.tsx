import React, { useRef, useEffect } from 'react';
import lodashGet from 'lodash/get';
import classnames from 'classnames';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import Checkbox from '@lingxi-common-component/sirius-ui/Checkbox';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import { guardString } from '../../utils';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import { AllInvalidStatusCode, SuggestKeepIcon, MustDeleteIcon, HandleMethodsMap, getIdToValueData } from './util';
import style from './validEmailAddress.module.scss';
import { DisplayModel, DisplayModelOpenStatus, getIn18Text } from 'api';

export type CheckboxItemStatus = 'checkStatus' | 'openStatus';

export interface ChildChange {
  value: DisplayModelOpenStatus | boolean;
  model: DisplayModel;
  type: CheckboxItemStatus;
  openHeight?: number;
}

interface CheckboxItemProps {
  contactEmail: string;
  contactStatus: number;
  displayModel: DisplayModel;
  onChildChange: (data: ChildChange) => void;
  clearEmail: (contactEmail: string) => void;
}

const { idToLabelMap, idToPriorityMap, idToHandleMethodMap } = getIdToValueData();
const getV2Reason = (contactStatus?: number) => {
  let code = contactStatus || 0;
  return { code, useCode: code, value: idToLabelMap.get(code) || '', priority: +(idToPriorityMap.get(code) || 999) };
};
const getCheckReason = (verifyStatus?: number) => {
  let code = verifyStatus || 0;
  return { code, useCode: code + 100, value: idToLabelMap.get(code + 100) || '', priority: +(idToPriorityMap.get(code + 100) || 999) };
};

const CheckboxItem = (props: CheckboxItemProps) => {
  const { contactEmail, contactStatus, displayModel, onChildChange, clearEmail } = props;
  const mirrorRef = useRef<HTMLDivElement>();
  const realRef = useRef<HTMLDivElement>();
  // 状态是展开的，文案为收起
  const isSpreadStatus = displayModel.openStatus === 'close';
  // 需要展示展开收起的情况
  const isExceed = ['open', 'close'].includes(displayModel.openStatus || '');

  const v2Reason = displayModel.v2?.contactStatusList?.map(i => getV2Reason(i)).filter(i => guardString(i.value)) || [];
  const checkReason = displayModel.check?.verifyStatusList?.map(i => getCheckReason(i)).filter(i => guardString(i.value)) || [];
  const totalReasonList = [...v2Reason, ...checkReason].sort((prev, next) => prev.priority - next.priority);

  // displayModel.openStatus未赋值则是初始状态，需要计算openStatus后回填，否则不执行逻辑避免循环
  useEffect(() => {
    let timer: any = undefined;
    if (!displayModel.openStatus) {
      timer = setTimeout(() => {
        // mirrorRef用于获取真实的宽度，通过不换行渲染得出结果来决定是否展示展开按钮
        const realWidth = mirrorRef.current?.getBoundingClientRect().width || 0;
        if (realWidth > 428) {
          onChildChange({
            value: 'open',
            model: displayModel,
            type: 'openStatus',
          });
        } else {
          onChildChange({
            value: 'hide',
            model: displayModel,
            type: 'openStatus',
          });
        }
      }, 300);
    }
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleClick = () => {
    // realHeight用于获取真实的高度，通过换行渲染来决定虚拟列表项展开后的真实高度
    const realHeight = realRef.current?.getBoundingClientRect().height || 0;
    onChildChange({
      value: isSpreadStatus ? 'open' : 'close',
      model: displayModel,
      type: 'openStatus',
      openHeight: isSpreadStatus ? 44 : realHeight + 12,
    });
  };

  // icon类型
  const renderHandleIcon = () => {
    // 按照优先级取优先级最高的标签对应的icon展示，因为在优先级上直接清除 > 建议清除 > 建议保留
    // Tooltip只包含svg会失效
    const curStatus = lodashGet(totalReasonList, '0.useCode', contactStatus);
    if (AllInvalidStatusCode.includes(curStatus)) {
      if (curStatus === 105) {
        return (
          <Tooltip title={getIn18Text('JIANYIBAOLIU')}>
            <span className={style.handleIcon}>
              <SuggestKeepIcon />
            </span>
          </Tooltip>
        );
      }
      return (
        <Tooltip title={getIn18Text('ZHIJIEQINGCHU')}>
          <span className={style.handleIcon}>
            <MustDeleteIcon />
          </span>
        </Tooltip>
      );
    }
    const item = HandleMethodsMap[idToHandleMethodMap.get(curStatus) || (totalReasonList?.length > 0 ? 1 : 3)];
    // 无语：没问题的邮箱和有问题的邮箱contactStatus都有可能是0
    // 所以这里兜底逻辑保证没有错误标签的展示没问题的邮箱icon，有错误标签的展示有问题的邮箱icon
    return (
      <Tooltip title={item?.label}>
        <span className={style.handleIcon}>{item?.icon}</span>
      </Tooltip>
    );
  };

  return (
    <div className={style.childTable} key={contactEmail}>
      <div className={style.checkbox}>
        <Checkbox
          key={contactEmail}
          checked={displayModel.checked}
          onChange={e => {
            // TODO: change的逻辑跟父集的联动
            onChildChange({
              value: e.target.checked,
              model: displayModel,
              type: 'checkStatus',
            });
          }}
          className={style.childCheck}
          value={contactEmail}
        />
      </div>
      <div className={style.contact}>
        {renderHandleIcon()}
        &nbsp;
        <EllipsisTooltip>{contactEmail}</EllipsisTooltip>
      </div>
      <div className={classnames(style.dropdown, isSpreadStatus ? style.dropdownOpen : {})}>
        <div className={style.dropdownMirror} ref={mirrorRef}>
          {totalReasonList.map(i => {
            return <span className={style.dropdownTag}>{i.value}</span>;
          })}
        </div>
        <div className={classnames(style.dropdownContent, isExceed ? style.dropdownContentWidth : {})} ref={realRef}>
          {totalReasonList.map(i => {
            const iType = idToHandleMethodMap.get(i.useCode) || 1;
            return <span className={classnames(style.dropdownTag, iType === 1 ? style.dropdownTagRed : {})}>{i.value}</span>;
          })}
        </div>
        {isExceed ? (
          <span className={style.fold} onClick={handleClick}>
            {displayModel.openStatus === 'open' ? '展开' : '收起'}
          </span>
        ) : (
          <></>
        )}
      </div>
      <div className={style.remarks} onClick={() => clearEmail(contactEmail)}>
        清除
      </div>
      {/* <div className={style.remark}>{renderHandleMethod(contactStatus)}</div> */}
    </div>
  );
};

export default CheckboxItem;
