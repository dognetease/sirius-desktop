import { useEffect, useState, useCallback } from 'react';
import { endKeyReg, domainReg } from '../../../globalSearch/search/search';
type customSearchType = 'goodsShipped' | 'company' | 'hsCode' | 'port' | 'queryCompany';

interface useGuideSearchProp {
  show: boolean;
  ref: HTMLElement | null | undefined;
  from?: 'customs' | 'guomao';
}

type HookType = (
  props: useGuideSearchProp
) => [
  guideSearchCustoms: (value: string, type: customSearchType) => void,
  guideSearchPart: { searchType: customSearchType; width?: number; show: boolean },
  translateStyle: React.CSSProperties
];

const useGuideSearch: HookType = (props: useGuideSearchProp) => {
  const { show, ref, from } = props;

  const locationHash = location.hash;

  const [guideSearchPart, setGuideSearchPart] = useState<{
    searchType: customSearchType;
    width?: number;
    show: boolean;
  }>({
    searchType: 'goodsShipped',
    show: false,
  });

  const [translateStyle, setTranslateStyle] = useState<React.CSSProperties>({});

  const guideSearchCustoms = useCallback(
    (value: string, type: customSearchType) => {
      console.log(value, type, 'dsadsadasdasda');

      if (/(?:CO|CORP|COMPANY|CORPORATION|LTD|LIMITED|LT|GMBH)$/gi.test(value)) {
        type === (from === 'customs' ? 'company' : 'queryCompany')
          ? setGuideSearchPart(prv => {
              return {
                searchType: from === 'customs' ? 'company' : 'queryCompany',
                width: calculateTextWidth(value),
                show: false,
              };
            })
          : setGuideSearchPart(prv => {
              return {
                searchType: from === 'customs' ? 'company' : 'queryCompany',
                width: calculateTextWidth(value),
                show: true,
              };
            });
      } else if (/^\d+$/.test(value)) {
        type === 'hsCode'
          ? setGuideSearchPart(prv => {
              return {
                searchType: 'hsCode',
                width: calculateTextWidth(value),
                show: false,
              };
            })
          : setGuideSearchPart(prv => {
              return {
                searchType: 'hsCode',
                width: calculateTextWidth(value),
                show: true,
              };
            });
      } else {
        guideSearchPart.show
          ? ''
          : setGuideSearchPart(prv => {
              return {
                ...prv,
                searchType: ['company', 'queryCompany'].includes(prv.searchType) ? (from === 'customs' ? 'company' : 'queryCompany') : prv.searchType,
                show: false,
              };
            });
      }
    },
    [show]
  );

  useEffect(() => {
    setGuideSearchPart(prv => {
      return {
        ...prv,
        show: false,
      };
    });
  }, [locationHash]);

  const calculateTextWidth = useCallback((str: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 50;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.font = '14px 苹方-简,sans-serif';
    ctx.textBaseline = 'top';
    return ctx.measureText(str).width;
  }, []);

  useEffect(() => {
    show === guideSearchPart.show
      ? ''
      : setGuideSearchPart(prv => {
          return {
            ...prv,
            show,
          };
        });
  }, [show]);

  useEffect(() => {
    if (guideSearchPart.show && ref) {
      const offsetLeft = ref ? ref.offsetLeft : 0;
      const offsetTop = ref ? ref.offsetTop : 0;
      const offsetHeight = ref ? ref.offsetHeight : 0;
      const positionLeft = guideSearchPart.width ? guideSearchPart.width + 15 : 15;
      setTranslateStyle({
        left: positionLeft + offsetLeft,
        top: offsetTop,
      });
    }
  }, [guideSearchPart.show, ref?.offsetLeft, ref?.offsetTop, ref?.offsetHeight, location.hash]);

  return [guideSearchCustoms, guideSearchPart, translateStyle];
};
export default useGuideSearch;
