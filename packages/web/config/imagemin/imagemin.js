const imagemin = require('imagemin');
const fs = require('fs');
const colors = require('colors');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminSvgo = require('./imagemin-svgo');

const runImagemin = async originPaths => {
  const infos = {};
  const paths = [];
  originPaths.forEach(path => {
    try {
      const stat = fs.statSync(path);
      // console.log(stat.size);
      infos[path] = {
        size: stat.size,
      };
      paths.push(path);
    } catch {
      // 什么也不做
    }
  });

  const files = await imagemin(paths, {
    // destination: testUrl, // 写入原文件
    plugins: [
      imageminJpegtran(),
      imageminPngquant({
        quality: [0.6, 0.8],
      }),
      imageminSvgo({
        plugins: [
          {
            name: 'removeViewBox',
            // active: false
          },
          {
            name: 'removeEmptyAttrs',
            active: false,
          },
        ],
      }),
      imageminGifsicle(),
    ],
  });

  // console.log(files);
  files.forEach(file => {
    try {
      fs.writeFileSync(file.sourcePath, file.data, {
        encoding: 'utf-8',
        flag: 'w',
      });
      // console.log(colors.bgGreen(`
      //   压缩成功之后的大小：${file.data.length}
      // `));
      infos[file.sourcePath].current = file.data.length;
    } catch (err) {
      console.log(
        colors.bgRed(`
        压缩失败，请注意手动替换！！！path: ${file.sourcePath}
      `)
      );
    }
  });

  let str = '';
  let total = 0;
  Object.keys(infos).forEach(key => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    if (infos[key] && infos[key].current) {
      str += `
        ${key} : ${infos[key].size} -> ${infos[key].current}
      `;
      total += infos[key].size - infos[key].current;
    }
  });
  console.log(colors.bgGreen('压缩成功，如下：\n'), colors.green(str));
  console.log(colors.bgGreen(`总压缩大小：${total}`));
};

module.exports = runImagemin;

// 以下是测试
// runImagemin([
//   '/Users/zhangbinbinb28199/workspace/code/sirius-desktop/sirius-desktop/packages/web/src/images/icons/edm/statistics1.svg',
//   '/Users/zhangbinbinb28199/workspace/code/sirius-desktop/sirius-desktop/packages/web/src/images/icons/edm/yingxiao/1.png',
//   '/Users/zhangbinbinb28199/workspace/code/sirius-desktop/sirius-desktop/packages/web-edm/src/components/SendSuccessPage/aiHostingGuide.gif'
// ]);
