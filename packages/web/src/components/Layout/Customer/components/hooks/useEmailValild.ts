import { apiHolder, apis, CustomerApi, conf } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

export default () => {
  const validTableEmail = async (params: any) => {
    let res = await clientApi.checkEmailValid(params);
  };
  return {
    validTableEmail,
  };
};
