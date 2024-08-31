import { obfuscate, ObfuscatorOptions } from 'javascript-obfuscator';
import { dataStore, envType } from './conf';

export class Set {
  [k: string]: 1;

  constructor(props: string[]) {
    props.forEach(x => {
      this[x] = 1;
    });
  }
}

// const buildConfFunc: (data: dataStore) => (type: string, generate?: string) => string | string[] = function (data) {
// const data: dataStore = {};
// const seq = data['globalSeq'] as string[];
// const charSeq = '';
// @ts-ignore
const target = require('./algo').default;

export const genSrc: (data: dataStore, env: envType) => string[] = function (data, env) {
  const obfuscator: ObfuscatorOptions = {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,
    debugProtectionInterval: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: false,
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: false,
    shuffleStringArray: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 9,
    stringArray: true,
    stringArrayIndexShift: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 1,
    unicodeEscapeSequence: false,
    sourceMap: true,
    sourceMapFileName: (data.fname + '.html.map') as string,
    sourceMapMode: 'separate',
    stringArrayEncoding: ['rc4', 'base64'],
    target: 'browser-no-eval',
    domainLock: [],
  };
  if (env !== 'dev' && data.build_for === 'web') {
    // TODO: add self defined protocol to ensure domain protection
    // obfuscator.domainLock!.push(data["host"] as string);  //for electron use file:// and we use ssr which can't tell host
  }
  // if(env=='dev'){
  //     obfuscator.sourceMapMode='inline';
  // }
  const mainFunc = target.toString();
  console.log('---mainfunc---', mainFunc.length);
  const dtVar = JSON.stringify(data);
  const seq = data.globalSeq as string[];
  const charSeq = seq.join('');
  const src: string = `                
                var data=${dtVar};
                var charSeq='${charSeq}';
                var confFunc=${mainFunc};                  
    `;
  // console.log(obfuscator);
  // console.log(src);
  const obfuscatedCode = obfuscate(src, obfuscator);
  // console.log(obfuscatedCode.getSourceMap());
  return [obfuscatedCode.getObfuscatedCode(), obfuscatedCode.getSourceMap()];
};
