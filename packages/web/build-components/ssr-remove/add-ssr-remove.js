const fs = require('fs');
const path = require('path');

const mockReactReduxPath = path.join(__dirname, './mock-react-mredux');
const mockErrorBoundPath = path.join(__dirname, './mock-error-bound.tsx');
const mockStorePath = path.join(__dirname, './mock-store.ts');
/**
 * 添加SSR的忽略map
 * @param {string} ssrRootPath
 * @returns
 */
function getSSRIgnoreMap(ssrRootPath) {
  if (!ssrRootPath || !fs.existsSync(ssrRootPath)) {
    return null;
  }

  const ignoreMap = {
    [ssrRootPath]: [
      {
        request: 'react-redux',
        emptyPath: mockReactReduxPath,
      },
      {
        request: 'web-common/src/state/createStore',
        emptyPath: mockStorePath,
      },
      {
        request: 'web-common/src/hooks/ErrorBoundary',
        emptyPath: mockErrorBoundPath,
      },
    ],
  };

  return ignoreMap;
}

/**
 * 覆盖gatsby的文件
 * @param {string} entryPath
 * @returns
 */
function ignoreBuildSSRPages(entryPath) {
  if (!entryPath) return;
  const cacheEntryPath = entryPath;
  const cacheEntryNewPath = path.join(__dirname, './../../gatsby-overwrite/static-entry.js');
  fs.unlinkSync(cacheEntryPath);
  fs.copyFileSync(cacheEntryNewPath, cacheEntryPath);
  console.error('copy overwrite static-entry.js');
}

module.exports = {
  getSSRIgnoreMap,
  ignoreBuildSSRPages,
};
