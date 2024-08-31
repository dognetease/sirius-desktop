import wrapWithProvider from './wrap-with-provider';

export const wrapRootElement = wrapWithProvider;

process.on('uncaughtException', function (err) {
  console.log(err);
});
export const onPreRenderHTML = (_, props) => {
  console.log('ssr doing jobs : ', props);
};
