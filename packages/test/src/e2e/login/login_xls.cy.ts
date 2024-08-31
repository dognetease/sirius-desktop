// import {ApiResposity} from "api";


// import {User} from "../../../cypress";
// import {globalTestAccounts} from "@/support/e2e";

import {ParsedCommand} from "../../../cypress";

describe('login_test', () => {
    it('login and jump to index', () => {
        // it('login_routine', () => {
        cy.on('uncaught:exception', (err) => {
            // cy.log('error caught', err);
            // debugger;
            return false
        });

        cy.task('readExcel', {fileName: 'command/cmd3.xlsx', sheetIndex: 1}).then(data => {
            cy.log('read data', JSON.stringify(data));
            cy.runCommand(data as Record<number, ParsedCommand>);
        });
        cy.log('nothing to do');

    });

})
