(function(document, datracker, root) {
    // 领英跳过埋点(csp 策略)
    if (location.host.includes('linkedin.com')) {
        return;
    }
    if (Array.isArray(datracker)) {
        if (datracker.length > 0) {
            return;
        }
    } else if (datracker) {
        return;
    }
    function loadJsSDK() {
        var script, first_script;
        script = document.createElement("script");
        script.type = "text/javascript";
        script.async = true;
        script.src = document.body.dataset.wmExtension + "assets/js/DATracker.globals.1.6.12.8.js";
        first_script = document.getElementsByTagName("script")[0];
        first_script.parentNode.insertBefore(script, first_script)
    }
    if (!datracker["__SV"]) {
        console.log('datracker', datracker)
        var win = window;
        var gen_fn, functions, i, lib_name = "DATracker";
        window[lib_name] = datracker;
        datracker["_i"] = [];
        datracker["init"] = function(token, config, name) {
            var target = datracker;
            if (typeof(name) !== "undefined") {
                target = datracker[name] = []
            } else {
                name = lib_name
            }
            target["people"] = target["people"] || [];
            target["abtest"] = target["abtest"] || [];
            target["toString"] = function(no_stub) {
                var str = lib_name;
                if (name !== lib_name) {
                    str += "." + name
                }
                if (!no_stub) {
                    str += " (stub)"
                }
                return str
            };
            target["people"]["toString"] = function() {
                return target.toString(1) + ".people (stub)"
            };

            function _set_and_defer(target, fn) {
                var split = fn.split(".");
                if (split.length == 2) {
                    target = target[split[0]];
                    fn = split[1]
                }
                target[fn] = function() {
                    target.push([fn].concat(Array.prototype.slice.call(arguments, 0)))
                }
            }
            functions = "get_user_id track_heatmap register_attributes register_attributes_once clear_attributes unregister_attributes current_attributes single_pageview disable time_event get_appStatus track set_userId track_pageview track_links track_forms register register_once alias unregister identify login logout signup name_tag set_config reset people.set people.set_once people.set_realname people.set_country people.set_province people.set_city people.set_age people.set_gender people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.set_populationWithAccount  people.set_location people.set_birthday people.set_region people.set_account abtest.get_variation abtest.async_get_variable".split(" ");
            for (i = 0; i < functions.length; i++) {
                _set_and_defer(target, functions[i])
            }
            datracker["_i"].push([token, config, name])
        };
        datracker["__SV"] = 1.6;
        loadJsSDK()
        window.DATracker.init('MA-A369-B7905454086F', {
            truncateLength: 255,
            session_interval_mins: 60,
            persistence: "localStorage",
            cross_subdomain_cookie: false,
            heatmap: {
                collect_all: true
            },
            abtest: {
                enable_abtest: false,
                default_variables: {
                    position: 'top'
                }
            }
            }
        );
    }
})(document, window["DATracker"] || [], window)

document.addEventListener('DATrackerCustomEvent', function(e) {
    // console.log('接收埋点事件', e.detail)
    const {key, params = {}} = e.detail;
    window.DATracker?.track(key, params)
});