#!/usr/bin/env node

const { config } = require('env_def');
const commandUtils = require('./command-utils/index');
const argvInfo = commandUtils.getCommandArgvInfo() || {};
const os = argvInfo.os || config('os');

const stage = config('stage');
const shell = require('shelljs');
const profile = config('profile');

function main() {
  const CMD_PREFIX = 'yarn workspace sirius-desktop ';

  if (stage !== 'prod') {
    if (os === 'mac') {
      // shell.exec(`${CMD_PREFIX} electron:buildMacM1Only`);
    }
    console.log(`only prod need build more package.`);
    return;
  }
  if (os === 'mac') {
    shell.exec(`${CMD_PREFIX} electron:buildMacM1Only`);
  } else if (os === 'win' || os === 'win32') {
    const isEdm = profile === 'edm_prod';
    if (!argvInfo.os) {
      shell.exec(isEdm ? `${CMD_PREFIX} electron:buildEdmWinUpdateOnly` : `${CMD_PREFIX} electron:buildWinUpdateOnly`);
    } else {
      let shellStr = '';
      if (isEdm) {
        shellStr += os === 'win' ? 'electron:buildEdmWinX64UpdateOnly' : os === 'win32' ? 'electron:buildEdmWin32UpdateOnly' : '';
      } else {
        shellStr += os === 'win' ? 'electron:buildWinX64UpdateOnly' : os === 'win32' ? 'electron:buildWinWin32UpdateOnly' : '';
      }
      if (!shellStr) {
        console.warn('unSupported os!!!');
        return;
      }
      console.log(`BuildMorePackage Command is ${shellStr}`);
      shell.exec(`${CMD_PREFIX} ${shellStr}`);
    }
  } else {
    console.warn(`${os} no more package need build.`);
  }
}

main();
