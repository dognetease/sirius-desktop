/* eslint-disable */
// 要支持IE的原生JS，在2023年
/**
 * 全局状态
 */
// 绑定到body上的点击事件数组
var bodyClickList = [];
// 接听外部消息处理事件的数组
var messageHandles = [];


// 统一点击任务执行
document.body.addEventListener('click',function(event){
  execTask(event, bodyClickList);
});

// 接受容器发来的通知消息
window.addEventListener('message', (event)=>{
  execTask(event, messageHandles);
});

/**
 * 初始化
 */
(function() {
  var parentWindow = parent.window;
  if (!parentWindow || !parentWindow.document || !document) return;
  operateImgAuto();
  errorImage();
  imgPreview();
  proxyAlink();
  contextMenu();
  proxyAnchorLinkClick();
  resizeSize();
  documentReady();
  keyForwarding();
}())

/**
 * 工具方法
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * 
 */

/**
 * 任务执行方法
 */
function execTask(event, taskList){
  if(taskList && taskList.length){
    for(let i=0;i<taskList.length;i++){
      var task = taskList[i];
      if(task && typeof task == 'function'){
        var next = task(event);
        // 如果显示的返回false，则拦截掉后续的逻辑触发
        if(next === false){
          break;
        }
      }
    }
  }
}


/**
 * 与父窗体消息通信
 */
function postParentMessage(name, value){
  if(window.parent &&  window.parent.postMessage){
    window.parent && window.parent.postMessage({
      name,
      value
    });
  }
}

/**
 * 将错误对象转换为可以序列化传输的对象
 */
function errorToObject(error) {
  var serializedError = {};
  try{
    Object.getOwnPropertyNames(error).forEach(function(prop) {
      var propValue = error[prop];
      if (prop === 'stack' || prop === 'message') {
        serializedError[prop] = propValue;
      } else if (typeof propValue !== 'function' && typeof propValue !== 'object') {
        serializedError[prop] = propValue;
      }
    });
  } catch(e){
    console.error('[Error errorToObject]', e)
  }
  return serializedError;
}

/**
 * 业务方法
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * 
 */


/**
 * 处理邮件的图片兼容
 */
function operateImgAuto() {
  var imgEles = document.getElementsByTagName('img');
  // 渲染之前 如果 item.height width 为0表示设置的是auto，或者真的0 。。
  // height width 都没有设置auto，将height设置成auto
  // 但是这个只能在渲染之前，如果走缓存的还是歇菜，所以需要两步操作
  // 用 item.naturalHeight === 0 判断是否是第一次渲染
  // 如果不是第一次渲染就对比 width/height === naturalWidth/naturalHeight
  // 如果比例不对，就height设置auto
  for (var i = 0; i < imgEles.length; i ++) {
    var item = imgEles[i];
    var naturalH = item.naturalHeight;
    var imgH = item.height;
    var imgW = item.width;
    if (naturalH === 0) {
      // 第一次渲染之前
      if (![imgH, imgW].includes(0)) {
        // width height 都没有设置auto
        item.style.height = 'auto';
      }
    } else {
      var naturalW = item.naturalWidth;
      if ((naturalH / naturalW).toFixed(2) !== (imgH / imgW).toFixed(2)) {
        // 图片不成比例
        item.style.height = 'auto';
      }
    }
  }
}
/**
 * 判断token是不是过期，过期通知更新token
*/
function tokenError(e) {
  // !todo error 信息传递
  postParentMessage('update_token');
}
/**
 * 图片加onerror 解决读信图裂问题
 */
