(function (a, b, c, d, e, f) {
  a.npsmeter = a.npsmeter || function () {
    (a.npsmeter.q = a.npsmeter.q || []).push(arguments);
  };
  a._npsSettings = { npssv: '1.01' };
  e = b.getElementsByTagName('head')[0];
  f = b.createElement('script');
  f.async = 1;
  f.src = c + d + a._npsSettings.npssv + '&npsid=' + a._npsSettings.npsid; e.appendChild(f);
  a.npsmeterInstance = null;
  a.npsmeterCb = {
    onReady: function (e) {
      a.npsmeterInstance = npsmeter;
    }
  }
})(window, document, 'https://static.npsmeter.cn/npsmeter', '.js?sv=')
