const { onCreateNode, onCreateWebpackConfig, onCreateBabelConfig, onCreatePage } = require('../web/gatsby-node');

process.on('uncaughtException', function (err) {
  // Handle the error safely
  console.log('gatsby-node-uncaughtException', err);
  process.exit(1);
});

exports.onCreateNode = onCreateNode;

exports.onCreateWebpackConfig = onCreateWebpackConfig;
exports.onCreateBabelConfig = onCreateBabelConfig;
exports.onCreatePage = onCreatePage;
