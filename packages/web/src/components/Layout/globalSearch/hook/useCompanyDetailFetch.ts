import { useRef, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { GlobalSearchCompanyDetail, MergeCompany, SimilarCompanyTableDataItem } from 'api';
import { globalSearchApi } from '../constants';
import { errorReportApi } from '../sentry-utils';

// 增加sourceCountry，标识元数据中的country
export type ExtendsGlobalSearchCompanyDetail = GlobalSearchCompanyDetail & { sourceCountry?: string };
interface FetchDataParams {
  queryGoodsShipped?: string;
  domainCountry?: string;
  defaultDetail?: GlobalSearchCompanyDetail;
}
export const useCompanyDetailFetch = (params: FetchDataParams) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExtendsGlobalSearchCompanyDetail | undefined>(
    params.defaultDetail
      ? {
          ...params.defaultDetail,
          sourceCountry: params.defaultDetail.country || '',
        }
      : undefined
  );
  const [headerCompanyList, setHeaderCompanyList] = useState<Array<MergeCompany>>([]);
  const [similarCompanyData, setSimilarCompanyData] = useState<SimilarCompanyTableDataItem[]>([]);
  const originData = useRef<Readonly<ExtendsGlobalSearchCompanyDetail>>();
  const fetchData = useMemoizedFn((dataId: string, sentryId?: number) => {
    if (!data) {
      setLoading(true);
    }
    globalSearchApi.getDetail({ id: dataId, product: params.queryGoodsShipped }).then(detailData => {
      if (!detailData) {
        if (sentryId) {
          errorReportApi.endTransaction({ id: sentryId });
        }
        setLoading(false);
        return;
      }
      const mergeCompanys: MergeCompany[] = detailData.mergeCompanys?.slice() || [];
      if (detailData.mergeCompanys) {
        mergeCompanys.unshift({
          companyId: detailData.companyId as string,
          country: detailData?.country,
          name: detailData.name,
          location: detailData.location,
          collectId: detailData.collectId,
        });
      } else {
        mergeCompanys.push({
          companyId: detailData.companyId as string,
          country: detailData.country,
          name: detailData.name,
          location: detailData.location,
          collectId: detailData.collectId,
        });
      }
      setHeaderCompanyList(mergeCompanys);
      const processData = {
        ...detailData,
        mergeCompanys,
        country: (params.domainCountry || detailData.country) ?? '',
        sourceCountry: detailData.country || '',
      };
      setData(processData);
      // 记录请求后得到的原始数据
      originData.current = processData;
      if (sentryId) {
        errorReportApi.endTransaction({ id: sentryId });
      }
      setLoading(false);
    });
  });
  const reqSimilarCompanyData = (dataId: string) => {
    // 获取相似公司请求
    globalSearchApi.getSimilarCompanytable({ id: dataId }).then(res => {
      setSimilarCompanyData(res);
    });
  };
  return { loading, data, headerCompanyList, originData, fetchData, setData, reqSimilarCompanyData, similarCompanyData };
};
