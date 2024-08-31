/// <reference types="cypress" />
import {mount} from "cypress/react";
import {ApiResposity as IApiResposity, LoginApi as ILoginApi} from "api";

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.

declare global {
    namespace Cypress {
        interface Chainable {
            mount: typeof mount;
        }

        interface Chainable {

            login(): Chainable<Element>;

            getByTestId<E extends Node = HTMLElement>(value: string): Chainable<JQuery<E>>;

            getByTestIds(params: {selector: string[], index?: number}): Chainable<JQuery<HTMLElement>>;

            testIdChecked<E extends Node = HTMLElement>(value: string, value: boolean):Chainable<Subject>;

            runCommand(cmds: Record<number, ParsedCommand>): void;

            // readExcelCommand(fileName: string, sheetIndex?: number): Promise<Map<number, ParsedCommand> | undefined>;
        }
    }

    interface Window {
        apiResposity: ApiResposity;
    }
    interface LoginApi extends ILoginApi {}

    interface ApiResposity extends IApiResposity {}
}

export type ExcelRowHandler = (row: string[]) => Promise<number>;
export type User = {
    pwd: string;
    account: string;
};
export type UserAllData = Record<string, User[]>
export type ParsedCommand = {
    id: number,
    cmd: string,
    key: string,
    nextCmd?: number,
    args: string[]
}
export type ExcelInputFile = {
    fileName: string,
    sheetIndex?: number
}
