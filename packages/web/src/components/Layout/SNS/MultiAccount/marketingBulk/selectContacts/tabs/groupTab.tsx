import React, { useState, useEffect, useRef } from 'react';
import { DatePicker, Button } from 'antd';
import moment from 'moment';
import type { Moment } from 'moment';
import { apis, InsertWhatsAppApi, GroupListReq, api, GroupNunberListItem } from 'api';
import { getTransText } from '@/components/util/translate';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import { useMount } from 'ahooks';
import VirtualList from '../virtualList/index';
import style from './tab.module.scss';
import { TaskProps } from '../contactModal';

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

const { RangePicker } = DatePicker;
const dateFormat = 'YYYY-MM-DD';

interface Option {
  label: string;
  value: string;
}
interface Props {
  taskParmas: TaskProps;
  addWhatsApp: (whatsApp: string[]) => void;
}
export const GroupTab: React.FC<Props> = ({ taskParmas, addWhatsApp }) => {
  const [list, setList] = useState<GroupNunberListItem[]>([]);
  const cacheList = useRef<GroupNunberListItem[]>([]);
  const [keywordOptions, setKeyWordOptions] = useState<Option[]>([]);
  const [groupOptions, setGroupOptions] = useState<Option[]>([]);
  const [groupReq, setGroupReq] = useState<GroupListReq>({} as GroupListReq);
  const [currentGroupId, setCurrentGroupId] = useState<string>();
  const [frequency, setFrequency] = useState<number>();

  const handleKeyWorkSelect = (value: string) => {
    setGroupReq(lastValue => ({
      ...lastValue,
      keyword: value,
    }));
    setCurrentGroupId(undefined);
    setFrequency(undefined);
  };

  const onChangeTimeRange = (time: Moment[]) => {
    if (time?.length === 2) {
      setGroupReq(lastValue => ({
        ...lastValue,
        createAtStart: time[0]?.format(dateFormat),
        createAtEnd: time[1]?.format(dateFormat),
      }));
    } else {
      setGroupReq(lastValue => ({
        ...lastValue,
        createAtStart: undefined,
        createAtEnd: undefined,
      }));
    }
  };

  const handleGroupSelect = (value: string) => {
    setCurrentGroupId(value);
    setFrequency(undefined);
  };

  const getKeyworkOptions = () => {
    whatsAppApi.groupHistoryKeywords().then(res => {
      setKeyWordOptions((res?.content || []).map(item => ({ label: item.keyword, value: item.keyword })));
    });
  };
  // 获取群列表
  const getGroupOptions = (req: GroupListReq) => {
    whatsAppApi.getWaGroupList(req).then(res => {
      setGroupOptions(
        (res?.content || []).map(item => ({
          value: `${item?.taskId},${item?.groupId}`,
          label: `${item.groupName}(${item.waCount || 0})`,
        }))
      );
    });
  };

  useEffect(() => {
    if (typeof frequency === 'number') {
      const filterData = cacheList.current.filter(item => {
        if (frequency === 6) {
          return item.sentCount >= 6;
        }
        return item.sentCount === frequency;
      });
      setList(filterData);
    } else {
      setList(cacheList.current);
    }
  }, [frequency]);

  useEffect(() => {
    if (currentGroupId) {
      const paramsArr = currentGroupId.split(',');
      whatsAppApi
        .getWaGroupNumberList({
          taskId: paramsArr[0],
          groupId: paramsArr[1],
        })
        .then(res => {
          cacheList.current = res?.content ?? [];
          setList(res?.content || []);
        });
    } else {
      setList([]);
    }
  }, [currentGroupId]);

  useEffect(() => {
    if (groupReq?.keyword) {
      getGroupOptions(groupReq);
    } else {
      setGroupOptions([]);
    }
  }, [groupReq]);

  useEffect(() => {
    if (taskParmas?.keyWord && taskParmas?.time) {
      setGroupReq({
        keyword: taskParmas?.keyWord,
        createAtStart: taskParmas?.time,
        createAtEnd: taskParmas?.time,
      });
    }
    if (taskParmas?.taskId && taskParmas?.groupId) {
      setCurrentGroupId(`${taskParmas?.taskId},${taskParmas?.groupId}`);
    }
  }, [taskParmas]);

  useMount(() => {
    getKeyworkOptions();
  });

  return (
    <div className={style.tabContentWrap}>
      <div className={style.search}>
        {/* <RangePicker
          className="edm-range-picker"
          dropdownClassName="edm-date-picker-dropdown-wrap"
          placeholder={[getTransText('KAISHIRIQI'), getTransText('JIESHURIQI')]}
          style={{
            height: 32,
            width: '100%',
            marginBottom: 12,
          }}
          value={groupReq?.createAtStart ? [moment(groupReq?.createAtStart), moment(groupReq?.createAtEnd)] : undefined}
          onChange={time => onChangeTimeRange(time as Moment[])}
        /> */}
        <EnhanceSelect
          value={groupReq?.keyword || undefined}
          showSearch
          allowClear
          onChange={handleKeyWorkSelect}
          placeholder={'请输入关键词'}
          optionFilterProp="name"
          style={{ width: '48%' }}
        >
          {keywordOptions.map(item => (
            <InSingleOption value={item.value}>{item.label}</InSingleOption>
          ))}
        </EnhanceSelect>
        <EnhanceSelect
          value={currentGroupId || undefined}
          showSearch
          allowClear
          onChange={handleGroupSelect}
          placeholder={'请选择群'}
          optionFilterProp="name"
          style={{ width: '48%' }}
        >
          {groupOptions.map(item => (
            <InSingleOption title={item.label} value={item.value}>
              {item.label}
            </InSingleOption>
          ))}
        </EnhanceSelect>
        <EnhanceSelect
          value={frequency || undefined}
          showSearch
          allowClear
          onChange={value => setFrequency(value)}
          placeholder={'账号营销次数'}
          optionFilterProp="name"
          style={{ width: '48%' }}
        >
          {[0, 1, 2, 3, 4, 5, 6].map(item => (
            <InSingleOption title={item + ''} value={item}>
              {item === 0 ? '从未营销过' : item > 5 ? '5次以上' : `${item}次`}
            </InSingleOption>
          ))}
        </EnhanceSelect>
      </div>
      <VirtualList
        originalList={list}
        onDelete={whatsApp => {
          setList(lastlist => {
            const restList = lastlist.filter(item => item.number !== whatsApp);
            return restList;
          });
        }}
      />
      <div className={style.btnBox}>
        <Button disabled={!list.length} onClick={() => addWhatsApp(list.map(item => item.number))}>
          添加
        </Button>
      </div>
    </div>
  );
};
