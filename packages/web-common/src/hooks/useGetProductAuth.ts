import { useEffect, useState } from 'react';
import { ProductAuthApi, apiHolder, apis, ProductAuthTagInfo, ProductVersionInfo, ProductTagEnum } from 'api';

export const productAuthApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;

export function useGetProductAuth() {
  const [productAuthTagInfo, setProductAuthTagInfo] = useState<ProductAuthTagInfo[]>([]);
  const [productVersionInfo, setProductVersionInfo] = useState<ProductVersionInfo>({
    productId: '',
    productVersionId: 'others',
    showVersionTag: false,
    productVersionName: '',
  });

  useEffect(() => {
    productAuthApi.doGetProductAuthTags().then(setProductAuthTagInfo);
    productAuthApi.doGetProductVersion().then(setProductVersionInfo);
    // TO FIX PROBLEM:
    // 'Can't perform a React state update on an unmounted component.
    // This is a no-op, but it indicates a memory leak in your application.
    // To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function.
    // let shouldUpdate = true;

    // productAuthApi.doGetProductAuthTags().then(v => {
    //   if (shouldUpdate) {
    //     setProductAuthTagInfo(v);
    //   }
    // });

    // productAuthApi.doGetProductVersion().then(v => {
    //   if (shouldUpdate) {
    //     setProductVersionInfo(v);
    //   }
    // });

    // return () => {
    //   shouldUpdate = false;
    // }
  }, []);

  return {
    productVersionInfo,
    productAuthTagInfo,
  };
}

/**
 * hook: 返回真则展示标签，说明该标签对应的功能是限时的，以后可能无权限
 * @param tagName 标签名称
 * @returns boolean
 * @example const subscribeTagDisplay = useShouldProductAuthTagDisplay(ProductTagEnum.CALENDAR_SHARING_SUBSCRIBE);
 */
export function useShouldProductAuthTagDisplay(tagName: ProductTagEnum | ProductTagEnum[]) {
  const tagNames = Array.isArray(tagName) ? tagName : [tagName];
  const { productAuthTagInfo } = useGetProductAuth();
  return productAuthTagInfo.some(t => tagNames.includes(t.tagName) && t.needDisplay);
}
