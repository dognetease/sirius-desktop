// import {api, commonMessageReturn, intBool} from "../../api/api";
// // import {urls} from "../../config";
// import {
//     LoginApi, LoginModel,
//     RequestLoginData,
//     RequestPreLoginData,
//     ResponseLoginData,
//     ResponsePreLoginData
// } from "../../api/logical/login";
//
// class LoginApiMockImpl implements LoginApi {
//     // impl: DataApi;
//     name: string;
//
//     constructor() {
//         // this.impl = api.prototype.getApi();
//         this.name = "loginMockApi"
//     }
//
//     doOpenConfigPage(): commonMessageReturn {
//         return "";
//     }
//
//     preLogin(req: RequestPreLoginData): Promise<ResponsePreLoginData> {
//         const node = req.domain;
//         return Promise.resolve({
//             node: node,
//             err: false
//         });
//     }
//
//
//     login(req: RequestLoginData): Promise<ResponseLoginData> {
//         const errCode = req.mockErrCode || "";
//         return Promise.resolve({
//             nickname: req.account_name,
//             errMsg: errCode
//         } as ResponseLoginData);
//     }
//
//     doLogin(account: string, pwd: string, mockErrCode?: string): Promise<LoginModel> {
//         return this.login({
//             account_name: account,
//             passtype: 1,
//             password: pwd,
//             hl: "zh_CN",
//             all_secure: 1,
//             secure: 1,
//             deviceid: "",
//             domain: "",
//             p: "sirius-desktop",
//             support_verify_code: 1,
//             mockErrCode: mockErrCode
//         }).then((res: ResponseLoginData) => {
//             return {errmsg: res.errMsg as commonMessageReturn, pass: true}
//         });
//     }
//
//     doListLoginAccount(): Promise<Partial<RequestLoginData>[]> {
//         return Promise.resolve([]);
//     }
//
//     doOpenForgetPwdUrl(): commonMessageReturn {
//         return "";
//     }
//
//     doOpenPromptPage(): commonMessageReturn {
//         return "";
//     }
//
//     doPreLogin(account: string): Promise<String | undefined> {
//         return Promise.resolve(account);
//     }
//
//     doLoginWithCode(code: string, needPersist?: intBool): Promise<LoginModel> {
//         console.log(code + " " + needPersist);
//         return Promise.resolve({errmsg: code as commonMessageReturn, pass: true});
//     }
//
//     doSendVerifyCode(): Promise<string> {
//         return Promise.resolve("");
//     }
//
//     doLogout(): Promise<commonMessageReturn> {
//         return Promise.resolve("");
//     }
// }
//
// const init = function () {
//     const loginApiImpl = new LoginApiMockImpl();
//     api.registerLogicalApi(loginApiImpl);
//     return loginApiImpl.name;
// }
// // init();
// const name = init();
// export default name;
