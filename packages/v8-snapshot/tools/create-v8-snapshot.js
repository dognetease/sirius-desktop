const fs = require('fs');
const vm = require('vm');
const childProcess = require('child_process');
const path = require('path');
const {
  getCmdLineOptions, getAbsolutePath, log, getPlatformAndArch
} = require('./utils');

function checkSnapshotJS(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('filePath does not exist');
  }
  log(`Check snapshot file ${filePath}`);
  const scriptFileContent = fs.readFileSync(filePath, 'utf-8');
  vm.runInNewContext(scriptFileContent, undefined, { displayErrors: true, filename: filePath });
  log(`Check result: successed，file '${filePath}' can snapshot.`);
}

function generateStartUpBlob(snapshotJsPath, outputPath, options) {
  log(`Generating startup blob in ${outputPath}`);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const optionsArr = options ? Object.keys(options).reduce((prevValue, key) => {
    prevValue.push(key);
    prevValue.push(options[key]);
  }, []) : [];

  const exeFilePath = path.resolve(__dirname, './../node_modules/.bin/mksnapshot' + (process.platform === 'win32' ? '.cmd' : ''));
  const exeOptions = [snapshotJsPath, '--output_dir', outputPath, ...optionsArr];

  childProcess.execFileSync(exeFilePath, exeOptions);

  log('Generate startup blob successfully!');
}
function main() {
  const options = getCmdLineOptions({
    'input-file': './src/index.js',
    'output-path': './snaphots/'
  });
  const platformAndArch = getPlatformAndArch(options.platform, options.arch);
  const inputFilePath = getAbsolutePath(options['input-file']);
  const outPutPath = getAbsolutePath(options['output-path']);
  const paltformOutputPath = path.resolve(outPutPath, platformAndArch);

  checkSnapshotJS(inputFilePath);
  generateStartUpBlob(inputFilePath, paltformOutputPath);
}

main();
