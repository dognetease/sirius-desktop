//
// import api, {Api, ApiRequestConfig, ApiResponse, HttpTransMethod} from "../../../api/api";
// import {wait} from "../../../api/util";
//
// class MockDataTransImpl implements Api {
//
//     name: string ="dataMockApi";
//
//     constructor() {
//     }
//
//     request(url: string, method: HttpTransMethod, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
//         config = config || {url: url, method: method, data: data};
//         if (!config.data) {
//             if (data) config.data = data;
//         }
//         const span = config.timeout || 1000;
//         const res = config.mockData || "";
//         return new Promise<ApiResponse>((r: (value: any) => void, j: (reason?: any) => void) => {
//             wait(span)
//                 .then(() => r(
//                     {
//                         config: config,
//                         data: res,
//                         status: 200,
//                         statusText: "ok",
//                         headers: {}
//                     }
//                 ))
//                 .catch(
//                     () => j("never happend")
//                 );
//             return;
//         });
//     }
//
//     delete(url: string, config?: ApiRequestConfig): Promise<ApiResponse> {
//         return this.request(url, "delete", {}, config);
//     }
//
//     get(url: string, config?: ApiRequestConfig): Promise<ApiResponse> {
//         return this.request(url, "get", {}, config);
//     }
//
//     head(url: string, config?: ApiRequestConfig): Promise<ApiResponse> {
//         return this.request(url, "head", {}, config);
//     }
//
//     options(url: string, config?: ApiRequestConfig): Promise<ApiResponse> {
//         return this.request(url, "options", {}, config);
//     }
//
//     patch(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
//         return this.request(url, "patch", data, config);
//     }
//
//     post(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
//         return this.request(url, "post", data, config);
//     }
//
//     put(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
//         return this.request(url, "put", data, config);
//     }
//
//     buildUrl(url: string, req: any): string{
//         return url+req;
//     }
//
// }
//
// export const init=function() {
//     let mockImpl = new MockDataTransImpl();
//     api.prototype.registerDataTransApi(mockImpl);
//     return mockImpl.name;
// }
//
// const name=init();
// export default name;
