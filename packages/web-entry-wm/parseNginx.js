const ConfigParser = require('@webantic/nginx-config-parser');

const parser = new ConfigParser();

const parseNginx = fileName => {
  const config = parser.readConfigFile(fileName);
  const options = new Map();
  const proxyList = [];
  const varList = [];
  Object.keys(config).forEach(key => {
    const obj = config[key];
    const varRex = /^upstream\s+([a-zA-Z]+)/;
    const varArr = key.match(varRex);
    if (varArr && varArr[1]) {
      varList.push(varArr[1]);
      options.set(varArr[1], obj.server);
    } else if (key === 'server') {
      Object.keys(obj).forEach(objKey => {
        const locationRex = /^location\s+(\/[a-zA-Z]+)/;
        const locationArr = objKey.match(locationRex);
        if (locationArr && locationArr[1]) {
          const item = obj[objKey];
          const proxyItem = {
            domain: locationArr[1],
          };
          if (item.proxy_pass) {
            const rReg = new RegExp(`(${varList.join('|')})`);
            const tReg = new RegExp(/^['"](.*)['"]$/);
            let target = item.proxy_pass;
            if (rReg.test(target)) {
              target = target.replace(rReg, substr => options.get(substr));
            }
            proxyItem.target = target.replace(tReg, '$1');
          }
          if (item.rewrite) {
            const arr = item.rewrite.split(' ').slice(0, 2);
            proxyItem.path = arr[0];
            proxyItem.pathRewrite = arr[1];
          }
          proxyList.push(proxyItem);
        }
      });
    }
  });
  console.log('varList', varList);

  console.log('options', options);

  console.log('proxyList', proxyList);
  return {
    proxyList,
    options,
  };
};
module.exports = parseNginx;
