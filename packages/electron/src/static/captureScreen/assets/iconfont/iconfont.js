(function (window) {
  var svgSprite =
    '<svg><symbol id="icon-xiazai" viewBox="0 0 1024 1024"><path d="M947.2 588.8c-19.2 0-32 12.8-32 32v108.8c0 51.2-25.6 96-96 96H204.8c-76.8 6.4-96-44.8-96-96V620.8c0-19.2-12.8-32-32-32s-25.6 12.8-25.6 32V768c0 70.4 57.6 128 128 128h672c70.4 0 128-57.6 128-128V620.8c-6.4-19.2-19.2-32-32-32zM518.4 716.8" fill="" ></path><path d="M544 710.4l172.8-166.4c12.8-12.8 12.8-32 0-44.8s-32-12.8-44.8 0L550.4 608v-448c0-19.2-12.8-32-32-32s-32 12.8-32 32v448L364.8 499.2c-12.8-12.8-38.4-12.8-44.8 0-12.8 12.8-12.8 32 0 44.8l172.8 166.4s25.6 25.6 51.2 0z" fill="" ></path></symbol><symbol id="icon-guanbi" viewBox="0 0 1024 1024"><path d="M220.3136 256.512l579.2768 579.2768a25.6 25.6 0 1 0 36.1984-36.1984L256.512 220.3136a25.6 25.6 0 1 0-36.1984 36.1984z"  ></path><path d="M799.5904 220.3136L220.3136 799.5904a25.6 25.6 0 1 0 36.1984 36.1984L835.7888 256.512a25.6 25.6 0 1 0-36.1984-36.1984z"  ></path></symbol><symbol id="icon-zhongzhi" viewBox="0 0 1024 1024"><path d="M931.07 384.75a368 368 0 0 0-704 95.25H64l192 192 192-192H288.91C312 333.51 439.12 221.13 592 221.13c169.21 0 306.87 137.66 306.87 306.87S761.21 834.87 592 834.87a307.37 307.37 0 0 1-194.56-69.55 30.57 30.57 0 0 0-38.79 47.25 368.1 368.1 0 0 0 572.42-427.82z"  ></path></symbol><symbol id="icon-duihao" viewBox="0 0 1024 1024"><path d="M461.28 813.14a30 30 0 0 1-18.89-6.69L145 565.48a30 30 0 1 1 37.78-46.61l273.35 221.5 382.5-502.29a30 30 0 1 1 47.73 36.35L485.15 801.32a30 30 0 0 1-20.29 11.61 30.83 30.83 0 0 1-3.58 0.21z"  ></path></symbol></svg>';
  var script = (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  var shouldInjectCss = script.getAttribute('data-injectcss');
  var ready = function (fn) {
    if (document.addEventListener) {
      if (~['complete', 'loaded', 'interactive'].indexOf(document.readyState)) {
        setTimeout(fn, 0);
      } else {
        var loadFn = function () {
          document.removeEventListener('DOMContentLoaded', loadFn, false);
          fn();
        };
        document.addEventListener('DOMContentLoaded', loadFn, false);
      }
    } else if (document.attachEvent) {
      IEContentLoaded(window, fn);
    }
    function IEContentLoaded(w, fn) {
      var d = w.document,
        done = false,
        init = function () {
          if (!done) {
            done = true;
            fn();
          }
        };
      var polling = function () {
        try {
          d.documentElement.doScroll('left');
        } catch (e) {
          setTimeout(polling, 50);
          return;
        }
        init();
      };
      polling();
      d.onreadystatechange = function () {
        if (d.readyState == 'complete') {
          d.onreadystatechange = null;
          init();
        }
      };
    }
  };
  var before = function (el, target) {
    target.parentNode.insertBefore(el, target);
  };
  var prepend = function (el, target) {
    if (target.firstChild) {
      before(el, target.firstChild);
    } else {
      target.appendChild(el);
    }
  };
  function appendSvg() {
    var div, svg;
    div = document.createElement('div');
    div.innerHTML = svgSprite;
    svgSprite = null;
    svg = div.getElementsByTagName('svg')[0];
    if (svg) {
      svg.setAttribute('aria-hidden', 'true');
      svg.style.position = 'absolute';
      svg.style.width = 0;
      svg.style.height = 0;
      svg.style.overflow = 'hidden';
      prepend(svg, document.body);
    }
  }
  if (shouldInjectCss && !window.__iconfont__svg__cssinject__) {
    window.__iconfont__svg__cssinject__ = true;
    try {
      document.write('<style>.svgfont {display: inline-block;width: 1em;height: 1em;fill: currentColor;vertical-align: -0.1em;font-size:16px;}</style>');
    } catch (e) {
      console && console.log(e);
    }
  }
  ready(appendSvg);
})(window);
