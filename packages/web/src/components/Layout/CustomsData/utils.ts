// import moment from 'moment';
import { resCustomsFollowCountry } from 'api';
import { CustomsContinent } from 'api';
// import SearchType
export interface recData {
  visible: boolean;
  zIndex: number;
  to: 'buysers' | 'supplier' | 'peers';
  content: {
    country: string;
    to: 'buysers' | 'supplier' | 'peers';
    companyName: string;
    tabOneValue?: string;
    queryValue?: string;
    relationCountryList?: string[];
  };
  children?: recData;
}

const onDrawerClose = (recData: recData, closeIndex: number) => {
  const rec = (currentIndex: number, recData: recData) => {
    if (currentIndex === closeIndex) {
      recData.visible = false;
      recData.children && delete recData.children;
    } else {
      const _recData = recData.children;
      rec(currentIndex + 1, _recData);
    }
  };
  rec(0, recData);
  return recData;
};
const onDrawerOpen = (recData: recData, content: any, totalIndex: number) => {
  console.log('onDraweropen', content, totalIndex);
  const rec = (currentIndex: number, recData: recData) => {
    if (recData) {
      if (currentIndex === totalIndex) {
        recData.visible = true;
        recData.to = content.to;
        recData.content = content;
      } else {
        if (!recData.children) {
          recData.children = {
            visible: false,
            zIndex: currentIndex + 1,
            to: content.to,
            content,
          };
        }
        rec(currentIndex + 1, recData.children);
      }
    }
  };
  rec(0, recData);
  return recData;
};
const handleCountryInput = (param: string, continentList: CustomsContinent[]) => {
  const arr = continentList.filter(cn => {
    const { countries } = cn;
    return countries.some(item => item.name === param);
  });
  if (arr.length > 0) {
    return [arr[0].continent, param];
  } else if (continentList.some(item => item.continent === param)) {
    return [param];
  } else {
    return [];
  }
};

const handleArrCountryInput = (data: string[], continentList: CustomsContinent[]) => {
  let arr: string[][] = [];
  data.forEach(item => {
    arr.push(handleCountryInput(item, continentList));
  });
  return arr;
};

const handleCountryOutPut = (values: string[][], continentList: CustomsContinent[], needCountry?: boolean) => {
  const countryLists = values.map(item => {
    const [con, cou] = item || [];
    if (needCountry && !cou && con) {
      if (continentList.find(e => e.continent === con)) {
        return continentList.find(e => e.continent === con)?.countries?.map(v => v.name);
      } else {
        return [];
      }
    } else {
      return cou ? cou : con;
    }
  });
  if (countryLists && countryLists.length > 0) {
    let finaArr: string[] = [];
    countryLists.forEach(item => {
      if (Array.isArray(item)) {
        finaArr = [...finaArr, ...item];
      } else {
        finaArr.push(item as string);
      }
    });
    return finaArr;
  } else {
    return [];
  }
};
// /**
//  * 根据baseDate 和 日期筛选项（'进5年、进半年等'）计算日期范围 用于预填日期选择器
//  * @param baseDate
//  * @param timeFilter
//  */
// function calcuteDate(baseDate: string, timeFilter: string): [string, string] {
//   if (!baseDate || !timeFilter) {
//     return ['', ''];
//   }
//   return ['2022-01-01', '2022-01-09'];
// }

export { onDrawerClose, onDrawerOpen, handleCountryInput, handleCountryOutPut, handleArrCountryInput };
