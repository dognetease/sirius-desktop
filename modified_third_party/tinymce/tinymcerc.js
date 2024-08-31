
const fs = require('fs');
const path = require('path');
const UglifyJS = require('uglify-js');

const copyDir = (copySrc, copyDest) => {
  return new Promise((resolve, reject) => {
    let copyFileCount = 0;
    const copy = (copySrc, copyDest) => {
      fs.readdir(copySrc, {}, (err, files) => {
        if (err) {
          reject(err);
          return console.log('err', err);
        }
        copyFileCount += files.length;
        files.forEach(file => {
          const fileResolve = path.resolve(copySrc, file);
          const fileDestResole = path.resolve(copyDest, file);
          fs.stat(fileResolve, (err, stats) => {
            if (err) {
              reject(err);
              return console.log('err', err);
            }
            if(stats.isDirectory(fileResolve)) {
              if (file !== 'node_modules') {
                fs.mkdirSync(fileDestResole, { recursive: true });
                copy(fileResolve, fileDestResole);
              }
              copyFileCount--;
              if (copyFileCount === 0) resolve();
            } else if(stats.isFile(fileResolve)) {
              fs.readFile(fileResolve, 'utf8', (err, data) => {
                if (!err) {
                  var result = data;
                  if (file.endsWith('plugin.js') || file.endsWith('theme.js') || file.endsWith('tinymce.js')) {
                    result = UglifyJS.minify(data).code;
                  }
                  fs.writeFile(fileDestResole, result, () => {
                    copyFileCount--;
                    if (copyFileCount === 0) resolve();
                  });
                } else {
                  reject(err);
                }
              })
            }
          })
        })
      })
    }
    fs.access(copyDest, (err) => {
      if (err) {
        fs.mkdirSync(copyDest, { recursive: true });
      }
      copy(copySrc, copyDest);
    })
  })
}

module.exports = () => {
  const orgPath = path.join(__dirname, '../tinymce');
  const destPath = path.resolve('./public/tinymce-min-27.5');
  console.log('orgPathorgPath', destPath)
  return copyDir(orgPath, destPath);
}

