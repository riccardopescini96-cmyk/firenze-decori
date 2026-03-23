(function () {
  'use strict';

  var body = document.body;
  var navToggle = document.querySelector('.nav-toggle');
  var navWrapper = document.querySelector('.nav-wrapper');
  var desktopMinWidth = 768;

  function isDesktopViewport() {
    return window.innerWidth >= desktopMinWidth;
  }

  function setNavOpen(isOpen) {
    body.classList.toggle('nav-open', isOpen);

    if (navToggle) {
      navToggle.setAttribute('aria-expanded', String(isOpen));
    }

    if (navWrapper) {
      navWrapper.setAttribute('aria-hidden', String(isDesktopViewport() ? false : !isOpen));
    }
  }

  function initMobileNav() {
    if (!navToggle || !navWrapper) {
      return;
    }

    setNavOpen(false);

    navToggle.addEventListener('click', function () {
      var isOpen = body.classList.contains('nav-open');
      setNavOpen(!isOpen);
    });

    navWrapper.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (!link) {
        return;
      }

      setNavOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        setNavOpen(false);
      }
    });

    window.addEventListener('resize', function () {
      if (isDesktopViewport()) {
        setNavOpen(false);
      }
    });
  }

  function setFooterYear() {
    var yearNode = document.getElementById('year');
    if (!yearNode) {
      return;
    }

    yearNode.textContent = String(new Date().getFullYear());
  }

  function initFooterLinks() {
    var footerLinks = document.querySelectorAll('.site-footer .footer-links a[href]');
    if (!footerLinks.length) {
      return;
    }

    var currentPageKey = getCurrentPageKey();

    function getLinkPageKey(href) {
      if (!href) {
        return '';
      }

      var cleanHref = href.split('?')[0].split('#')[0];

      if (!cleanHref) {
        return 'index.html';
      }

      var segments = cleanHref.split('/').filter(Boolean);
      var lastSegment = segments[segments.length - 1] || '';

      if (!lastSegment) {
        return 'index.html';
      }

      if (!/\.html?$/i.test(lastSegment)) {
        return '';
      }

      return lastSegment.toLowerCase();
    }

    footerLinks.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var hasHash = href.indexOf('#') !== -1;
      var linkPageKey = getLinkPageKey(href);
      var shouldRemove = linkPageKey === 'form-inviato.html' || (!hasHash && linkPageKey === currentPageKey);

      if (!shouldRemove) {
        return;
      }

      var listItem = link.closest('li');
      if (listItem) {
        listItem.remove();
        return;
      }

      link.remove();
    });
  }

  function trackEvent(name, details) {
    if (!name) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'ui_interaction',
      action: name,
      details: details || {}
    });
  }

  function initTrackedClicks() {
    var trackedNodes = document.querySelectorAll('[data-track]');
    if (!trackedNodes.length) {
      return;
    }

    trackedNodes.forEach(function (node) {
      node.addEventListener('click', function () {
        trackEvent(node.getAttribute('data-track'), {
          href: node.getAttribute('href') || '',
          text: (node.textContent || '').trim().slice(0, 80)
        });
      });
    });
  }

  function initHomeGallerySlideshow() {
    var sliders = document.querySelectorAll('.hero-slider');
    if (!sliders.length) {
      return;
    }

    sliders.forEach(function (slider) {
      var track = slider.querySelector('[data-mobile-slideshow]');
      var dotsContainer = slider.querySelector('.gallery-slider-controls');
      var dots = Array.from(slider.querySelectorAll('.gallery-dot'));
      var prevButton = slider.querySelector('[data-slide-nav="prev"]');
      var nextButton = slider.querySelector('[data-slide-nav="next"]');
      var desktopMedia = window.matchMedia('(min-width: 768px)');
      var isDragging = false;
      var dragStartX = 0;
      var dragStartScrollLeft = 0;

      if (!track) {
        return;
      }

      var slides = Array.from(track.children);
      var slidesCount = slides.length;

      if (!slidesCount) {
        return;
      }

      if (dotsContainer && dots.length !== slidesCount) {
        dotsContainer.innerHTML = '';

        slides.forEach(function (_, slideIndex) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = slideIndex === 0 ? 'gallery-dot is-active' : 'gallery-dot';
          dot.setAttribute('data-slide-to', String(slideIndex));
          dot.setAttribute('aria-label', 'Vai alla slide ' + String(slideIndex + 1));
          dotsContainer.appendChild(dot);
        });

        dots = Array.from(dotsContainer.querySelectorAll('.gallery-dot'));
      }

      function getSlideWidth() {
        return track.clientWidth || 1;
      }

      function getActiveIndex() {
        var slideWidth = getSlideWidth();
        var rawIndex = slideWidth > 0 ? Math.round(track.scrollLeft / slideWidth) : 0;
        return Math.max(0, Math.min(rawIndex, slidesCount - 1));
      }

      function moveToIndex(index, behavior, wrapForward) {
        var nextBehavior = behavior || 'smooth';
        var shouldWrapForward = Boolean(wrapForward);
        var targetIndex = index;

        if (shouldWrapForward && targetIndex >= slidesCount) {
          targetIndex = 0;
        }

        targetIndex = Math.max(0, Math.min(targetIndex, slidesCount - 1));

        track.scrollTo({
          left: targetIndex * getSlideWidth(),
          behavior: nextBehavior
        });
      }

      function updateActiveDot() {
        var activeIndex = getActiveIndex();

        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle('is-active', dotIndex === activeIndex);
        });

        if (prevButton) {
          prevButton.disabled = activeIndex === 0;
        }
      }

      dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
          var slideIndex = Number(dot.getAttribute('data-slide-to') || 0);
          moveToIndex(slideIndex, 'smooth', false);
        });
      });

      if (prevButton) {
        prevButton.addEventListener('click', function () {
          moveToIndex(getActiveIndex() - 1, 'smooth', false);
        });
      }

      if (nextButton) {
        nextButton.addEventListener('click', function () {
          moveToIndex(getActiveIndex() + 1, 'smooth', true);
        });
      }

      Array.from(track.querySelectorAll('img')).forEach(function (image) {
        image.draggable = false;
      });

      track.addEventListener('mousedown', function (event) {
        if (!desktopMedia.matches || event.button !== 0) {
          return;
        }

        isDragging = true;
        dragStartX = event.clientX;
        dragStartScrollLeft = track.scrollLeft;
        track.classList.add('is-dragging');
      });

      window.addEventListener('mousemove', function (event) {
        if (!isDragging) {
          return;
        }

        var deltaX = event.clientX - dragStartX;
        track.scrollLeft = dragStartScrollLeft - deltaX;
      });

      window.addEventListener('mouseup', function () {
        if (!isDragging) {
          return;
        }

        isDragging = false;
        track.classList.remove('is-dragging');
        moveToIndex(getActiveIndex(), 'smooth', false);
      });

      track.addEventListener('mouseleave', function () {
        if (!isDragging) {
          return;
        }

        isDragging = false;
        track.classList.remove('is-dragging');
        moveToIndex(getActiveIndex(), 'smooth', false);
      });

      track.addEventListener('scroll', updateActiveDot, { passive: true });
      window.addEventListener('resize', function () {
        moveToIndex(getActiveIndex(), 'auto', false);
        updateActiveDot();
      });

      updateActiveDot();
    });
  }

  function initPanelCalculator() {
    var calculator = document.querySelector('[data-panel-calculator]');
    if (!calculator) {
      return;
    }

    var input = calculator.querySelector('[name="area_m2"]');
    var resultNode = calculator.querySelector('.panel-calc-result');
    var panelAreaM2 = 1.22 * 2.8;

    if (!input || !resultNode) {
      return;
    }

    function formatM2(value) {
      return value.toFixed(2).replace('.', ',');
    }

    function updateResult(shouldTrack) {
      var normalized = (input.value || '').replace(',', '.');
      var areaM2 = Number(normalized);

      if (!Number.isFinite(areaM2) || areaM2 <= 0) {
        resultNode.classList.remove('is-ready');
        resultNode.textContent = 'Inserisci i m2 e calcola i pannelli necessari.';
        return;
      }

      var panels = Math.ceil(areaM2 / panelAreaM2);
      var coveredM2 = panels * panelAreaM2;

      resultNode.classList.add('is-ready');
      resultNode.innerHTML =
        'Per <strong>' + formatM2(areaM2) + ' m2</strong> servono <strong>' +
        String(panels) + ' pannelli</strong> (copertura ' +
        formatM2(coveredM2) + ' m2).';

      if (shouldTrack) {
        trackEvent('panel_calculator_submit', {
          area_m2: areaM2,
          panels: panels
        });
      }
    }

    calculator.addEventListener('submit', function (event) {
      event.preventDefault();
      updateResult(true);
    });

    input.addEventListener('input', function () {
      updateResult(false);
    });
  }

  function setFormStatus(statusNode, message, stateClass) {
    if (!statusNode) {
      return;
    }

    statusNode.classList.remove('is-success', 'is-error');

    if (stateClass) {
      statusNode.classList.add(stateClass);
    }

    statusNode.textContent = message || '';
  }

  function isFormspreeEndpointConfigured(endpoint) {
    if (!endpoint) {
      return false;
    }

    var normalized = endpoint.toLowerCase();
    return normalized.indexOf('xxxxx') === -1 && normalized.indexOf('your_form_id') === -1;
  }

  function ensureFormStatusNode(form) {
    var statusNode = form.querySelector('.form-status');
    if (statusNode) {
      return statusNode;
    }

    statusNode = document.createElement('div');
    statusNode.className = 'form-status';
    statusNode.setAttribute('role', 'status');
    statusNode.setAttribute('aria-live', 'polite');

    var submitButton = form.querySelector('[type="submit"]');
    if (submitButton && submitButton.parentNode === form) {
      form.insertBefore(statusNode, submitButton.nextSibling);
    } else {
      form.appendChild(statusNode);
    }

    return statusNode;
  }

  function getFieldNode(form, fieldName) {
    if (!form || !form.elements) {
      return null;
    }

    return form.elements[fieldName] || null;
  }

  function getFieldValue(form, fieldName) {
    var field = getFieldNode(form, fieldName);
    if (!field) {
      return '';
    }

    if (typeof field.length === 'number' && !field.tagName) {
      for (var index = 0; index < field.length; index += 1) {
        if (field[index] && field[index].checked) {
          return (field[index].value || '').toString().trim();
        }
      }

      return '';
    }

    return (field.value || '').toString().trim();
  }

  function isFieldChecked(form, fieldName) {
    var field = getFieldNode(form, fieldName);
    if (!field) {
      return false;
    }

    if (typeof field.length === 'number' && !field.tagName) {
      for (var index = 0; index < field.length; index += 1) {
        if (field[index] && field[index].checked) {
          return true;
        }
      }

      return false;
    }

    return Boolean(field.checked);
  }

  function setHiddenFieldValue(form, fieldName, value) {
    var field = form.querySelector('input[type="hidden"][name="' + fieldName + '"]');

    if (!field) {
      field = document.createElement('input');
      field.type = 'hidden';
      field.name = fieldName;
      form.appendChild(field);
    }

    field.value = value || '';
    return field;
  }

  function getGenericSubject(requestType) {
    var normalized = (requestType || '').toLowerCase();

    if (normalized === 'installatore') {
      return 'Firenze Decori — Richiesta Installatore';
    }

    if (normalized === 'rivenditore') {
      return 'Firenze Decori — Richiesta Rivenditore';
    }

    if (normalized === 'privato') {
      return 'Firenze Decori — Richiesta Privato';
    }

    return 'Firenze Decori — Richiesta informazioni (Generico)';
  }

  function getFormSubject(targetName, form) {
    if (targetName === 'b2c') {
      return 'Firenze Decori — Richiesta informazioni (Privato/B2C)';
    }

    if (targetName === 'b2b') {
      return 'Firenze Decori — Richiesta commerciale (B2B)';
    }

    return getGenericSubject(getFieldValue(form, 'request_type'));
  }

  function buildEmailPreview(payload) {
    var fullName = [payload.first_name, payload.last_name].filter(Boolean).join(' ').trim();

    return [
      'Target: ' + (payload.form_target || '-'),
      'Pagina: ' + (payload.page_url || '-'),
      'Nome: ' + (fullName || '-'),
      'Email: ' + (payload.email || '-'),
      'Azienda: ' + (payload.company || '-'),
      'Tipologia: ' + (payload.request_type || '-'),
      'Marketing: ' + (payload.marketing || 'NO'),
      '',
      'Messaggio:',
      payload.message || '-'
    ].join('\n');
  }

  function syncGenericMessagePlaceholder(form) {
    var requestTypeNode = form.querySelector('[name="request_type"]');
    var messageNode = form.querySelector('textarea[name="message"]');

    if (!requestTypeNode || !messageNode) {
      return;
    }

    function updatePlaceholder() {
      var requestType = (requestTypeNode.value || '').toLowerCase();
      var isProfessional = requestType === 'installatore' || requestType === 'rivenditore';

      messageNode.placeholder = isProfessional
        ? 'Descrivi la tua attività, volumi indicativi e area di lavoro: ti inviamo condizioni e materiali tecnici.'
        : 'Indicaci ambiente, metratura e finitura che preferisci: ti aiutiamo a definire il materiale necessario.';
    }

    requestTypeNode.addEventListener('change', updatePlaceholder);
    updatePlaceholder();
  }

  function setMessagePlaceholder(form, placeholder) {
    var messageNode = form.querySelector('textarea[name="message"]');
    if (!messageNode || !placeholder) {
      return;
    }

    messageNode.placeholder = placeholder;
  }

  function buildThankYouUrl(form, payload, targetName) {
    var thankYouPath = form.getAttribute('data-thank-you') || 'form-inviato.html';
    var thankYouUrl = new URL(thankYouPath, window.location.href);
    var firstName = payload.first_name || '';
    var requestType = payload.request_type || targetName || '';
    var origin = payload.form_origin || '';
    var companyName = payload.company || '';

    if (firstName) {
      thankYouUrl.searchParams.set('nome', firstName);
    }

    if (requestType) {
      thankYouUrl.searchParams.set('tipo', requestType);
    }

    if (origin) {
      thankYouUrl.searchParams.set('origine', origin);
    }

    if (companyName) {
      thankYouUrl.searchParams.set('azienda', companyName);
    }

    return thankYouUrl.toString();
  }

  function buildFormPayload(form, targetName) {
    var messageValue = getFieldValue(form, 'message') || 'Richiedo informazioni.';
    var payload = {
      first_name: getFieldValue(form, 'first_name'),
      last_name: getFieldValue(form, 'last_name'),
      email: getFieldValue(form, 'email'),
      message: messageValue,
      form_origin: getFieldValue(form, 'form_origin'),
      page_url: window.location.href,
      submitted_at: new Date().toISOString(),
      form_target: targetName,
      _subject: getFormSubject(targetName, form),
      _replyto: getFieldValue(form, 'email'),
      marketing: isFieldChecked(form, 'marketing') ? 'SI' : 'NO',
      privacy: isFieldChecked(form, 'privacy') ? 'SI' : 'NO'
    };

    if (targetName === 'generico') {
      payload.request_type = getFieldValue(form, 'request_type');
    }

    if (targetName === 'b2b') {
      payload.company = getFieldValue(form, 'company');
    }

    payload.email_preview = buildEmailPreview(payload);

    setHiddenFieldValue(form, 'page_url', payload.page_url);
    setHiddenFieldValue(form, 'submitted_at', payload.submitted_at);
    setHiddenFieldValue(form, 'form_target', payload.form_target);
    setHiddenFieldValue(form, '_subject', payload._subject);
    setHiddenFieldValue(form, '_replyto', payload._replyto);
    setHiddenFieldValue(form, 'email_preview', payload.email_preview);

    return payload;
  }

  function attachFormspree(formSelector, endpointUrl, targetName, options) {
    var form = document.querySelector(formSelector);
    if (!form) {
      return;
    }

    var config = options || {};
    var statusNode = ensureFormStatusNode(form);

    form.setAttribute('action', endpointUrl);
    form.setAttribute('method', 'POST');

    if (targetName === 'generico') {
      syncGenericMessagePlaceholder(form);
    } else if (config.messagePlaceholder) {
      setMessagePlaceholder(form, config.messagePlaceholder);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var endpoint = form.getAttribute('action') || endpointUrl || '';
      if (!isFormspreeEndpointConfigured(endpoint)) {
        setFormStatus(statusNode, 'Configura il Form ID Formspree per inviare il modulo.', 'is-error');
        return;
      }

      if (typeof form.reportValidity === 'function' && !form.reportValidity()) {
        return;
      }

      if (!isFieldChecked(form, 'privacy')) {
        setFormStatus(statusNode, 'Errore nell\'invio. Riprova o scrivici su WhatsApp.', 'is-error');
        return;
      }

      var submitButton = form.querySelector('[type="submit"]');
      var payload = buildFormPayload(form, targetName);
      var formData = new FormData(form);

      setFormStatus(statusNode, 'Invio in corso...', '');

      if (submitButton) {
        submitButton.disabled = true;
      }

      fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        body: formData
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('request_failed');
          }

          setFormStatus(statusNode, 'Grazie! Ti risponderemo entro 24 ore.', 'is-success');

          if (window.dataLayer && typeof window.dataLayer.push === 'function') {
            window.dataLayer.push({
              event: 'lead_submit',
              form_target: targetName
            });
          }

          var thankYouUrl = buildThankYouUrl(form, payload, targetName);
          if (thankYouUrl) {
            window.setTimeout(function () {
              window.location.assign(thankYouUrl);
            }, 700);
          }
        })
        .catch(function () {
          setFormStatus(
            statusNode,
            'Errore nell\'invio. Riprova o scrivici su WhatsApp.',
            'is-error'
          );
        })
        .finally(function () {
          if (submitButton) {
            submitButton.disabled = false;
          }
        });
    });
  }

  function initContactForms() {
    attachFormspree('#form-generico', 'https://formspree.io/f/mvzbyyjn', 'generico');
    attachFormspree('#form-b2c', 'https://formspree.io/f/xgolqqgr', 'b2c', {
      messagePlaceholder: 'Indicaci in breve il tuo progetto (ambiente, metratura, finitura).'
    });
    attachFormspree('#form-b2b', 'https://formspree.io/f/xeelddyr', 'b2b', {
      messagePlaceholder: 'Descrivi la tua attività, volumi indicativi e area di lavoro: ti inviamo condizioni e schede tecniche.'
    });
  }

  function getThankYouAudienceLabel(audience) {
    var normalized = (audience || '').toLowerCase();

    if (normalized === 'installatore' || normalized === 'rivenditore' || normalized === 'b2b') {
      return 'professionisti (B2B)';
    }

    if (normalized === 'privato' || normalized === 'b2c') {
      return 'privati (B2C)';
    }

    if (normalized === 'generico') {
      return 'contatto generico';
    }

    return 'contatto generico';
  }

  function initThankYouPage() {
    var pageNode = document.querySelector('[data-thank-you-page]');
    if (!pageNode) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var titleNode = pageNode.querySelector('[data-thankyou-title]');
    var bodyNode = pageNode.querySelector('[data-thankyou-body]');
    var detailsNode = pageNode.querySelector('[data-thankyou-meta]');
    var firstName = (params.get('nome') || '').trim();
    var audience = (params.get('tipo') || '').trim();
    var companyName = (params.get('azienda') || '').trim();
    var source = (params.get('origine') || '').trim();
    var introText = firstName ? ('Grazie ' + firstName + ',') : 'Grazie,';
    var audienceLabel = getThankYouAudienceLabel(audience);
    var sourceLabel = source ? source.replace(/_/g, ' ') : 'sito web';
    var details = [];

    if (titleNode) {
      titleNode.textContent = 'Form inviato correttamente';
    }

    if (bodyNode) {
      bodyNode.textContent =
        introText + ' abbiamo ricevuto la tua richiesta e il nostro team ti ricontattera al piu presto con le informazioni richieste.';
    }

    details.push('Tipo richiesta: ' + audienceLabel);
    details.push('Origine: ' + sourceLabel);

    if (companyName) {
      details.push('Azienda: ' + companyName);
    }

    if (detailsNode) {
      detailsNode.textContent = details.join(' | ');
    }
  }

  function getCurrentPageKey() {
    var pathname = window.location.pathname || '';
    var cleanPath = pathname.split('?')[0].split('#')[0];

    if (!cleanPath || cleanPath === '/') {
      return 'index.html';
    }

    var segments = cleanPath.split('/').filter(Boolean);
    var lastSegment = segments[segments.length - 1] || '';

    if (!lastSegment || !/\.html?$/i.test(lastSegment)) {
      return 'index.html';
    }

    return lastSegment.toLowerCase();
  }

  function getBreadcrumbItems() {
    var pageMap = {
      'index.html': 'Home',
      'fornitura-professionisti.html': 'Fornitura professionisti',
      'rivestimenti-interni.html': 'Rivestimenti interni',
      'form-inviato.html': 'Form inviato'
    };
    var pageKey = getCurrentPageKey();
    var items = [{ name: 'Home', path: 'index.html' }];

    if (pageKey !== 'index.html') {
      var currentLabel = pageMap[pageKey];

      if (!currentLabel) {
        var h1 = document.querySelector('main h1');
        currentLabel = h1 ? (h1.textContent || '').trim() : 'Pagina';
      }

      items.push({
        name: currentLabel,
        path: pageKey
      });
    }

    return items;
  }

  function injectBreadcrumbStructuredData(items) {
    if (!items || !items.length) {
      return;
    }

    var existingNode = document.getElementById('dynamic-breadcrumb-jsonld');
    if (existingNode) {
      existingNode.remove();
    }

    var siteBaseUrl = 'https://www.firenzedecori.it';
    var listItems = items.map(function (item, index) {
      var itemUrl = item.path === 'index.html'
        ? siteBaseUrl + '/'
        : siteBaseUrl + '/' + item.path;

      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: itemUrl
      };
    });

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'dynamic-breadcrumb-jsonld';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: listItems
    });

    document.head.appendChild(script);
  }

  function initBreadcrumbs() {
    var main = document.querySelector('main');
    if (!main || document.querySelector('.breadcrumbs')) {
      return;
    }

    var items = getBreadcrumbItems();
    if (!items.length) {
      return;
    }

    if (getCurrentPageKey() === 'index.html') {
      injectBreadcrumbStructuredData(items);
      return;
    }

    var nav = document.createElement('nav');
    nav.className = 'breadcrumbs';
    nav.setAttribute('aria-label', 'Breadcrumb');

    var container = document.createElement('div');
    container.className = 'container';

    var list = document.createElement('ol');
    list.className = 'breadcrumbs-list';

    items.forEach(function (item, index) {
      var listItem = document.createElement('li');
      var isCurrent = index === items.length - 1;

      if (isCurrent) {
        var current = document.createElement('span');
        current.textContent = item.name;
        current.setAttribute('aria-current', 'page');
        listItem.appendChild(current);
      } else {
        var link = document.createElement('a');
        link.href = item.path;
        link.textContent = item.name;
        listItem.appendChild(link);
      }

      list.appendChild(listItem);
    });

    container.appendChild(list);
    nav.appendChild(container);

    var firstSection = main.querySelector('section');
    if (firstSection) {
      main.insertBefore(nav, firstSection);
    } else {
      main.prepend(nav);
    }

    injectBreadcrumbStructuredData(items);
  }

  function initializeApp() {
    initBreadcrumbs();
    initMobileNav();
    setFooterYear();
    initFooterLinks();
    initTrackedClicks();
    initHomeGallerySlideshow();
    initPanelCalculator();
    initContactForms();
    initThankYouPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
})();


