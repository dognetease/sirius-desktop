import {UserAllData} from "../../../../cypress";

describe('login_test', () => {
  it('env test:get basePath', () => {
    const basePath = Cypress.env('basePath');
    cy.log('base path is :', basePath);
  });
  it('env test: get user', () => {
    const profile = Cypress.env('profile') as string;
    const userAllData = Cypress.env('userData') as UserAllData;
    cy.log('data', profile);
    cy.log('user data', userAllData);
  });
});
