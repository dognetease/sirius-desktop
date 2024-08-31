import { useState } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { useMemoizedFn } from 'ahooks';
import { recData as RecDataType } from '@/components/Layout/CustomsData/customs/customs';

export const useDrawerByRecData = () => {
  const [recData, setRecData] = useState<RecDataType>({
    visible: false,
    to: 'buysers',
    zIndex: 0,
    content: {
      country: '',
      to: 'buysers',
      companyName: '',
      tabOneValue: '',
      queryValue: '',
      originCompanyName: '',
      visited: false,
      otherGoodsShipped: [],
    },
  });
  const onDrawerClose = useMemoizedFn((closeIndex: number) => {
    const rec = (currentIndex: number, currRecData: any) => {
      if (currentIndex === closeIndex) {
        currRecData.visible = false;
        currRecData.children && delete currRecData.children;
      } else {
        const _recData = currRecData.children;
        rec(currentIndex + 1, _recData);
      }
    };
    const newRecData = cloneDeep(recData);
    rec(0, newRecData);
    setRecData(newRecData);
  });

  const onDrawerOpen = useMemoizedFn((content: RecDataType['content'], zIndex: number) => {
    const rec = (currentIndex: number, currRecData: RecDataType) => {
      if (currRecData) {
        if (currentIndex === zIndex) {
          currRecData.visible = true;
          currRecData.to = content.to;
          // 注意数据兼容性
          currRecData.content = { ...content };
        } else {
          if (!currRecData.children) {
            currRecData.children = {
              visible: false,
              zIndex: currentIndex + 1,
              to: content.to,
              // 注意数据兼容性
              content: { ...content },
            };
          }
          rec(currentIndex + 1, currRecData.children);
        }
      }
    };
    const newRecData = cloneDeep(recData);
    rec(0, newRecData);
    setRecData(newRecData);
  });
  return { onDrawerOpen, onDrawerClose, recData };
};
