import React, { useState, useEffect } from 'react';
import CustomerDrawer from '@/components/Layout/Customer/components/UI/Drawer/drawer';
import style from './filter.module.scss';
import CloseIcon from '@/images/icons/edm/edm-common-close.svg';
import ErrorIcon from '@/images/icons/edm/edm-blue-error.svg';
import { AbnormalTypeModel, FilterStrategy, FilterStrategySection } from '../../validEmailAddress/util';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import useLocalStorage from '@/hooks/useLocalStorage';

import cloneDeep from 'lodash/cloneDeep';
import { EdmSendBoxApi, FetchFilterConfigResp, FilterModel, apiHolder, apis, TaskChannel } from 'api';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import SiriusCheckbox from '@web-common/components/UI/Checkbox/siriusCheckbox';
import SiriusCheckbox from '@lingxi-common-component/sirius-ui/Checkbox';
import { edmDataTracker } from '../../../tracker/tracker';
import { guardString } from '../../../utils';
export interface Props {
  visible?: boolean;
  config?: FetchFilterConfigResp;

  onConfirm?: (config: FetchFilterConfigResp) => void;
  onCancel?: () => void;
}

const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;

export const Filter = (props: Props) => {
  const { visible, onCancel, onConfirm, config } = props;
  const channel = (new URLSearchParams(location.href).get('channel') as TaskChannel) || TaskChannel.normal;

  const [innerConfig, setInnerConfig] = useState<FetchFilterConfigResp>();
  const [kv, setKv] = useState<Record<string, FilterModel>>({});

  const [showNotify, setShowNotify] = useLocalStorage<boolean>('edm_filter_display_show_notify', true);

  const [refreshKey, setRefreshKey] = useState(false);
  const [data, setData] = useState<Array<FilterStrategySection>>(cloneDeep(FilterStrategy));
  function refresh() {
    setRefreshKey(!refreshKey);
  }

  const fetchConfig = async () => {
    const config = await edmApi.fetchFilterConfig();
    setInnerConfig(config);
  };

  useEffect(() => {
    if (config) {
      setInnerConfig(cloneDeep(config));
      return;
    }
    fetchConfig();
  }, [config]);

  useEffect(() => {
    if (!innerConfig) {
      return;
    }
    let tempKv = cloneDeep(kv);

    innerConfig?.checkConfigs?.forEach(item => {
      item.filterItems.forEach(i => {
        if (i.code) {
          tempKv[i.code] = i;
        }
      });
    });
    setKv(tempKv);

    let tempData = cloneDeep(data);
    tempData.forEach(item => {
      item.strategy?.forEach(i => {
        let modelI = tempKv[i.value];
        if (modelI) {
          i.checked = modelI.status === 0 ? false : true;
        }
      });
    });
    // 多账号 不显示同域过滤规则
    if (channel === TaskChannel.senderRotate) {
      tempData = tempData.map(item => {
        if (item.name === '无效地址') {
          item.strategy = item.strategy?.filter(i => i.id !== 105);
        }
        return item;
      });
    }
    setData(tempData);
  }, [innerConfig]);

  const setConfirm = () => {
    let tempKv: Record<string, AbnormalTypeModel> = {};
    data.forEach(item => {
      item.strategy?.forEach(i => {
        tempKv[i.value] = i;
      });
    });

    innerConfig?.checkConfigs?.forEach(item => {
      item.filterItems.forEach(i => {
        if (i.code) {
          i.status = tempKv[i.code]?.checked ? 1 : 0;
        }
      });
    });
    saveConfig();
  };

  const saveConfig = async () => {
    try {
      innerConfig && edmApi.saveFilterConfig(innerConfig);
      innerConfig && onConfirm && onConfirm(cloneDeep(innerConfig));
      edmDataTracker.track('pc_markting_edm_verifychange', {
        action: 'confirm',
      });
    } catch (e) {
      toast.error({ content: '保存失败，请重试' });
    }
  };

  const FooterComp = () => {
    return (
      <div className={style.footer}>
        <Button
          size="large"
          btnType="minorLine"
          inline
          onClick={() => {
            onCancel && onCancel();
            edmDataTracker.track('pc_markting_edm_verifychange', {
              action: 'cancel',
            });
          }}
        >
          取消
        </Button>
        <Button btnType="primary" onClick={setConfirm}>
          {'确定'}
        </Button>
      </div>
    );
  };

  const NotifyComp = () => {
    if (!showNotify) {
      return undefined;
    }
    return (
      <div className={style.notifyRoot}>
        <div className={style.notify}>
          <img className={style.icon} src={ErrorIcon} />
          <span className={style.title}>请选择过滤规则，将在过滤完成后清除所选状态地址，提升送达率</span>
        </div>
        <img
          className={style.icon}
          src={CloseIcon}
          onClick={() => {
            setShowNotify(false);
          }}
        />
      </div>
    );
  };

  const BodyComp = () => {
    return (
      <div className={style.body}>
        {data.map(item => {
          return SectionComp(item);
        })}
      </div>
    );
  };

  const SectionComp = (sec: FilterStrategySection) => {
    let indeterminate = false;
    let checkAll = sec.checkAll;

    let checkedCount = sec.strategy?.filter(i => i.checked).length || 0;

    if (checkedCount > 0) {
      indeterminate = true;
      if (checkedCount === sec.strategy?.length) {
        checkAll = true;
        indeterminate = false;
      }
    }

    return (
      <div>
        <div className={style.sectionTitle}>
          {sec.name}
          {guardString(sec.subTitle) && <span className={style.subTitle}>{sec.subTitle}</span>}
        </div>
        <SiriusCheckbox
          className={style.checkAll}
          checked={checkAll}
          indeterminate={indeterminate}
          onChange={e => {
            sec.checkAll = e.target.checked;
            sec.strategy?.forEach(i => (i.checked = e.target.checked));
            refresh();
          }}
        >
          <div className={style.title}>全选</div>
        </SiriusCheckbox>
        <div className={style.checkboxAll}>
          {sec.strategy?.map(item => {
            return (
              <SiriusCheckbox
                onChange={e => {
                  if (!e.target.checked) {
                    sec.checkAll = false;
                  }
                  item.checked = e.target.checked;
                  refresh();
                }}
                checked={sec.checkAll ? true : item.checked}
              >
                <div className={style.title}>{item.label.replace('无效地址：', '')}</div>
              </SiriusCheckbox>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <CustomerDrawer
      className={style.filterWrapper}
      zIndex={1001}
      visible={visible}
      maskStyle={{ background: 'background: rgba(0, 0, 0, 0.5);' }}
      title={'修改过滤规则'}
      contentWrapperStyle={{ width: '504px' }}
      destroyOnClose
      closeIcon={<img src={CloseIcon} />}
      onClose={() => {
        onCancel && onCancel();
      }}
      mask={true}
      maskClosable={false}
      footer={FooterComp()}
      getContainer={() => document.body}
    >
      <div className={style.root}>
        {NotifyComp()}
        {BodyComp()}
      </div>
    </CustomerDrawer>
  );
};
