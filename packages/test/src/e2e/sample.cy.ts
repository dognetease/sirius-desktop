describe('login_test', () => {
    it('env test:get basePath', () => {
        const basePath = Cypress.env('basePath');
        cy.log('base path is :', basePath);
    });
    it('command test: customer function', () => {
        cy.login();
        
    });
});
