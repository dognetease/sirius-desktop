#!/usr/bin/env node
// import fetch from 'node-fetch';
// const fetch = import('node-fetch');
const shell = require('shelljs');
// const { config } = require('env_def');
const { def } = require('support');
// const https = require('https');
const axios = require('axios');

console.log('process args:', process.argv);
// shell.echo('hello world done');
const profile = process.argv[2] || 'test';
const defElement = def[profile];
console.log('profile settings:', defElement);
const { stage, version } = defElement;
const osStr = process.argv[3] || 'mac-win-win32';
const oses = osStr.split('-');
const operation = process.argv[4] || 'build-upload';
const branch = shell.exec('git rev-parse --abbrev-ref HEAD').toString();
const commitSHA = shell.exec('git rev-parse --verify HEAD').toString();
// const version = defElement;
console.log('build operation:', operation, ' git branch:', commitSHA, ' git branch:', branch, ' app version:', version);
shell.mkdir('-p', './releases-' + stage);
const artifacts = [
  'sirius-desktop-mac-x64-' + version + '.dmg',
  'sirius-desktop-mac-x64-' + version + '.zip',
  'sirius-desktop-mac-arm64-' + version + '.dmg',
  'sirius-desktop-mac-arm64-' + version + '.zip',
  'sirius-desktop-win-x64-' + version + '.exe',
  'sirius-desktop-win-ia32-' + version + '.exe'
];
// const profile = config('profile');

console.log('-------------------stage clean:--------------------');
console.log('build for ', profile, '-', stage);
if (operation.indexOf('clean') >= 0) {
  shell.rm(artifacts);
  console.log('finish clean ');
}
console.log('-------------------stage build:--------------------');
if (operation.indexOf('build') >= 0) {
  console.log('-------------------stage prepare:--------------------');
  shell.exec('yarn install');
  shell.exec('yarn workspace sirius-desktop delete:temp');
  oses.forEach(os => {
    shell.exec('yarn clean');
    shell.exec('yarn workspace env_def build ' + stage + ' ' + os);
    shell.exec('yarn build:app');
    console.log('finished build ', stage, ' ', os, ' success');
  });
}
// console.log(typeof fetch);
if (operation.indexOf('upload') >= 0) {
  axios.get('https://www.bing.com/').then(res => {
    console.log(`状态码: ${res.statusCode}`);
    console.log(res);
  });
}
