import {apiHolder as api} from "../../src/index";
import {
    SystemApi
    // ,SystemEvent
} from "../../src";
// import {User} from "../../dist";
describe("system api test",function (){

    // it("test open window",function (done){
    //     let systemApi = api.api.getSystemApi() as SystemApi;
    //     let ret = systemApi.openNewWindow("http://bing.com");
    //     console.log("result: "+ret);
    //     done();
    //
    // });
    //
    // it("test event send",function (done){
    //     let systemApi = api.api.getSystemApi() as SystemApi;
    //     let commonMessageReturnPromise = systemApi.sendSysEvent({
    //         eventName:"login",
    //         eventData:{
    //             nickName:"test",
    //             avatar:"",
    //             lastLoginTime:new Date().getTime(),
    //             sessionId:"ttt",
    //             id:"12233124"
    //         } ,
    //         eventSeq:0,
    //         eventType:"event"
    //     } as SystemEvent);
    //     if(commonMessageReturnPromise) {
    //         commonMessageReturnPromise
    //             .then((ev) => {
    //                 console.log("got result:" + ev)
    //             })
    //             .then(() => {
    //                 console.log(systemApi.getCurrentUser());
    //             })
    //             .then(() => {
    //                 done()
    //             })
    //     }else{
    //         console.log("error");
    //     }
    //     ;
    // });

    it("test md5",function (done){
        let systemApi = api.api.getSystemApi() as SystemApi;
        const ret=systemApi.md5("Qiyetest1");
        console.log(ret);
        done();
    });

    it("test encrypt",function (done){
        let systemApi = api.api.getSystemApi() as SystemApi;
        systemApi.encryptMsg("123456").then((ret)=>{
            console.log(ret);
            return ret;
        }).then((ret)=>{
            return systemApi.decryptMsg(ret);
        }).then((ret)=>{
            console.log(ret);
        }).then(()=>{done();});

    })


})