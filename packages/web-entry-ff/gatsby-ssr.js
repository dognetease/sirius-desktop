import wrapWithProvider from './wrap-with-provider';

console.log('----------------from gatsby ssr-------------------');
export const wrapRootElement = wrapWithProvider;
process.on('uncaughtException', function (err) {
  // Handle the error safely
  console.log(err);
});
