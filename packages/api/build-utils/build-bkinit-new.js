#!/usr/bin/env node
const shell = require('shelljs');
const { config } = require('env_def');

const isBuildWeb = config('build_for') === 'web';

if (isBuildWeb) {
  console.log('build bkinit done');
} else {
  const execCode = shell.exec('yarn workspace api build:bk_init').code;
  if (execCode !== 0) {
    process.exit(execCode);
  }
}
