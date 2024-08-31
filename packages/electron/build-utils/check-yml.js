const fs = require('fs');
const path = require('path');
const commandUtils = require('./command-utils/index');
const jsYAML = require('js-yaml');
const shelljs = require('shelljs');
const crypto = require('crypto');

function main() {
  let argvInfo = commandUtils.getCommandArgvInfo();
  if (argvInfo.filePath) {
    let filePath = path.resolve(__dirname, argvInfo.filePath);
    getFileSha512Async(filePath).then(res => {
      console.log(`sha512 is ${res}`);
    });
    return;
  }

  if (!argvInfo || !argvInfo.ymlPath) {
    throw new Error(`ymlPath argv not found`);
  }

  let ymlFilePath = path.resolve(__dirname, argvInfo.ymlPath);
  if (!fs.existsSync(ymlFilePath)) {
    throw new Error(`${ymlFilePath} not exist!`);
  }

  let ymlInfo = jsYAML.load(fs.readFileSync(ymlFilePath, { encoding: 'utf-8' }, { json: true }).toString());

  let files = ymlInfo.files;
  files.forEach(async file => {
    let fileUrl = file.url;
    let sha512InYML = file.sha512;
    if (!fileUrl || !sha512InYML) {
      throw new Error(`fileUrl: ${fileUrl}, sha512: ${sha512InYML} is null or empty!`);
    }
    let extName = fileUrl.substr(fileUrl.lastIndexOf('.'));
    let downloadFileName = `.temp/${new Date().getTime()}${extName}`;
    let cmd = `curl -o ${downloadFileName} ${fileUrl}`;
    console.log(`exec command: ${cmd}`);
    shelljs.exec(cmd);
    let fileSha512 = await getFileSha512Async(path.resolve(__dirname, downloadFileName));
    console.log(`FileUrl sha512 is "${fileSha512}"`);
    if (fileSha512 !== sha512InYML) {
      throw new Error(`sha512InYML is "${sha512InYML}" not equal!!!`);
    } else {
      console.log(`sha512 is ok!`);
    }
  });
}

function getFileSha512Async(filePath) {
  return new Promise((resolve, reject) => {
    try {
      let readStream = fs.createReadStream(filePath);
      let hasher = crypto.createHash('sha512');
      readStream.on('readable', () => {
        const data = readStream.read();
        if (data) {
          hasher.update(data);
        } else {
          let fileSha512 = hasher.digest('base64');
          resolve(fileSha512);
        }
      });
    } catch (ex) {
      reject(ex);
    }
  });
}

try {
  main();
} catch (ex) {
  console.error(ex);
}
