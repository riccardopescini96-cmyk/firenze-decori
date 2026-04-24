(function (window, document) {
  'use strict';

  var GA_MEASUREMENT_ID = 'G-JKDWT1X7X9';
  var GA_SCRIPT_ID = 'firenze-decori-ga4';
  var ga4Loaded = false;
  var gaDisableKey = 'ga-disable-' + GA_MEASUREMENT_ID;

  window[gaDisableKey] = true;

  function hasMeasurementConsent(preference) {
    var api = window._iub && window._iub.cs && window._iub.cs.api;
    var preferences;

    if (preference && preference.purposes) {
      return preference.purposes['4'] === true || preference.purposes[4] === true;
    }

    if (api && typeof api.getPreferences === 'function') {
      preferences = api.getPreferences();
      if (preferences && preferences.purposes) {
        return preferences.purposes['4'] === true || preferences.purposes[4] === true;
      }
    }

    if (api && typeof api.isConsentGiven === 'function') {
      return api.isConsentGiven() === true;
    }

    return preference === true || Boolean(preference && preference.consent === true);
  }

  function loadGA4() {
    var script;

    window[gaDisableKey] = false;

    if (ga4Loaded || document.getElementById(GA_SCRIPT_ID)) {
      ga4Loaded = true;
      return;
    }

    ga4Loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);

    script = document.createElement('script');
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  window._iub = window._iub || [];
  window._iub.csConfiguration = window._iub.csConfiguration || {};
  window._iub.csConfiguration.callback = window._iub.csConfiguration.callback || {};

  var previousCallback = window._iub.csConfiguration.callback.onPreferenceExpressedOrNotNeeded;

  window._iub.csConfiguration.callback.onPreferenceExpressedOrNotNeeded = function onPreferenceExpressedOrNotNeeded(preference) {
    if (hasMeasurementConsent(preference)) {
      loadGA4();
    } else {
      window[gaDisableKey] = true;
    }

    if (typeof previousCallback === 'function') {
      previousCallback.apply(this, arguments);
    }
  };
}(window, document));