function errorImage() {
  if (!document) return;
  // var parentWindow = parent.window;
  var imgEles = document.getElementsByTagName('img');

  for (var i = 0; i < imgEles.length; i ++) {
    var item = imgEles[i];
    var computedStyle = window.getComputedStyle(item);
    var width = computedStyle.width;
    var height = computedStyle.height;
    // console.log('originSrcoriginSrc', item.naturalHeight)
    if (![width, height].includes('auto') && width) {
      // item.style.height = 'auto';
    }
    item.addEventListener('error', function(e) {
      
      var url = this.getAttribute('src');
      var tokenUpdated = this.getAttribute('token-updated') || 0;
      var nowDate = new Date().getTime();
      if (url.indexOf('commonweb/proxy') > -1 && nowDate - Number(tokenUpdated) > 1000 * 60 * 5) {
        // 如果是走的代理
        this.setAttribute('token-updated', String(nowDate));
        tokenError(e);
        postParentMessage('readMail_img_error', {
          url: url,
          tokenError: 'tokenError',
          errorMes: JSON.stringify(errorToObject(e))
        });
        return;
      }
      // 读信图片加载失败后再次请求，解决服务端图片请求限制并发10次的问题
      var originSrc = this.getAttribute('data-origin-src');
      var originSrcUsed = this.getAttribute('origin-src-status');
      // 桌面端会将图片缓存在本地，用本地路径替代，但是用户可能直接删除本地文件，导致本地路径失效
      // 这种情况直接使用原始src
      // 但是这个链接存在请求并发的问题，所以再次进来的时候不能再用 data-origin-src 
      if (originSrc && !originSrcUsed) {
        url = originSrc;
        this.setAttribute('origin-src-status', 'used');
      }
      console.log('read mail img error');
      var querystring = url.split('&')
      var lastQuerystring = querystring.pop();
      var randomId = 0;
      var lastItem = lastQuerystring;
      if (lastQuerystring.indexOf('random=') > -1) {
        randomId = Number(lastQuerystring.split('=').pop()) + 1;
        lastItem = 'random=' + randomId
      } else {
        lastItem += '&random=0'
      }
      querystring.push(lastItem);
      if (randomId > 6) {
        console.log('read mail img error return', randomId);
        try {
          postParentMessage('readMail_img_error', { url, error: errorToObject(e) });
          postParentMessage('readMail_attachment_failed', {
            url: url,
            originSrc: originSrc,
            errorMes: JSON.stringify(errorToObject(e))
          });
        } catch (error) {
          console.log('读信图片加载失败打点失败', error);
        }
        return;
      }
      var newUrl = querystring.join('&');
      setTimeout(() => {
        this.setAttribute('src', newUrl);
      }, Math.random()*500);
    });
  }
};

/**
 * 读信图片token更新
*/
function updateImgToken(token, sid) {
  document.querySelectorAll('img').forEach(function(item) {
    var src = item.getAttribute('src');
    var newSrc = src;
    if (src.indexOf('_token=') > -1) {
      var oldToken = src.split('_token=').pop().split('&')[0];
      // oldToken 可能为空
      newSrc = src.replace(`_token=${oldToken}`, `_token=${token}`);
      // var dateTime = new Date().getTime();
      // item.setAttribute('token-updated', String(dateTime));
      // item.setAttribute('src', newSrc);
    }
    if(sid && newSrc.indexOf('sid') > -1) {
      var oldSid = newSrc.split('sid=').pop().split('&')[0];
      newSrc = newSrc.replace(`sid=${oldSid}`, `sid=${sid}`);
    }
    item.setAttribute('src', newSrc);
  });
}

/**
 * 读信右键功能
 */
