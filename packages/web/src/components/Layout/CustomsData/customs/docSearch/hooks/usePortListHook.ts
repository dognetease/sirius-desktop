import { useContext, useEffect, useState } from 'react';
import { api, apis, CommonlyUsePort, CommonlyUsePortType, EdmCustomsApi, IHotPortCollection, TCustomsPort } from 'api';
import { ForwarderContext } from '../../ForwarderSearch/context/forwarder';

const customsApi = api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;

export async function getCustomPort() {
  try {
    const ports = await customsApi.doGetCustomsPortList();
    return ports || [];
  } catch (error) {
    return [];
  }
}

const usePortListHook = () => {
  const [ports, setPorts] = useState<TCustomsPort[]>([]);
  useEffect(() => {
    getCustomPort().then(setPorts);
  }, []);
  return ports;
};

export const useHotPortList = () => {
  const [ports, setPorts] = useState<IHotPortCollection[]>([]);
  useEffect(() => {
    customsApi.doGetCustomsHotPortList().then(setPorts);
  }, []);
  return ports;
};

const defaultCommonlyUsePortTypes = [CommonlyUsePortType.CN, CommonlyUsePortType.Collection];
/**
 * 中国/常用（用户收藏的）国家港口数据
 * 默认都获取
 * @param types CommonlyUsePortType
 * @returns CommonlyUsePort[]
 */
export const useForwarderCommonlyUsedPort = (types: CommonlyUsePortType[] = defaultCommonlyUsePortTypes) => {
  const [portCollection, setPortCollection] = useState<CommonlyUsePort[][]>([]);
  const [value] = useContext(ForwarderContext);
  useEffect(() => {
    Promise.all(
      types.map(tp => {
        return customsApi.doGetCommonlyUsePorts(tp);
      })
    )
      .then(setPortCollection)
      .catch(() => {});
  }, [types, value.followCountry]);

  return portCollection;
};

export const useForwarderHotPort = (type: 0 | 1) => {
  const [ports, setPorts] = useState<TCustomsPort[]>([]);
  useEffect(() => {
    customsApi
      .doGetHotPortsV2(type)
      .then(res => {
        if (res) {
          setPorts(res);
        }
      })
      .catch(() => {});
  }, [type]);
  return ports;
};

export default usePortListHook;
