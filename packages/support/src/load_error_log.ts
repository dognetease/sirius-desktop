#!/usr/bin/env node

import sade from 'sade';
import * as http from 'http';
import * as cheerio from 'cheerio';
import path from 'path';
import * as fs from 'fs-extra';
// import { wait } from 'api';
// import { ElementOperation } from 'api';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export type HtmlTransfer = (el: Element) => ElementOperation;

export type HtmlOperation = 'remove' | 'replace' | 'wrapAndReplace' | 'append' | 'prepend' | 'none';

export type Protocol = 'http' | 'https' | 'file';
export type ResultContent = {
  title: string;
  brief: string;
  content: string;
  url: string;
  origin: string;
};
export type URLParsed = {
  url: string;
  protocol: Protocol;
  domain: string;
  port: number;
  path: string;
  query: string;
  hash: string;
};

export interface ElementOperation {
  op: HtmlOperation;
  el?: Element;
  newEl?: Element[];
}

// const walkElementTree = (parent: Element, handler: (el: Element) => void) => {
//   if (parent.children && parent.childElementCount > 0) {
//     for (let k in parent.children) {
//       if (parent.children.hasOwnProperty(k) && parent.children[k]) {
//         let el: Element | undefined = parent.children[k];
//         handler(el);
//         if (el)
//           walkElementTree(el, handler);
//       }
//     }
//   }
//
// };
const urls: Map<string, boolean> = new Map<string, boolean>();
let indexUrl: string | undefined = undefined;
const crawlerResult: ResultContent[] = [];
const prog = sade('crawler <value> [conf]', true);
const processHomeDir = process.cwd();

async function handleContentHtml(url: string, body: string) {
  urls.set(url, true);
  const $$ = cheerio.load(body);
  // console.log(body);
  const title = $$('#topbox .title').text();
  const brief = $$('.contentbox .abstract .txt').text();
  const content = $$('#ContentBody').text();
  const result = { title, brief, content, origin: body, url };
  // console.log('---------------------\n', result);
  crawlerResult.push(result);
  await wait(1000);
  // await writeResult({ indexUrl: url, crawlerResult });
}

async function handleIndexHtml(url: string, body: string) {
  console.log('handle url ' + url);
  const $$ = cheerio.load(body);
  const urlList: string[] = [];
  $$('a').each((it, obj) => {
    const href = obj.attribs['href'];
    console.log(it + ' ', href);
    if (/http:\/\/finance.eastmoney.com\/a\/[0-9]+\.html/i.test(href)) {
      let needHandle = false;
      if (!urls.has(href)) {
        urls.set(href, false);
        needHandle = true;
      } else {
        const parsed = urls.get(href);
        if (!parsed) {
          needHandle = true;
        }
      }
      if (needHandle) {
        urlList.push(href);
      }
    }
  });
  console.log(urlList);
  for (let newUrl of urlList) {
    await getUrlContent(newUrl, handleContentHtml);
  }
  await writeResult({ indexUrl: url, crawlerResult });
}

async function getUrlContent(url: string, handler: (url: string, body: string) => void) {
  await http.get(url, async (res: http.IncomingMessage) => {
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (data: any) => {
      body += data;
    });
    res.on('end', async () => {
      await handler(url, body);
      // body = JSON.parse(body);
      // const parser: DOMParser = new DOMParser();
      // const document = parser.parseFromString(body, 'text/html');
      // walkElementTree(document.documentElement,(el)=>{
      //   const tagName = el.tagName.toLowerCase();
      //   if(tagName=='a'){
      //     console.log(el.getAttribute("href"));
      //   }
      // })

      // console.log()
      // console.log(body);
    });
  });
}

async function writeResult(contents: Object, fileName?: string) {
  let fpos: string;
  fpos = fileName || 'crawlerResult' + Date.now() + '.json';
  if (fpos && fpos.length > 0) {
    const file = path.join(processHomeDir, fpos);
    console.log('write evn file to ' + file);
    return fs.outputFile(file, JSON.stringify(contents));
  } else {
    return Promise.resolve();
  }
}

prog
  .version('1.0.0')
  .describe('crawler web page and run parse and analyze')
  .example('crawler url [options]')
  .action(async (value: string, opts?: any) => {
    console.log('running dir and script:', processHomeDir, __filename);
    console.log('opts', opts);
    // const https = require("https");
    // const url = value;
    await getUrlContent(value, handleIndexHtml);
  });

prog.parse(process.argv);
