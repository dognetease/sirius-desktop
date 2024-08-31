/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const docgen = require('react-docgen-typescript');

const options = {
  savePropValueAsString: false,
  shouldExtractLiteralValuesFromEnum: true,
  propFilter: prop => {
    if (prop.parent.fileName.indexOf('node_modules') !== -1) {
      return false;
    }
    return true;
  },
};
const createCompDes = compFileName => {
  const filePath = path.resolve(__dirname, `./${compFileName}/index.tsx`);
  const docs = docgen.parse(filePath, options);
  const jsonContent = JSON.stringify(docs);
  const docjs = `const compDes = ${jsonContent}; export default compDes;`;
  const compDesPath = path.resolve(__dirname, `./${compFileName}/compDes.js`);

  fs.writeFile(
    compDesPath,
    docjs,
    {
      encoding: 'utf8',
      flag: 'w',
    },
    err => {
      if (err) {
        console.log(`${compFileName},An error occured while writing JSON Object to File.`);
        console.log(err);
      } else {
        console.log('JSON file has been saved.');
      }
    }
  );
};

const args = process.argv.slice(2);
args.forEach(name => {
  createCompDes(name);
});