function contextMenu() {
  var parentWindow = parent.window;
  var menuWrapper = null;
  var contextTarget = null;
  var selectionText = '';
  function hiddenContextMenu () {
    if (menuWrapper) {
      menuWrapper.remove();
    }
  }
  document.body.addEventListener('contextmenu', function(event) {
    if (!parentWindow.apiResposity.systemApi.isElectron() || event.target === null) return;
    hiddenContextMenu();
    menuWrapper = document.createElement('div')
    menuWrapper.className = 'frame-context-menu';
    var target = event.target;
    contextTarget = target;
    selectionText = window.getSelection().toString();
    if (target !== null) {
      event.preventDefault();
      var menuHtml = ''
      var clientX = event.clientX;
      var clientY = event.clientY;
      if (target.tagName === 'IMG') {
        var fuzhitupian = parentWindow !== 'undefined' ? parentWindow.getLocalLabel('FUZHITUPIAN') : '';
        var xiazaitupian = parentWindow !== 'undefined' ? parentWindow.getLocalLabel('XIAZAITUPIAN') : '';
        menuHtml += '<p contex-type="copyImg">' + fuzhitupian + '</p><p contex-type="downImg">' + xiazaitupian + '</p>';
      } else if (target.tagName === 'A') {
        var fuzhilianjie = parentWindow !== 'undefined' ? parentWindow.getLocalLabel('FUZHILIANJIE') : '';
        menuHtml += '<p contex-type="copyLink">' + fuzhilianjie + '</p>';
      } else if (selectionText) {
        var fuzhi = parentWindow !== 'undefined' ? parentWindow.getLocalLabel('FUZHI') : '';
        menuHtml += '<p contex-type="copySelection">' + fuzhi + '</p>';
      }
      if (target.tagName !== 'IMG') {
        var quanxuan = parentWindow !== 'undefined' ? parentWindow.getLocalLabel('QUANXUAN') : '';
        menuHtml += '<p contex-type="selectAll">' + quanxuan + '</p>';
      }
      menuWrapper.innerHTML = menuHtml;
      // 处理边界问题 mail-read-content 88
      var bodyClientHeight = document.body.clientHeight;
      var bodyClientWidth = document.body.clientWidth;
      var style = '';
      if (clientY + 76 > bodyClientHeight) {
        style += 'bottom: 0;'
      } else {
        style += 'top: '+ clientY +'px;'
      }
      if (clientX + 88 > bodyClientWidth) {
        style += 'right: 0;'
      } else {
        style += 'left: '+ clientX +'px;'
      }
      menuWrapper.style = style;
      document.body.appendChild(menuWrapper);
    }
  });
  // body绑定点击事件，入队
  bodyClickList.push(function(e) {
    var target = e.target;
    if (!target) return;
    // 点击的是否是contextmenu 到 clickContent 方法执行中间都是为clickContent提供参数
    var targetContextType = target.getAttribute('contex-type');
    var contextMenu = null;
    if (targetContextType && contextTarget) {
      contextMenu = { type: targetContextType };
      switch (targetContextType) {
        case 'copyImg':
          contextMenu.copyImgSrc = contextTarget.src;
          if (contextTarget.src.indexOf('sirius://sirius.file') > -1) {
            contextMenu.copyImgSrc = contextTarget.getAttribute('data-origin-src') || '';
          }
          break;
        case 'downImg':
          contextMenu.downImgSrc = contextTarget.src;
          var originUrl = contextTarget.getAttribute('data-origin-src') || '';
          if (originUrl) {
            originUrl = originUrl.replace(/sid=.+?&/, '');
          }
          contextMenu.downImgOriginUrl = originUrl;
          contextMenu.downImgFid = Number(contextTarget.getAttribute('fid')) || undefined;
          break;
        case 'copyLink':
          contextMenu.copyLinkHref = contextTarget.href || '';
          break;
        case 'selectAll':
          var selection = window.getSelection();
          var range = document.createRange();
          range.selectNodeContents(document.body);
          selection?.removeAllRanges();
          selection?.addRange(range);
          break;
        case 'copySelection':
          contextMenu.copySelectionText = selectionText;
          break;
      }
    }
    if(contextMenu){
      postParentMessage('readMail_ContextMenu',contextMenu);
      // 隐藏contextmenu
      hiddenContextMenu();
      // 拦截后续的click事件触发
      return false;
    } else {
      // 隐藏contextmenu
      hiddenContextMenu();
    }
  });
  // 接受外部消息通知
  messageHandles.push(function(event){
    // 如果外部点击了页面
    if(event.data == 'pageClick'){
      hiddenContextMenu();
    }
    if(event.data.name == 'updateImgToken') {
      const eventData = event.data && event.data.data ? event.data.data : event.data || {};
      updateImgToken(eventData.token, eventData.sid);
    }
  });
};

/**
 * 绑定图片的预览
 */
