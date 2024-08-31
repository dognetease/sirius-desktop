import {defineConfig} from 'cypress';
import * as path from 'path';

import {config} from 'env_def';
import PluginEvents = Cypress.PluginEvents;
import PluginConfigOptions = Cypress.PluginConfigOptions;
import fs from "fs";
import {readExcel} from "./node_src/parser";
import {ExcelInputFile} from "./cypress";

const profile = config('profile');

let basePath = path.resolve(__dirname);

function setupStaticData(config: Cypress.PluginConfigOptions) {
    const filename = path.resolve(basePath, 'fixtures/data/users.json');
    const text = fs.readFileSync(filename, 'utf8');
    const userData = JSON.parse(text);
    console.log('load user data:{}', userData);
    config.env.userData = userData;
}

function setupTaskFunc(on: PluginEvents) {
    on('task', {
        'readExcel': (file:ExcelInputFile) => {
            file.fileName=path.resolve(basePath,file.fileName);
            return readExcel(file);
        }
    });
}

export default defineConfig({
    fixturesFolder: "fixtures",
    screenshotsFolder: "content/screenshots",
    videosFolder: "content/videos",
    downloadsFolder: "content/downloads",
    viewportHeight: 800,
    viewportWidth: 1280,
    env: {
        profile,
        basePath: basePath,
        // baseUrl: 'https://su-desktop-web.cowork.netease.com:8000/',
    },
    e2e: {
        baseUrl: 'https://su-desktop-web.cowork.netease.com:8000/',
        supportFile: 'src/support/e2e.ts',
        specPattern: 'src/e2e/**/*.cy.ts',
        setupNodeEvents: (on: PluginEvents, config: PluginConfigOptions) => {
            setupStaticData(config);
            setupTaskFunc(on);
            return config;
        }
    },
})
