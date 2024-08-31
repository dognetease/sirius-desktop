(function (document, datracker, root) {
  let loadSdkTime = 0;

  function loadJsSDK() {
    let contextPath = '';
    let profile = '';
    if (window.getSpConf && typeof window.getSpConf == 'function') {
      contextPath = window.getSpConf('contextPath');
      profile = window.getSpConf('profile');
      // profile 有值 并且不是 webmail情形 或者 contextpath 有值，并且长度大于0（肯定是 webmail 场景）
      if ((profile && !profile.startsWith('webmail')) || (contextPath && contextPath.length > 0)) {
        var script,
          first_script;
        script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        // const jsPath = contextPath + '/DATracker.globals.js?v=' + window.getSpConf('version');
        // const jsPath = 'https://hubble-js-bucket.nosdn.127.net/DATracker.sync.1.6.14.js';
        let jsPath = 'https://artifact.lx.netease.com/download/oxpecker-js-sdk/oxpecker/sdk/js?v=' + window.getSpConf('version');
        var environment = window.getSpConf('profile') || ''
        if (environment.includes('prod')) {
          jsPath = 'https://artifact.lx.netease.com/download/oxpecker-js-sdk/oxpecker/sdk/js?v=' + window.getSpConf('version');
        } else if (environment.includes('test')) {
          jsPath = 'https://artifact.lx.netease.com/download/oxpecker-js-sdk/oxpecker/sdk/js/test?v=' + window.getSpConf('version');
        }
        script.src = jsPath;
        console.warn('load hubble js : ', jsPath);
        first_script = document.getElementsByTagName('script')[0];
        first_script.parentNode.insertBefore(script, first_script);
        script.onload = function () {
          setTimeout(function () {
            window.apiResposity && window.apiResposity.requireLogicalApi('dataTrackerApiImp') && window.apiResposity.requireLogicalApi('dataTrackerApiImp')
              .afterInit();
            console.log('data tracker init finished');
          }, 2500);
        };
        script.onerror = function () {
          loadSdkTime += 1;
          if (loadSdkTime < 7) {
            setTimeout(function () {
              loadJsSDK();
            }, 1200);
          }
        };
        return;
      }
    }
    loadSdkTime += 1;
    if (loadSdkTime < 7) {
      setTimeout(function () {
        loadJsSDK();
      }, 1200);
    }
  }

  if (!datracker['__SV']) {
    var win = window;
    var gen_fn,
      functions,
      i,
      lib_name = 'DATracker';
    window[lib_name] = datracker;
    datracker['_i'] = [];
    datracker['init'] = function (token, config, name) {
      var target = datracker;
      if (typeof (name) !== 'undefined') {
        target = datracker[name] = [];
      } else {
        name = lib_name;
      }
      target['people'] = target['people'] || [];
      target['abtest'] = target['abtest'] || [];
      target['toString'] = function (no_stub) {
        var str = lib_name;
        if (name !== lib_name) {
          str += '.' + name;
        }
        if (!no_stub) {
          str += ' (stub)';
        }
        return str;
      };
      target['people']['toString'] = function () {
        return target.toString(1) + '.people (stub)';
      };

      function _set_and_defer(target, fn) {
        var split = fn.split('.');
        if (split.length == 2) {
          target = target[split[0]];
          fn = split[1];
        }
        target[fn] = function () {
          target.push([fn].concat(Array.prototype.slice.call(arguments, 0)));
        };
      }

      functions = 'oxpecker_init oxpecker_set_url oxpecker_update_config oxpecker_remove_config oxpecker_set_token oxpecker_flush oxpecker_set_product_profile oxpecker_send_by_beacon oxpecker_set_base_attributes oxpecker_config_sdk get_user_id track_heatmap register_attributes register_attributes_once clear_attributes unregister_attributes current_attributes single_pageview disable time_event get_appStatus track set_userId track_pageview track_links track_forms register register_once alias unregister identify login logout signup name_tag set_config reset people.set people.set_once people.set_realname people.set_country people.set_province people.set_city people.set_age people.set_gender people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.set_populationWithAccount  people.set_location people.set_birthday people.set_region people.set_account abtest.get_variation abtest.async_get_variable'.split(' ');
      for (i = 0; i < functions.length; i++) {
        _set_and_defer(target, functions[i]);
      }
      datracker['_i'].push([token, config, name]);
    };
    datracker['__SV'] = 1.6;
    setTimeout(function () {
      loadJsSDK();
    }, 2000);

  }
})(document, window['DATracker'] || [], window);
