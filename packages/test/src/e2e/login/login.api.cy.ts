// import {ApiResposity} from "api";
// import {globalTestAccounts} from "@/support/e2e";

// import {LoginModel} from "api";
import {getUserInfo, loginSucc} from "@/support/e2e";

describe('login_test', () => {
  it('command test: customer function', () => {
    // cy.visit('http://su-desktop-web.office.163.com:9000/api_data_init.html?retrycount=10');
    cy.on('uncaught:exception', () => {
      // cy.log('error caught', err);
      // debugger;
      return false
    });
    loginSucc(getUserInfo(0));
  });
});
