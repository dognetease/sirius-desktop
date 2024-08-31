function getCommandArgvInfo() {
  if (!process.argv || process.argv.length <= 2) {
    return {};
  }

  let argvs = process.argv.slice(2);
  let result = {};
  argvs.forEach(argv => {
    // 以--开头
    if (argv.indexOf('--') === 0) {
      let noPrefixArgv = argv.replace('--', '');
      let argvParts = noPrefixArgv.split('=');
      if (argvParts.length > 2) {
        throw new Error(`"${argv}" includes multiple '=', not supported.`);
      } else if (argvParts.length === 2) {
        result[argvParts[0]] = argvParts[1];
      } else if (argvParts.length === 1) {
        result[argvParts[0]] = true;
      }
    } else {
      throw new Error(`"${argv}" do not startsWith "--"`);
    }
  });
  return result;
}

module.exports = {
  getCommandArgvInfo,
};