function imgPreview(e){
  // 在body上click的时间按顺序调用
  bodyClickList.push(function(e){
    const target = e.target; 
    if (target && target.nodeName === 'IMG' && target.src) {
      // 预览图片数据 getBoundingClientRect 判断是否隐藏以及父级是否隐藏
      var allImages = [...document.getElementsByTagName('img')];
      allImages = allImages.filter(item => {
        var res = true;
        var rect = item.getBoundingClientRect();
        if (!item.src || rect.height === 0 || rect.width === 0) {
          res = false;
        }
        return res;
      }).map(item => ({ src: item.src, alt: item.alt }));
      postParentMessage('readMail_img_click', { allImages, startIndex: allImages.findIndex(item => item.src === target.src) });
    }
  })
}

/**
 * 点击超链接拦截，转发到主窗体去做处理
 */
function proxyAlink(e){
  // 获取包裹的A标签的Href
  var getParentsAtag = function(e) {
    var parent = e.parentNode;
    if (e.nodeName === 'A') {
      return e;
    }
    if (parent && parent.nodeName !== 'BODY') {
      return getParentsAtag(parent);
    }
    return null;
  };
  // 添加全局的click调用中
  bodyClickList.push(function(e){
    var target = e.target;
    if (target){
      // 是否a标签
      var targetA = getParentsAtag(target);
      if (targetA && targetA.href) {
        e.preventDefault();
        postParentMessage('readMail_link_click', targetA.href);
      }
    }
  })
}


// 读信高度 等尺寸问题
// 监听body变化 同步高度到iframe 外层
function resizeSize() {
  // var parentWindow = parent.window;
  // 创建观察器
  // var MuationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
  if (!ResizeObserver) return;
  iframeObserver = new ResizeObserver(entries => {
    // 重设iframe尺寸
    // parentWindow.readMail.throttleResetIframeSize();
    postParentMessage('readMail_resizeSize')
  });
  // 观察对象 iframe内容wrapper
  var documentBody = document.body;
  var config = {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true
  };
  // iframeObserver.observe(documentBody, config);
  iframeObserver.observe(documentBody);
};


// 监听页面完成加载
function documentReady() {
  window.addEventListener("DOMContentLoaded", function(event) {
    postParentMessage('readMail_mailLoadOver')
  });
};

// 转发页面内的快捷键到外部
function keyForwarding() {
  document.addEventListener("keydown", function(event) {
    // 如果event是ctrl+f
    if ((event.key === 70 || event.keyCode === 70) && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
    }
    postParentMessage('readMail_keydown',{
      altKey : event.altKey,
      bubbles : event.bubbles,
      cancelable : event.cancelable,
      charCode : event.charCode,
      ctrlKey : event.ctrlKey,
      defaultPrevented : event.defaultPrevented,
      detail : event.detail,
      eventPhase : event.eventPhase,
      isTrusted : event.isTrusted,
      key : event.key,
      keyCode : event.keyCode,
      locale : event.locale,
      location : event.location,
      metaKey : event.metaKey,
      repeat : event.repeat,
      shiftKey : event.shiftKey,
      timeStamp : event.timeStamp
    });
  })
}

// 拦截邮件正文的锚点链接
function proxyAnchorLinkClick() {
  try{
    var links = document.getElementsByTagName('a');
    for (var link of links) {
      var href = link.getAttribute('href');
      if (href && href.trim().startsWith('#')) {
        link.addEventListener('click',anchorScroll, true );
      }
    }
  } catch(e){
    console.error('[Error proxyAnchorLinkClick]', e)
  }
}

// 模拟处理a标签的链接
function anchorScroll(event) {
  // 阻止默认行为
  event.preventDefault();
  event.stopPropagation();

  // 获取获取对应的锚点链接
  var linkName = this.getAttribute('href');
  if(linkName && linkName.trim().startsWith('#')){
    // 获取锚点目标元素
    var anchorName = linkName.slice(1);
    var targetIdElement = document.getElementById(anchorName);
    var targetNameElement = document.getElementsByName(anchorName);
    // 如果目标元素存在，滚动到目标元素
    if (targetIdElement) {
      targetIdElement.scrollIntoView({ behavior: 'smooth' });
    } else if(targetNameElement && targetNameElement.length){
      targetNameElement[0].scrollIntoView({ behavior: 'smooth' });
    }
  }
  return false;
}