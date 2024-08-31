import {ExcelRowHandler, ParsedCommand, User, UserAllData} from "../../cypress";
import "cypress-real-events";

// import {readExcel} from "@/support/command/parser";

// const testUserData = {
//     "desc": "test user account",
//     "local": [
//     {
//         "pwd": "Qiyetest2",
//         "account": "dd14@lx.elysys.net"
//     }
// ]
// }

const getUserInfo = () => {
      const profile = Cypress.env('profile') as string;
    const userAllData = Cypress.env('userData') as UserAllData;

    const datum: User[] = userAllData[profile] as User[];
    return datum;
//     globalTestAccounts.push(...datum);
}

const login = (api: ApiResposity) => {
  const loginApi = api.requireLogicalApi('loginApi') as LoginApi;
  
  const users: User[] = getUserInfo(); // 从环境变量中获取用户数据
  const user = users[0];
  cy.wrap(loginApi.doLogin({...user})).then((res) => {
    if((res as {pass: boolean}).pass) {
      cy.log('login called');
      cy.visit('/');
      cy.url().should('include', '/#mailbox');
      // cy.reload(true);
      // cy.url().should('include', '/#mailbox').then(() => {
      //   cy.trigger('logined');
      //   cy.window().then(win => {
      //     const eventApi = win.apiResposity.getEventApi();
      //     eventApi.sendSysEvent({
      //       eventName: 'initModule',
      //       eventStrData: 'account',
      //     });
      //   })
      // })
    } else {
      cy.pause();
    }
  });
};

Cypress.Commands.add('login', () => {
  cy.session('user', () => {
    cy.visit('/login/').then(() => {
      cy.url().should('include', '/login').then(() => {
        cy.window().then(win => {
          login(win.apiResposity);
        })
      })
    });
  })
});
Cypress.Commands.add('getByTestId', (value: string) => {
    return cy.get(`[data-test-id=${value}]`)
});
Cypress.Commands.add('testIdChecked', (key: string, value: boolean) => {
  return cy.get(`[data-test-id=${key}]`).should('have.attr', 'data-test-check', value);
});
Cypress.Commands.add('getByTestIds', (params: {selector: string[], index?: number}) => {
  const {selector: selectors, index} = params;
  const selector = selectors.map(item => `[data-test-id=${item}]`).join(' ');
  const element = cy.get<HTMLElement>(selector);
  if(index !== undefined) {
    return element.eq<HTMLElement>(index);
  }
  return element;
});
// cy.getByTestIds({selector: ['contact_tree', 'tree_personalRoot_addIcon_personalOrg'],index: 2})
Cypress.Commands.add('runCommand', (cmds: Record<number, ParsedCommand>) => {
    let pc = 1;
    let jump = 0;
    while (true) {
        const cmd = cmds[pc];
        if (!cmd) break;
        if (cmd.cmd === 'click') {
            cy.getByTestId(cmd.key).click();
        } else if (cmd.cmd === 'clickSp') {
            cy.get(cmd.key).click();
        } else if (cmd.cmd === 'type') {
            cy.getByTestId(cmd.key).type(cmd.args[0]).blur();
        }else if (cmd.cmd === 'typeSp') {
            cy.get(cmd.key).type(cmd.args[0]).blur();
        } else if (cmd.cmd === 'visit'){
            cy.visit(cmd.key);
        }
        if (jump > 0) {
            pc = jump;
        } else if (cmd.nextCmd && cmd.nextCmd > 0) {
            pc = cmd.nextCmd
        } else {
            pc += 1;
        }
    }
    return;
});

// Cypress.Commands.add('readExcelCommand', (fileName: string, sheetIndex?: number) => {
//     debugger
//     return readExcel(fileName, sheetIndex);
// })

// export const globalTestAccounts: User[] = [];

// beforeEach(() => {
//     cy.log('start test!!');
//     const profile = Cypress.env('profile') as string;
//     const userAllData = Cypress.env('userData') as UserAllData;

//     const datum: User[] = userAllData[profile] as User[];
//     globalTestAccounts.push(...datum);
//     cy.on('uncaught:exception', (err) => {
//       // cy.log('error caught', err);
//       // debugger;
//       return false
//    });
//     cy.login();
//     // cy.fixture('data/users.json').then((user: any) => {
//     //     const profile = Cypress.env('profile') as string;
//     //     if (profile && this !== undefined && user[profile])
//     //         globalTestAccounts.push(...user[profile]);
//     // });
// })
