/**
 * 主要是更新yaml里面的url信息
 */
const constant = require('./const');
const path = require('path');
const jsYAML = require('js-yaml');
const fs = require('fs');
const utils = require('./utils');

/**
 * 通过fileName获取，依赖文件生成规则，不稳定，所以需要细检查，强报错
 * @param {string} fileName
 */
function getPlatformArchVersion(fileName) {
  let extDotIndex = fileName.lastIndexOf('.');
  if (extDotIndex < 0) {
    throw new Error(`file ext not found!`);
  }

  let fileNameWithoutExt = fileName.substring(0, extDotIndex);
  const productName = `sirius-desktop-`;
  let namePartArr = fileNameWithoutExt.replace(productName, '').split('-');

  if (!namePartArr || namePartArr.length !== 3) {
    throw new Error(`namePartArr is null or length is not 3`);
  }

  return {
    platform: namePartArr[0],
    arch: namePartArr[1],
    version: namePartArr[2],
  };
}

/**
 *
 * @param {string} ymlFilePath
 * @param {string} fileName
 * @param {string} CDNUrl
 */
function updateYMLFileWithCDNUrl(ymlFilePath, fileName, CDNUrl) {
  let ymlInfo = jsYAML.load(fs.readFileSync(ymlFilePath, { encoding: 'utf-8' }, { json: true }).toString());
  const files = ymlInfo.files;
  console.log(ymlInfo);

  files.forEach(item => {
    if (item.url === fileName) {
      item.url = CDNUrl.replace('"', '').replace('"', '');
    }
  });

  const newYMLFileContent = jsYAML.dump(ymlInfo, {
    lineWidth: -1,
  });
  fs.writeFileSync(ymlFilePath, newYMLFileContent);

  console.log(`WriteYMLFile to ${ymlFilePath}`);
}

function main() {
  console.log(`-`.repeat(40));
  console.log(`update yaml file start....`);
  const fileName = process.argv[2];
  const CDNUrl = process.argv[3];

  console.log(`FileName: ${fileName}`);
  console.log(`CDNUrl: ${CDNUrl}`);

  if (!fileName || !CDNUrl) {
    throw new Error(`fileName or CDNUrl is null or empty!`);
  }

  const buildInfo = getPlatformArchVersion(fileName);

  const ymlFilePath = utils.getYMLFilePathByBuildInfo(buildInfo);
  if (!fs.existsSync(ymlFilePath)) {
    throw new Error(`YMLFile '${ymlFilePath}' not exist...`);
  }

  updateYMLFileWithCDNUrl(ymlFilePath, fileName, CDNUrl);

  console.log(`update yaml file end....`);
  console.log(`-`.repeat(40));
}

main();
