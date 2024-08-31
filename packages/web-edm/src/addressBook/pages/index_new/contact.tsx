import React, { useState, useRef, useMemo, useEffect } from 'react';
import style from './contact.module.scss';
import classnames from 'classnames/bind';
import { QuickMarktingTab } from './quickMarktingTab';
import { MarktingGuide } from './marktingGuide';
import { MarktingAihostingConfig } from './marktingAihostingConfig';
import { MarktingAddContact } from './marktingImportContact';
import qs from 'querystring';
import { conf, AddressBookContactsParams, apiHolder, apis, ProductAuthApi, AddressBookNewApi, SystemEvent, QuickMarktingGroup, EdmSendBoxApi } from 'api';
import ContactTable from './contact-table';
// import Steps from '@web-common/components/UI/SiriusSteps';
import { navigate } from '@reach/router';
// import { Tabs } from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';

const productAuthApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as unknown as ProductAuthApi;
const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;
const sendboxApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as unknown as EdmSendBoxApi;
const eventApi = apiHolder.api.getEventApi();

const realStyle = classnames.bind(style);

interface MarketingStatConfig<T = unknown> {
  status: 'init' | 'done';
  // isDefaultStep: boolean,
  detail: T;
}

interface MarktingStatTotalConfig {
  first: MarketingStatConfig<number>;
  second: MarketingStatConfig<number>;
  third: MarketingStatConfig<Record<'autoCount' | 'manualCount' | 'manualContactCount', number>>;
}

const IMPORT_CONTACT_LOWESTSIZE = conf('stage') === 'prod' ? 10000 : 100;
const SENDCOUNT_LOWESTSIZE = conf('stage') === 'prod' ? 2000 : 100;

export const ContactOverview: React.FC<{
  qs: Record<string, string>;
  tabScrollY: number;
}> = ({ tabScrollY }) => {
  const [checkedQuickMarktingGroupId, setQuickMarktingGroupId] = useState('');

  const [hasTransferDone] = useState(productAuthApi.getABSwitchSync('address_transfer2_crm_done'));

  const ref = useRef<{
    refreshListWithParam(params: AddressBookContactsParams): void;
  }>();
  const marktingAreaRef = useRef<HTMLInputElement>(null);

  const query = useMemo(() => qs.parse(location.hash.split('?')[1]), [location.hash]);

  const [marketingStatConfig, setMarketingStatConfig] = useState<MarktingStatTotalConfig>({
    first: { status: 'init', detail: 0 },
    second: { status: 'init', detail: 0 },
    third: { status: 'init', detail: { autoCount: 0, manualCount: 0, manualContactCount: 0 } },
  });

  const [checkedMarketingStep, setCheckedMarketingStep] = useState<number>(0);

  // 判断联系人数量 & 单周发信数量 & 营销配置
  useEffect(() => {
    Promise.all([addressBookNewApi.getQuickMarktingGroupCount({ groupId: 1, type: 'INITITAL' }), sendboxApi.getMarketingStats()]).then(([count, marktingStats]) => {
      const { weeklySendCount = 0, autoCount = 0, manualContactCount = 0, manualCount = 0 } = marktingStats;

      const firstStatus = count > IMPORT_CONTACT_LOWESTSIZE ? 'done' : 'init';
      const secondStatus = weeklySendCount > SENDCOUNT_LOWESTSIZE ? 'done' : 'init';
      const thirdStatus = autoCount > 0 && manualCount > 0 && manualContactCount > 0 ? 'done' : 'init';
      if (firstStatus === 'init') {
        setCheckedMarketingStep(0);
      } else if (secondStatus === 'init') {
        setCheckedMarketingStep(1);
      } else if (thirdStatus === 'init') {
        setCheckedMarketingStep(2);
      } else {
        setCheckedMarketingStep(1);
      }
      setMarketingStatConfig({
        first: {
          status: firstStatus,
          detail: count,
        },
        second: {
          status: secondStatus,
          detail: marktingStats.weeklySendCount,
        },
        third: {
          status: thirdStatus,
          detail: {
            autoCount,
            manualContactCount,
            manualCount,
          },
        },
      });
    });
  }, []);

  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('changeQuickMarktingGroup', {
      func(e: SystemEvent<QuickMarktingGroup>) {
        if (!e.eventData || !e.eventData.group_id) {
          return;
        }
        ref.current?.refreshListWithParam({
          groupFilter: e.eventData.group_filter_settings.grouped_filter,
          resetFormFilter: true,
        });

        const queryObj = qs.parse(location.hash.split('?')[1]);

        if (location.hash.includes('#edm')) {
          navigate('#edm?' + qs.stringify({ ...queryObj, markting_group_id: e.eventData.group_id }));
        }
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('changeQuickMarktingGroup', eid);
    };
  }, []);

  return (
    <div className={realStyle('contactOverviewWrapper')}>
      <div className={realStyle('marktingTabs')}>
        <div
          onClick={() => {
            setCheckedMarketingStep(0);
          }}
          className={realStyle('marktingTab', { active: checkedMarketingStep === 0, success: marketingStatConfig.first.status === 'done' })}
        >
          录入联系人
        </div>
        <div
          onClick={() => {
            setCheckedMarketingStep(1);
          }}
          className={realStyle('marktingTab', { active: checkedMarketingStep === 1, success: marketingStatConfig.second.status === 'done' })}
        >
          发起营销
        </div>
        <div
          onClick={() => {
            setCheckedMarketingStep(2);
          }}
          className={realStyle('marktingTab', { active: checkedMarketingStep === 2, success: marketingStatConfig.third.status === 'done' })}
        >
          配置营销托管
        </div>
      </div>
      <div className={realStyle('marktingArea')} ref={marktingAreaRef}>
        {/* 导入联系人 */}
        {checkedMarketingStep === 0 ? <MarktingAddContact isDone={marketingStatConfig.first.status === 'done'} count={marketingStatConfig.first.detail} /> : null}

        {/* 营销引导 */}
        {checkedMarketingStep === 1 ? (
          <>
            <QuickMarktingTab />
            <MarktingGuide groupId={checkedQuickMarktingGroupId} weeklySendCount={marketingStatConfig.second.detail} lowestSendCount={SENDCOUNT_LOWESTSIZE} />
          </>
        ) : null}

        {/* 配置营销托管信息 */}
        {checkedMarketingStep === 2 ? (
          <MarktingAihostingConfig
            autoCount={marketingStatConfig.third.detail.autoCount}
            manualCount={marketingStatConfig.third.detail.manualCount}
            manualContactCount={marketingStatConfig.third.detail.manualContactCount}
          />
        ) : null}
      </div>

      <ContactTable
        ref={ref}
        isOverview={false}
        tabScrollY={tabScrollY}
        startFilterFixedHeight={marktingAreaRef.current?.clientHeight ? marktingAreaRef.current?.clientHeight + 98 : -1}
      />
    </div>
  );
};
