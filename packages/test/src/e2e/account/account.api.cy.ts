// import {ApiResposity} from "api";
// import {globalTestAccounts} from "@/support/e2e";

// import {LoginModel} from "api";
import {getUserInfo, loginSucc, validateUser} from "@/support/e2e";

describe('login_test', () => {
  it('command test: customer function', (done) => {
    cy.visit('http://su-desktop-web.office.163.com:9000/index.html?retrycount=10');
    cy.on('uncaught:exception', () => {
      // cy.log('error caught', err);
      // debugger;
      return false
    });
    const userInfo = getUserInfo(0);
    loginSucc(userInfo).then(()=>{
      return validateUser(userInfo)
    }).then(() => {
      done();
    });
  });
});
