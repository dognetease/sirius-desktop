// import {apiHolder as api,ErrMsgCodeMap} from '../../src/index';
// import {apis} from '../../src/config';
// import {LoginApi} from "../../src/api/logical/login";



describe("api factory test",function (){

    it("empty test",function (done){
        // const loginApi=api.api[apis.loginApiImpl] as LoginApi;
        // let promise = loginApi.doLogin("hahha","hhahah",ErrMsgCodeMap.prototype.COS_CANNOT_LOGIN);
        // promise.then((value)=>{console.log(value)});
        done();
    });

    // it("test login handler call",function (done){
    //     const loginApi=api.api[""] as LoginApi;
    //     let promise = loginApi.doLogin("hahha","hhahah",errMsgCodeMap.COS_CANNOT_LOGIN);
    //     promise.then((value)=>{console.log(value)});
    //     done();
    // });

    // it("test call",function (done){
    //     api.prototype.registerImpl(new ApiMock());
    //     let a = api.prototype.getApi();
    //     a.get("test",{}).then(value=>{console.log(value);}).catch(v=>{console.log(v);}).then(()=>done());
    //     // done();
    // })
});