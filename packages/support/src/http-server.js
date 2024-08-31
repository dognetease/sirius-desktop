const http = require('http');
const httpProxy = require('http-proxy');
const httpServer = require('http-server');

// 创建http-server实例，将./html文件夹的内容展示出来
const server = httpServer.createServer({ root: './html' });
server.listen(8080, () => {
  console.log('Server listening on port 8080');
});

// 创建代理服务器实例
const proxy = httpProxy.createProxyServer({});

// 监听请求
const serverProxy = http.createServer((req, res) => {
  // 解析请求 URL
  const reqUrl = URL.parse(req.url);

  // 根据请求路径，设置代理的目标地址和路径重写规则
  let proxyTarget;
  let proxyPathRewrite;
  if (reqUrl.pathname.startsWith('/a/')) {
    proxyTarget = 'http://127.0.0.1:8000';
    proxyPathRewrite = { '^/a': '' };
  } else if (reqUrl.pathname.startsWith('/b/')) {
    proxyTarget = 'http://127.0.0.1:9000';
    proxyPathRewrite = { '^/b': '' };
  } /* else {
    // 如果请求路径不符合代理规则，直接返回 404 错误
    res.statusCode = 404;
    res.end();
    return;
  } */

  // 使用代理服务器转发请求
  proxy.web(req, res, {
    target: proxyTarget,
    changeOrigin: true,
    pathRewrite: proxyPathRewrite,
  });
});

// 启动服务器
serverProxy.listen(3000);
