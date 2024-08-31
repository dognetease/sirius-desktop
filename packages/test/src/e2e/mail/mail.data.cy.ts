import {FetchAccountByEmailApiRet, MailApi, MailBoxModel, MailModelEntries} from "api";
import {getUserInfo} from "@/support/e2e";

describe(
  "mail_test",
  () => {
    beforeEach(() => {
      cy.on('uncaught:exception', () => {
        // cy.log('error caught', err);
        // debugger;
        return false
      });

      return cy.login(getUserInfo(0));
    });
    it('mail folder list test', function (done) {
      cy.visit('http://su-desktop-web.office.163.com:9000/index.html?retrycount=10');
      cy.on('uncaught:exception', () => {
        // cy.log('error caught', err);
        // debugger;
        return false
      });
      cy.window().should('have.property', 'appReady', true);
      cy.window().then((win) => {
        return cy.wrap(win.apiResposity.mailApiImpl.doListMailBox).should('be.a', 'function').then(() => win);
        // cy.log('api got', mailApi.name);
        // cy.wrap(mailApi.doListMailBox().then((res:MailBoxModel[]) => {
        //
        //
        // }));
      }).then((win) => {
        // const accountApi = win.apiResposity.requireLogicalApi('accountApi') as AccountApi;
        return cy.wrap(win.apiResposity.mailApiImpl.doListMailBox().then((res: FetchAccountByEmailApiRet) => {
          console.log('mail list mailbox call return', res);
          return res;
        })).as('mailboxFetchPromise');
      }).then((res) => {
        expect(res).to.be.not.null;
        expect(res.length).to.greaterThan(0);
        done();
      });
    });
    it('mail folder list test', function (done) {
      cy.visit('http://su-desktop-web.office.163.com:9000/index.html?retrycount=10');
      cy.on('uncaught:exception', () => {
        // cy.log('error caught', err);
        // debugger;
        return false
      });
      cy.window().should('have.property', 'appReady', true);
      cy.window().then((win) => {
        return cy.wrap(win.apiResposity.mailApiImpl.doListMailBoxEntities).should('be.a', 'function').then(() => win);
        // cy.log('api got', mailApi.name);
        // cy.wrap(mailApi.doListMailBox().then((res:MailBoxModel[]) => {
        //
        //
        // }));
      }).then((win) => {
        // const accountApi = win.apiResposity.requireLogicalApi('accountApi') as AccountApi;
        return cy.wrap(win.apiResposity.mailApiImpl.doListMailBoxEntities({
          id: 1,
          count: 20,
          returnModel: true
        }).then((res: FetchAccountByEmailApiRet) => {
          console.log('mail list entry call return', res);
          return res;
        })).as('mailEntriesFetchPromise');
      }).then(() => {
        cy.get('@mailEntriesFetchPromise').should('be.not.null');
        cy.get('@mailEntriesFetchPromise').should('have.all.keys', ['data', 'total', 'index']);
        cy.get('@mailEntriesFetchPromise').its('data').should('be.an', 'array').and('have.length.greaterThan', 0);
        cy.get('@mailEntriesFetchPromise').its('data').each((mailEntry: MailModelEntries) => {
          expect(mailEntry).to.have.all.keys(['id', 'from', 'to', 'subject', 'date', 'size', 'isRead']);
        });
        done();
      });
    });
  },
);
