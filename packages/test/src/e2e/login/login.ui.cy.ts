// import {ApiResposity} from "api";


// import {User} from "../../../cypress";
import {getUserInfo} from "@/support/e2e";
// import {globalTestAccounts} from "@/support/e2e";

describe('login_test', () => {
  it('login and jump to index', () => {
    // it('login_routine', () => {
    cy.on('uncaught:exception', () => {
      // cy.log('error caught', err);
      // debugger;
      return false
    });
    // const users: User[] = g; // 从环境变量中获取用户数据

    const user = getUserInfo(0);
    cy.log('accounts', user);
    // @ts-ignore
    // let baseUrl = Cypress.env['baseUrl'] as string;
    cy.visit('/login/'); //访问url
    const switchEl = cy.getByTestId('login-method-switch');  // 找到切换账密登录方式的按钮，默认扫码登录
    const tabEl = cy.getByTestId('sw-mail-login'); // 找到切换邮箱登录方式的按钮，默认手机号登录

    switchEl.click(); // 触发点击
    tabEl.click(); // 触发点击

    const accountEl = cy.getByTestId('account'); // 找到帐户输入框
    const pwdEl = cy.getByTestId('pwd'); // 找到密码输入框
    const loginBtEl = cy.getByTestId('bt-login-trigger'); // 找到登录按钮
    const loginPrEl = cy.get('[data-test-id="bt-protocol-checked"] .sirius-radio'); // 找到协议选项按钮
    accountEl.type(user.account); // 输入账号
    accountEl.blur();


    pwdEl.type(user.pwd); // 输入密码
    pwdEl.blur();
    loginPrEl.click();  // 点击确认协议
    loginBtEl.click();  // 点击登录

    cy.log('login finish operation', 'waiting result for user', user);
    // cy.wait(2000)
    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/'); // 验证登录后url跳转至正确的地址
    });
    // cy.location('pathname').should('eq', '/')

  });

})
