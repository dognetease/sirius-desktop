const ymlServerUtils = require('./yml-server-utils');

const targetHost = ymlServerUtils.getHost();

if (!targetHost) {
  console.error(`-`.repeat(20));
  console.error('Target host is null or empty, ignore version check.');
  console.error(`-`.repeat(20));
  process.exit(0);
}
