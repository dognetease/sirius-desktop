const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const { call } = require('file-loader');
const distApiIndexPath = path.resolve(__dirname, './../../api/dist/index.js');
let hasBuildApiProject = false;
let hasFileAdded = false;

function getHasBuildApiProcess() {
  try {
    const cmd = `ps -a | grep 'cli.js workspace api build:devWebpack'`;
    const str = childProcess.execSync(cmd).toString();
    const psArr = (str && str.split('\n')) || [];
    console.log('ps array is ', psArr);
    const hasApiBuildProcess = psArr.find(str => {
      return str.includes('node_modules/yarn/lib/cli.js workspace api build:devWebpack');
    });
    if (hasApiBuildProcess) {
      return true;
    }
    return false;
  } catch (ex) {
    console.error(ex);
  }
}

class FastBuildWatchPlugin {
  constructor({ stage, isEdmWeb }) {
    this.isEdmWeb = isEdmWeb || false;
    const devApiIndexFile = this.isEdmWeb
      ? path.resolve(__dirname, './../../web-entry-wm/public/dev-api-index.js')
      : path.resolve(__dirname, './../public/dev-api-index.js');
    this.devApiIndexFile = devApiIndexFile;
    this.childProcess = null;
    this.stage = stage;
    this.isBuildHtml = this.stage && this.stage.includes('-html');
  }

  apply(compiler) {
    if (!hasBuildApiProject && this.isBuildHtml) {
      hasBuildApiProject = true;
      console.log(`stage is ${this.stage}, start add hooks`);
      const hasApiBuildProcess = getHasBuildApiProcess();
      if (!hasApiBuildProcess) {
        compiler.hooks.watchRun.tapPromise('FastBuildPluginBuildApi', async () => {
          const hasApiBuildProcess = getHasBuildApiProcess();
          if (hasApiBuildProcess) return Promise.resolve();
          console.log('[FastBuildPluginBuildApi]building api, please wait. Maybe need serveral seconds');
          return new Promise((resolve, reject) => {
            const cmdStr = this.isEdmWeb ? 'yarn workspace api build:devWebpackWm' : 'yarn workspace api build:devWebpack';
            console.log('[FastBuildPluginBuildApi]Command string is ' + cmdStr);
            this.childProcess = childProcess.exec(
              cmdStr,
              {
                cwd: path.join(__dirname, './../../api'),
                maxBuffer: 1024 * 1024 * 30,
              },
              (err, stdout, stderr) => {
                if (err) {
                  console.error(err);
                  return;
                }

                if (stdout) {
                  console.log(`[api dev build stdout] ${stdout.toString()}`);
                }

                if (stderr) {
                  console.log(`[api dev build stderr] ${stderr.toString()}`);
                }
              }
            );
            this.childProcess.stdout.on('data', chunk => {
              console.log(`[FastBuildPluginBuildApi stdout] ${chunk.toString()}`);
            });
            this.childProcess.stderr.on('data', chunk => {
              console.log(`[FastBuildPluginBuildApi stderr] ${chunk.toString()}`);
            });
            console.log('child process pid is ' + this.childProcess.pid);
            const timer = setInterval(() => {
              if (fs.existsSync(distApiIndexPath)) {
                clearInterval(timer);
                resolve();
              }
            }, 2000);

            this.childProcess.addListener('message', msgObj => {
              console.log(`[childProces] receive message`, msgObj);
              if (msgObj && msgObj.type) {
                switch (msgObj.type) {
                  case 'buildSuccess':
                    resolve();
                    break;
                  case 'buildFail':
                    reject(msgObj);
                    break;
                }
              }
            });
            process.on('exit', () => {
              try {
                console.log('[webFastBuild]close subprocess');
                this.childProcess.kill();
              } catch (ex) {
                console.error(ex);
              }
            });
          });
        });
      }
    }

    if (!this.isBuildHtml) {
      compiler.hooks.afterCompile.tapAsync('FastBuildPluginWatch', async (compilation, callback) => {
        // console.log('s'.repeat(50));
        // console.log(compilation);
        // console.log('s'.repeat(50));
        if (!hasFileAdded) {
          // if (!fs.existsSync(this.devApiIndexFile)) {
          //   throw new Error(`File: ${this.devApiIndexFile} not exist.`)
          // }
          // compilation.fileDependencies.add(this.devApiIndexFile);
          console.log(`FastBuildWatchPlugin add ${this.devApiIndexFile} to dependencies;`);
          hasFileAdded = true;
        }
        callback();
      });
    }
  }
}

module.exports = FastBuildWatchPlugin;
