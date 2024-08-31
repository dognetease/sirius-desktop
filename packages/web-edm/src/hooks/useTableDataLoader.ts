import { useState, useEffect } from 'react';
import { keyBy } from 'lodash';

// 邮件选择商品弹窗获取产品列表
export default (api, path, searchParam) => {
  const [tableList, setTableList] = useState<any[]>([]);
  const [tableMap, setTableMap] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [hasContent, setHasContent] = useState(false);
  const [total, setTotal] = useState<number>(0);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    setLoading(true);
    requestTableData(1);
    console.log('请求参数....', searchParam);
  }, [searchParam]);

  const requestTableData = (log: any) => {
    api[path](searchParam).then((data: any) => {
      if (data.error) {
        return;
      }
      const { fields, totalCount, page, productDetailList = [] } = data;
      if (data.totalCount > 0) {
        try {
          productDetailList.forEach((product: { pictures: string }) => {
            if (product.pictures) {
              try {
                product.pictures = JSON.parse(product.pictures);
              } catch {}
            }
          });
        } catch {}
        setFields(fields);
        setCurrent(page);
        setTotal(totalCount);
        setTableList(productDetailList);
        setHasContent(true);
        setTableMap(keyBy(productDetailList, 'id'));
      } else {
        setHasContent(false);
      }
      setLoading(false);
      console.log('请求数据-table-api', data);
    });
  };
  return {
    tableList,
    tableMap,
    loading,
    total,
    fields,
    hasContent,
    requestTableData,
    current,
  };
};
