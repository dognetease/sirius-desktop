(function (w, d, n, a, j) {
  w[n] = w[n] || function () {
    return (w[n].a = w[n].a || []).push(arguments)
  };
  j = d.createElement('script');
  j.async = true;
  j.src = 'https://qiyukf.com/script/abab5b9989e6f898240067f40874a096.js?templateId=6603268&sdkTemplateId=6603268';
  d.body.appendChild(j);
  j.onload = function () {
    setTimeout(function () {
      const apiResposity = window.apiResposity;
      const kfApiImpl = apiResposity && apiResposity.requireLogicalApi('kfApiImpl');
      kfApiImpl && !kfApiImpl.isInited && kfApiImpl.afterInit();
      console.log("kfApiImpl init finished");
    }, 2500);
  }
})(window, document, 'ysf');