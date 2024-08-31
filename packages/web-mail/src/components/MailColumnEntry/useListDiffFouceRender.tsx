/*
 * 功能：根据用户设置，进行列表数据对比，在列表高度变化的时候进行强制渲染
 */
import { useRef, useMemo } from 'react';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { MailEntryModel } from 'api';
import { getCardHeight } from '@web-mail/utils/mailCardUtil';
import { getCardHeight as getLongCardHeight } from '../../common/components/vlistCards/MailCard/MailCardLong';

const useListDiffFouceRender = (mailDataList: MailEntryModel[], searchList: MailEntryModel[], isSearching: boolean, isLeftRight: boolean): number => {
  // 快捷设置三个，摘要，附件，列表密度，会影响列表重排列
  const [descChecked] = useState2RM('configMailListShowDesc');
  const [attachmentChecked] = useState2RM('configMailListShowAttachment');
  const [mailConfigListTightness] = useState2RM('configMailListTightness');

  /**
   * 检测列表高度是否发生变化，如果变化则强制列表进行渲染同步，只在列表长度没有发生变化的时候进行检测
   * 列表长度变化则有id的变化去触发列表的渲染
   */
  const listPreConfigRef = useRef<{
    // 上一次检测的列表长度
    listPreLength: number;
    // 上一次检测的列表高度
    listPreHeight: number;
    // 是否是初始化
    isInit: boolean;
    // 上次对比的列表id
    preIds: string;
  }>({
    listPreLength: 0,
    listPreHeight: 0,
    isInit: true,
    preIds: '',
  });

  // 邮件列表的id的key
  const mailIdList: string = useMemo(() => {
    const list = isSearching ? searchList : mailDataList;
    return (list as MailEntryModel[])?.map(item => item?.id)?.join(',');
  }, [mailDataList, searchList, isSearching]);

  // 处理邮件第一封首次置顶，id顺序不变导致的不渲染
  const mailTopKeyStr: string = useMemo(() => {
    const list = isSearching ? searchList : mailDataList;
    return (list as MailEntryModel[])?.map(item => (item?.entry?.top ? '1' : '0'))?.join('');
  }, [mailDataList, searchList, isSearching]);

  const MailListHeightChange = useMemo(() => {
    const { listPreLength, listPreHeight, isInit, preIds } = listPreConfigRef.current;
    // 只在列表id没变，但是数据源却发生了变化的时候，进行高度对比检测。
    const list = ((isSearching ? searchList : mailDataList) as MailEntryModel[]) || [];
    try {
      if (listPreLength === list?.length && mailIdList == preIds && !isInit) {
        let sum = 0;
        if (isLeftRight) {
          list?.forEach(item => {
            sum += getCardHeight(item, isSearching);
          });
        } else {
          // const list = ((isSearching ? searchList : mailDataList) as MailEntryModel[]) || [];
          list?.forEach(item => {
            sum += getLongCardHeight(item, isSearching);
          });
        }
        listPreConfigRef.current.listPreHeight = sum;
        listPreConfigRef.current.preIds = mailIdList;
        listPreConfigRef.current.listPreLength = list.length;
        return sum;
      } else {
        // 只有列表长度变化一次后，才开启对比
        listPreConfigRef.current.isInit = false;
        listPreConfigRef.current.preIds = mailIdList;
        listPreConfigRef.current.listPreLength = list.length;
        // 直接返回上次的值，防止触发渲染
        return listPreHeight;
      }
    } catch (e) {
      console.log('[MailListHeightChange Error]', e);
    }
    return listPreHeight;
  }, [mailDataList, searchList]);

  // 列表强制重渲染
  // 业务：在邮件快捷键切换后，立即重算虚拟列表的位置
  // 在检测到列表高度有异常变化的时候
  const frCount = useRef(0);
  const listFouceRender = useMemo(() => {
    frCount.current++;
    return frCount.current;
  }, [mailConfigListTightness, descChecked, attachmentChecked, MailListHeightChange, mailTopKeyStr]);

  return listFouceRender;
};

export default useListDiffFouceRender;
