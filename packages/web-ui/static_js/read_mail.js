/* eslint-disable */
(function () {
  if (!document) return;
  console.log('parentparent', parent, parent.windo)
  var imgEles = document.getElementsByTagName('img');
  for (var i = 0; i < imgEles.length; i ++) {
    var item = imgEles[i];
    item.addEventListener('error', function() {
      // 读信图片加载失败后再次请求，解决服务端图片请求限制并发10次的问题
      console.log('read mail img error');
      var url = this.getAttribute('src');
      var querystring = url.split('&')
      var lastQuerystring = querystring.pop();
      var randomId = 0;
      if (lastQuerystring.indexOf('random=') > -1) {
        randomId = Number(lastQuerystring.split('=').pop()) + 1
      }
      if (randomId > 6) {
        console.log('read mail img error return', randomId);
        return;
      }
      var newUrl = querystring.join('&') + '&random=' + randomId;
      this.setAttribute('src', newUrl);
    });
  }
}());

