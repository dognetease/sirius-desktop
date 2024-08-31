import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import style from './marktingGuide.module.scss';
import classnames from 'classnames/bind';
import qs from 'querystring';
import { recordDataTracker } from '../../utils';
import { apiHolder, SystemEvent, QuickMarktingGroup, QuickMarktingGuideList, QuickMarktingGuideItem, apis, AddressBookNewApi } from 'api';
import { getSendCount } from '@/components/Layout/Customer/components/hooks/useEdmSendCount';
import TongyongJiazai from '@web-common/images/newIcon/tongyong_jiazai';
import { ReactComponent as LightIcon } from './images/lightIcon.svg';

const realStyle = classnames.bind(style);
const eventApi = apiHolder.api.getEventApi();
const addressBookNewApi = apiHolder.api.requireLogicalApi(apis.addressBookNewApiImpl) as unknown as AddressBookNewApi;
interface QuickMarktingGuide {
  guide_content: string;
  guide_number: number;
  guide_filter: unknown;
}

export const MarktingGuide: React.FC<{
  groupId: string;
  weeklySendCount: number;
  lowestSendCount: number;
}> = ({ weeklySendCount, lowestSendCount }) => {
  const [isloading, setIsloading] = useState(true);
  const [groupId, setGroupId] = useState(-1);
  const query = useMemo(() => qs.parse(location.hash.split('?')[1]), [location?.hash]);
  const [checkedGroup, setCheckedGroup] = useState<undefined | QuickMarktingGroup>(undefined);

  const [guideList, setGuideList] = useState<QuickMarktingGuideItem[] | null>([]);

  const [guideAdTips, setGuideAdTips] = useState('');

  const [userGuideCount, setUserGuideCount] = useState(0);

  const refreshCustomCount = (groupId: number) => {
    setUserGuideCount(0);

    addressBookNewApi
      .getQuickMarktingGroupCount({
        type: 'CUSTOMIZE',
        groupId: groupId,
      })
      .then(count => {
        setUserGuideCount(count);
      });
  };

  useEffect(() => {
    if (checkedGroup?.type !== 'CUSTOMIZE') {
      return;
    }

    refreshCustomCount(checkedGroup.group_id);
  }, [checkedGroup?.group_id]);

  const refreshSystemGuide = (id: number) => {
    return addressBookNewApi
      .getQuickMarktingGuideList({
        groupId: id,
      })
      .then(args => {
        const { guides, suggest } = args;
        setGuideList(
          (guides || []).filter(item => {
            return item.guide_number;
          })
        );
        setGuideAdTips(suggest);
      });
  };

  useEffect(() => {
    if (!checkedGroup?.group_id) {
      return;
    }
    setIsloading(true);

    refreshSystemGuide(checkedGroup.group_id).finally(() => {
      setIsloading(false);
    });
  }, [checkedGroup?.group_id]);

  // 如果联系人联系移除了数据 刷新引导
  useEffect(() => {
    if (!query.refreshkey || !(query.refreshkey as string).startsWith('markting') || !checkedGroup) {
      return;
    }

    if (checkedGroup.type === 'INITITAL') {
      refreshSystemGuide(checkedGroup.group_id);
    } else {
      refreshCustomCount(checkedGroup.group_id);
    }
  }, [query?.refreshkey]);

  // 一键营销
  const triggerMarkting = async (item: QuickMarktingGuideItem) => {
    // 根据查询条件获取通联系人数据

    const list = await addressBookNewApi.getMarktingFiltedEmails({
      groupedFilter: item.guide_filter,
      page_size: item.guide_number,
    });

    console.log('[marktingGuide]click markting', list);
    recordDataTracker('pc_marketing_contactBook_edmGuide', {
      action: 'edm',
    });

    // 跳转
    getSendCount({
      emailList: list.map(item => {
        return { contactEmail: item.email, contactName: item.contact_name, sourceName: item.source_name };
      }),
      from: 'addressBook',
      back: location.hash,
    });
  };

  useEffect(() => {
    const eid = eventApi.registerSysEventObserver('changeQuickMarktingGroup', {
      func(e: SystemEvent<QuickMarktingGroup>) {
        setCheckedGroup(e.eventData);
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('changeQuickMarktingGroup', eid);
    };
  }, []);

  const renderGuideContent = useCallback((tpl, num) => {
    const [preContent = '', suffixContent = ''] = tpl.split('$\\{\\}');

    return (
      <>
        {preContent}
        <span className={realStyle('count')}>{num}</span>
        {suffixContent}
      </>
    );
  }, []);

  if (isloading) {
    return (
      <div className={realStyle('marktingGuideWrapper')}>
        <p className={realStyle('loading')}>
          <TongyongJiazai className={realStyle('icon')} />
          数据加载中
        </p>
      </div>
    );
  }

  return (
    <div className={realStyle('marktingGuideWrapper', { visible: userGuideCount || guideList?.length })}>
      {checkedGroup?.group_id === 1 ? (
        <p className={realStyle('tips', [weeklySendCount && weeklySendCount > lowestSendCount ? 'success' : 'unsuccess'])}>
          {weeklySendCount && weeklySendCount > lowestSendCount
            ? `非常棒!本周已发送${weeklySendCount}封营销邮件，保持每周发送足量营销信，可以获得更多效果`
            : '本周营销信发送较少，建议增加营销信发送量，以获得更多效果'}
        </p>
      ) : checkedGroup?.type === 'INITITAL' && guideAdTips ? (
        <p className={realStyle('tips')}>{['“', guideAdTips, '”'].join('')}</p>
      ) : null}

      <div className={realStyle('guideList')}>
        {checkedGroup?.type === 'INITITAL' && guideList?.length
          ? guideList.map(item => {
              return (
                <div className={realStyle('guideItem')}>
                  {renderGuideContent(item.guide_content, item.guide_number)}
                  <span
                    className={realStyle('marktingAction')}
                    onClick={() => {
                      triggerMarkting(item);
                    }}
                  >
                    一键营销
                  </span>
                </div>
              );
            })
          : null}

        {checkedGroup?.type === 'CUSTOMIZE' && userGuideCount ? (
          <div className={realStyle('guideItem')}>
            您有<span className={realStyle('count')}>{userGuideCount}</span>个地址满足[{checkedGroup.group_name}],您可以发起营销
            <span
              className={realStyle('marktingAction')}
              onClick={() => {
                triggerMarkting({
                  guide_content: '',
                  guide_filter: checkedGroup.group_filter_settings.grouped_filter,
                  guide_number: 0,
                });
              }}
            >
              一键营销
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
