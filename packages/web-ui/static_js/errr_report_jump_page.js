/* eslint-disable */
(function () {
  if(typeof window !== 'undefined') {
    window.loginUserNewAccountInfo = true;
  }
  // eslint-disable-next-line vars-on-top
  var countMax = 5;
  var timeoutId;
  var trackFunc = function (event, data, retry) {
    var retryTimes = retry || 1;
    if (window.DATracker && window.DATracker.track) {
      window.DATracker.track(event, data);
    } else if(retryTimes < 5){
      setTimeout(function () {
        // window.DATracker.track('web_jump_to_new_webmail_warn', {
        //   location: window.location.search,
        //   msg: ev.name
        // });
        trackFunc(event,data,retryTimes+1);
      }, 700);
    }
  };
  // TODO
  const isJumpOut = location.search.includes('jumpOut');
  if (location && location.pathname && location.pathname.indexOf('/jump/') >= 0 && !isJumpOut) {
    // add window err catch
    window.addEventListener('error', function (ev) {
      if (ev.name === 'EmptyError') {
        return;
      }
      window.jumpErr = window.jumpErr || {};
      window.jumpErr.ex = ev;
      window.jumpErr.msg = ev.message;
    });
    // var isTestReg = new RegExp('testJu=([^&]+)');
    // var isTestRe = isTestReg.exec(location.search);
    var test = location.search.indexOf('testJu=1') >= 0;
    // eslint-disable-next-line vars-on-top
    var jumpTo = function (msg) {
      trackFunc('web_jump_to_new_webmail_error', {
        location: window.location.search,
        msg
      });

      var gotoOld = confirm('切换新版邮箱出现问题\n您可以点击【确定】返回旧版邮箱，点击【取消】刷新当前页并继续尝试前往新版。\n错误信息：\n' + msg);

      if (gotoOld) {
        var sidReg = new RegExp('sid=([^&]+)');
        var sidRe = sidReg.exec(location.search);
        var sid = (sidRe && sidRe.length >= 2) ? sidReg[1] : '';

        var isOldReg = new RegExp('show_old=([^&]+)');
        var isOldRe = isOldReg.exec(location.search);
        var showOld = (isOldRe && isOldRe.length >= 2) ? isOldRe[1] : '';

        if (!sid || sid.length === 0) {
          alert('访问链接存在错误，请回到登录页面重试');
        } else {
          location.replace('/js6/upgrade.jsp?style=9&sid=' + sid + '&show_old=' + showOld);
        }
      } else {
        location.reload();
      }
    };
    // eslint-disable-next-line vars-on-top
    var handle = function (times) {
      if (times === countMax) {
        trackFunc('web_jump_to_new_webmail_start', { location: window.location.search });
      }
      timeoutId = setTimeout(function () {
        if (location.pathname && location.pathname.indexOf('/jump/') < 0) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          return;
        }
        if (test) {
          jumpTo('超时没有响应');
        } else if (window.jumpErr && window.jumpErr.msg && window.jumpErr.msg.length > 0) {
          // jumpTo(window.jumpErr.msg);
          trackFunc('web_jump_to_new_webmail_warn', {
              location: window.location.search,
              msg: window.jumpErr.msg
            });
        } else if (times > 0) {
          times -= 1;
          handle(times);
          if (times === 1) {
            trackFunc('web_jump_to_new_webmail_over_20_second', { location: window.location.search });
          }
        } else {
          jumpTo('超时没有响应');
        }
      }, 2500);
    };
    handle(countMax);
  }
}());
