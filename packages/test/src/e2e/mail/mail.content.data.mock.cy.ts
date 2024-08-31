import {FetchAccountByEmailApiRet, SystemEvent} from "api";
import {getUserInfo} from "@/support/e2e";

function parseReqJson(reqBody: any):Record<string,any> {
  let reqBodyJson = {};
  if (typeof reqBody === 'string') {
    reqBodyJson = JSON.parse(reqBody);
  } else if (typeof reqBody === 'object') {
    reqBodyJson = reqBody;
  }
  return reqBodyJson;
}

describe(
  "mail_test",
  () => {
    beforeEach(() => {
      cy.on('uncaught:exception', () => {
        return false
      });
      return cy.intercept('/js6/s*', (req) => {
        console.log('mail content req intercepted', req);
        const url = req.url;
        const funcPattern = /func=[a-zA-Z0-9]+(:|%3A)([a-zA-Z0-9]+)/.exec(url);
        const funcName = (funcPattern && funcPattern.length > 2) ? funcPattern[2] : null;
        const reqBody = req.body;
        let reqBodyJson;
        let contentFixtureName;
        if (funcName === 'readMessage') {
          reqBodyJson = parseReqJson(reqBody);
          if (reqBodyJson && reqBodyJson['id']) {
            contentFixtureName = 'mail/mail_content/'+reqBodyJson['id'];
          }
        } else if (funcName === 'getMessageInfos') {
          reqBodyJson = parseReqJson(reqBody);
          if(reqBodyJson && reqBodyJson['ids']
            // 检测reqBodyJson['ids']是否为数组
            && typeof reqBodyJson['ids'] === 'object' && Array.isArray(reqBodyJson['ids'])
            && reqBodyJson['ids'].length > 0
          ) {
            contentFixtureName = 'mail/mail_data/'+reqBodyJson['ids'][0];
          }
        }
        console.log('will serve intercept request with file ', contentFixtureName);
        if(contentFixtureName && contentFixtureName.length > 0) {
          req.reply({
            fixture: `${contentFixtureName}.json`,
          });
        }else {
          req.reply();
        }
      }).then(()=>{
        cy.login(getUserInfo(0));
      })
    });
    it('mail folder list test', function (done) {
      cy.visit('http://su-desktop-web.office.163.com:9000/index.html?retrycount=10');
      cy.on('uncaught:exception', () => {
        // cy.log('error caught', err);
        // debugger;
        return false
      });
      // cy.window().should('have.property', 'appReady', true);
      cy.window()
        .then((win) => {
          return cy.wrap(win.apiResposity.getEventApi().registerSysEventObserver).should('be.a', 'function').then(() => win);
        })
        .then((win) => {
          win.apiResposity.getEventApi().registerSysEventObserver('mailChanged', {
            name: 'ob-mail-mock-change',
            func: (data: SystemEvent) => {
              console.log(data);
            }
          });
          win.apiResposity.getEventApi().registerSysEventObserver('error', {
            name: 'ob-mail-mock2-change',
            func: (data: SystemEvent) => {
              console.log(data);
            }
          });
          return win;
        })
        .then((win) => {
          return cy.wrap(win.apiResposity.mailApiImpl.doGetMailContent).should('be.a', 'function').then(() => win);
        })
        .then((win) => {
          // 可以写成循环，测试所有ID
          return cy.wrap(win.apiResposity.mailApiImpl.doGetMailContent('1').then((res: FetchAccountByEmailApiRet) => {
            console.log('mail get content call return', res);
            return res;
          })).as('mailGetContentFetchPromise');
        })
        .then((res) => {
          cy.log('result of mail get content call', res);
          done();
        });
    });
  },
);
