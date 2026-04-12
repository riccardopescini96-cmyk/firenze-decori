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
      var dots = [];
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

      if (dotsContainer) {
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
          var activeIndex = getActiveIndex();

          if (activeIndex === slidesCount - 1) {
            moveToIndex(0, 'smooth', false);
            return;
          }

          moveToIndex(activeIndex + 1, 'smooth', false);
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

    if (normalized === 'professionista' || normalized === 'installatore' || normalized === 'rivenditore') {
      return 'Firenze Decori — Richiesta Professionista';
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

  function initUnifiedFormToggle() {
    var toggles = document.querySelectorAll('.unified-mode-toggle');

    toggles.forEach(function (toggle) {
      var buttons = toggle.querySelectorAll('.unified-mode-btn');
      var hiddenInput = toggle.querySelector('input[name="request_type"]');
      var form = toggle.closest('form');
      var companyField = form ? form.querySelector('[data-company-field]') : null;

      function applyMode(mode) {
        var normalizedMode = mode === 'professionista' ? 'professionista' : 'privato';

        buttons.forEach(function (button) {
          var isActive = button.getAttribute('data-mode') === normalizedMode;
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        if (hiddenInput) {
          hiddenInput.value = normalizedMode;
        }

        if (companyField) {
          var isProfessional = normalizedMode === 'professionista';
          var companyInput = companyField.querySelector('input');

          companyField.classList.toggle('is-hidden', !isProfessional);
          companyField.hidden = !isProfessional;

          if (companyInput) {
            companyInput.required = isProfessional;
            if (!isProfessional) {
              companyInput.value = '';
            }
          }
        }
      }

      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          applyMode(button.getAttribute('data-mode'));
        });
      });

      var activeButton = toggle.querySelector('.unified-mode-btn.is-active');
      var initialMode = hiddenInput && hiddenInput.value
        ? hiddenInput.value
        : (activeButton ? activeButton.getAttribute('data-mode') : 'privato');

      applyMode(initialMode);
    });
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
    var companyValue = getFieldValue(form, 'company_name') || getFieldValue(form, 'company');
    var payload = {
      first_name: getFieldValue(form, 'first_name'),
      last_name: getFieldValue(form, 'last_name'),
      email: getFieldValue(form, 'email'),
      company: companyValue,
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
      payload.request_type = getFieldValue(form, 'request_type') || 'professionista';
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

  function attachFormspree(formSelector, endpointUrl, targetName) {
    var form = document.querySelector(formSelector);
    if (!form) {
      return;
    }

    var statusNode = ensureFormStatusNode(form);

    form.setAttribute('action', endpointUrl);
    form.setAttribute('method', 'POST');

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
    attachFormspree('#form-b2b', 'https://formspree.io/f/xeelddyr', 'b2b');
  }

  function initFaqTabs() {
    var tabs = document.querySelectorAll('.faq-tab');
    var items = document.querySelectorAll('.faq-item[data-audience][data-topic]');
    var groups = document.querySelectorAll('[data-faq-group]');

    if (!tabs.length || !items.length) {
      return;
    }

    function setActiveTab(activeTab) {
      tabs.forEach(function (tab) {
        var isActive = tab === activeTab;
        tab.classList.toggle('is-active', isActive);
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    function isVisible(item, filterKind, filterValue) {
      if (filterKind === 'all' || filterValue === 'all') {
        return true;
      }

      var audience = (item.getAttribute('data-audience') || '').toLowerCase();
      var topic = (item.getAttribute('data-topic') || '').toLowerCase();

      if (filterKind === 'audience') {
        return audience === filterValue || audience === 'tutti';
      }

      if (filterKind === 'topic') {
        return topic === filterValue;
      }

      return true;
    }

    function updateGroups() {
      groups.forEach(function (group) {
        var visibleItems = group.querySelectorAll('.faq-item:not(.faq-hidden)');
        group.classList.toggle('faq-hidden', !visibleItems.length);
      });
    }

    function applyFilter(tab) {
      var filterKind = tab.getAttribute('data-filter-kind') || 'all';
      var filterValue = (tab.getAttribute('data-filter-value') || 'all').toLowerCase();

      items.forEach(function (item) {
        item.classList.toggle('faq-hidden', !isVisible(item, filterKind, filterValue));
      });

      updateGroups();
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        setActiveTab(tab);
        applyFilter(tab);
      });
    });

    var defaultTab = document.querySelector('.faq-tab.is-active, .faq-tab.active') || tabs[0];
    if (!defaultTab) {
      return;
    }

    setActiveTab(defaultTab);
    applyFilter(defaultTab);
  }

  function getThankYouAudienceLabel(audience) {
    var normalized = (audience || '').toLowerCase();

    if (normalized === 'professionista' || normalized === 'installatore' || normalized === 'rivenditore' || normalized === 'b2b') {
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

  function initSmartMediaPreload() {
    var mediaNodes = document.querySelectorAll('video[data-smart-preload]');
    if (!mediaNodes.length) {
      return;
    }

    function warmupMedia(node) {
      if (!node || node.dataset.preloadReady === 'true') {
        return;
      }

      node.dataset.preloadReady = 'true';
      node.preload = 'metadata';
      node.load();
    }

    if (!('IntersectionObserver' in window)) {
      mediaNodes.forEach(warmupMedia);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        warmupMedia(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '240px 0px'
    });

    mediaNodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  function initMobileStickyCta() {
    var stickyNode = document.querySelector('.mobile-cta-sticky');
    var pageKey = getCurrentPageKey();
    var defaultPhone = '+393384519991';
    var stickyState = {
      frame: 0,
      visibilityFrame: 0,
      isVisible: false
    };
    var stickyRevealOffset = 36;
    var stickyConfigMap = {
      'index.html': {
        enabled: true,
        label: 'Vuoi informazioni o un preventivo?',
        secondaryKind: 'call',
        secondaryLabel: 'Chiama',
        note: ''
      },
      'rivestimenti-interni.html': {
        enabled: true,
        label: 'Vuoi informazioni o un preventivo?',
        secondaryKind: 'call',
        secondaryLabel: 'Chiama',
        note: ''
      },
      'come-funziona.html': {
        enabled: true,
        label: 'Vuoi informazioni o un preventivo?',
        secondaryKind: 'call',
        secondaryLabel: 'Chiama',
        note: ''
      },
      'faq.html': {
        enabled: true,
        label: 'Hai ancora una domanda?',
        secondaryKind: 'call',
        secondaryLabel: 'Chiama',
        note: ''
      },
      'fornitura-professionisti.html': {
        enabled: true,
        label: 'Richiedi catalogo o preventivo B2B',
        secondaryKind: 'call',
        secondaryLabel: 'Chiama',
        note: ''
      },
      'contatti.html': {
        enabled: true,
        label: 'Vuoi informazioni o un preventivo?',
        secondaryKind: 'call',
        secondaryLabel: 'Chiama',
        note: ''
      },
      'form-inviato.html': {
        enabled: false
      },
      'privacy-policy.html': {
        enabled: false
      },
      'cookie-policy.html': {
        enabled: false
      }
    };

    function getStickyConfig() {
      return stickyConfigMap[pageKey] || {
        enabled: false
      };
    }

    function getWhatsappHref() {
      var waNode = document.querySelector('a[href*="wa.me/"][href]');

      if (waNode) {
        return waNode.getAttribute('href') || ('https://wa.me/' + defaultPhone.replace('+', ''));
      }

      return 'https://wa.me/' + defaultPhone.replace('+', '');
    }

    function getCallHref() {
      var phoneNode = document.querySelector('a[href^="tel:"]');
      return phoneNode ? (phoneNode.getAttribute('href') || ('tel:' + defaultPhone)) : ('tel:' + defaultPhone);
    }

    function getContactConfig() {
      var localContactsNode = document.getElementById('contatti');
      var localHref = localContactsNode ? '#contatti' : 'contatti.html#contatti';

      if (pageKey === 'fornitura-professionisti.html') {
        return {
          href: '#contatti',
          label: 'Oppure compila il form B2B'
        };
      }

      if (pageKey === 'rivestimenti-interni.html') {
        return {
          href: localContactsNode ? '#contatti' : 'contatti.html#contatti',
          label: 'Oppure invia la richiesta dal modulo'
        };
      }

      if (pageKey === 'form-inviato.html') {
        return {
          href: 'contatti.html#contatti',
          label: 'Oppure invia una nuova richiesta'
        };
      }

      if (pageKey === 'privacy-policy.html' || pageKey === 'cookie-policy.html') {
        return {
          href: localHref,
          label: localContactsNode ? 'Oppure compila il modulo' : 'Oppure vai ai contatti'
        };
      }

      return {
        href: localHref,
        label: localContactsNode ? 'Oppure compila il modulo' : 'Oppure vai ai contatti'
      };
    }

    function createIconSvg(viewBox, pathD, extraClass) {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

      svg.setAttribute('class', extraClass || 'btn-cta-icon');
      svg.setAttribute('viewBox', viewBox);
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      path.setAttribute('d', pathD);
      svg.appendChild(path);

      return svg;
    }

    function createWhatsappIcon() {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      var fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      var strokePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');

      svg.setAttribute('class', 'btn-cta-icon');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');

      fillPath.setAttribute('d', 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z');
      strokePath.setAttribute('d', 'M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.413A9.956 9.956 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z');

      svg.appendChild(fillPath);
      svg.appendChild(strokePath);

      return svg;
    }

    function buildStickyNode() {
      var stickyConfig = getStickyConfig();
      var contactConfig = getContactConfig();
      var sticky = document.createElement('div');
      var label = document.createElement('p');
      var actions = document.createElement('div');
      var waButton = document.createElement('a');
      var secondaryButton = document.createElement('a');
      var formLink = document.createElement('a');
      var note = document.createElement('p');
      var waIcon = createWhatsappIcon();
      var callIcon = createIconSvg('0 0 16 16', 'M3 2.5C3 2.5 4 5 5.5 6.5c1.5 1.5 4 2.5 4 2.5l2-2 3 3c-1 2-3.5 3-6 1.5C6 10 4 8 2.5 5.5 1 3 2 1 3 2.5z');
      var waText = document.createElement('span');
      var secondaryText = document.createElement('span');

      sticky.className = 'mobile-cta-sticky';
      sticky.setAttribute('role', 'region');
      sticky.setAttribute('aria-label', 'Contatto rapido');

      label.className = 'mobile-cta-sticky-label';
      label.textContent = stickyConfig.label;

      actions.className = 'mobile-cta-sticky-actions';

      waButton.className = 'mobile-cta-sticky-btn mobile-cta-sticky-btn-wa';
      waButton.href = getWhatsappHref();
      waButton.target = '_blank';
      waButton.rel = 'noopener noreferrer';
      waButton.setAttribute('data-track', 'sticky_whatsapp');
      waText.textContent = 'WhatsApp';
      waButton.appendChild(waIcon);
      waButton.appendChild(waText);

      secondaryButton.className = 'mobile-cta-sticky-btn';
      secondaryText.textContent = stickyConfig.secondaryLabel;

      if (stickyConfig.secondaryKind === 'form') {
        secondaryButton.className += ' mobile-cta-sticky-btn-form';
        secondaryButton.href = contactConfig.href;
        secondaryButton.setAttribute('data-track', 'sticky_form');
      } else {
        secondaryButton.className += ' mobile-cta-sticky-btn-call';
        secondaryButton.href = getCallHref();
        secondaryButton.setAttribute('data-track', 'sticky_call');
        secondaryButton.appendChild(callIcon);
      }

      secondaryButton.appendChild(secondaryText);

      formLink.className = 'mobile-cta-sticky-link';
      formLink.href = contactConfig.href;
      formLink.textContent = contactConfig.label;
      formLink.setAttribute('data-track', 'sticky_contact');

      note.className = 'mobile-cta-sticky-note';
      note.textContent = stickyConfig.note || '';

      actions.appendChild(waButton);
      actions.appendChild(secondaryButton);
      sticky.appendChild(label);
      sticky.appendChild(actions);

      if (stickyConfig.secondaryKind === 'form') {
        sticky.appendChild(note);
      } else {
        sticky.appendChild(formLink);
      }

      return sticky;
    }

    function queueStickyMetricsUpdate() {
      if (stickyState.frame) {
        return;
      }

      stickyState.frame = window.requestAnimationFrame(function () {
        stickyState.frame = 0;

        if (!stickyNode) {
          return;
        }

        document.documentElement.style.setProperty('--mobile-cta-sticky-height', String(stickyState.isVisible ? (stickyNode.offsetHeight || 0) : 0) + 'px');

        if (!window.visualViewport) {
          document.documentElement.style.setProperty('--mobile-cta-viewport-shift', '0px');
          return;
        }

        var layoutHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
        var visualViewport = window.visualViewport;
        var viewportShift = Math.max(0, layoutHeight - (visualViewport.height + visualViewport.offsetTop));

        document.documentElement.style.setProperty('--mobile-cta-viewport-shift', String(viewportShift) + 'px');
      });
    }

    function isNearVideoOrForm() {
      var videoSection = document.querySelector('.video-presentation');
      var video = document.querySelector('.ig-reel-player, .ig-reel-wrapper');
      var forms = document.querySelectorAll('.contact-form-card, .unified-form');

      function isElementInViewport(el) {
        if (!el) return false;
        var rect = el.getBoundingClientRect();
        var windowHeight = window.innerHeight || document.documentElement.clientHeight;
        var visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        return visibleHeight > windowHeight * 0.3;
      }

      if (isElementInViewport(videoSection) || isElementInViewport(video)) return true;

      var formInView = false;
      forms.forEach(function (form) {
        if (isElementInViewport(form)) formInView = true;
      });

      return formInView;
    }

    function shouldShowSticky() {
      var hasScrolled = (window.scrollY || window.pageYOffset || 0) > stickyRevealOffset;
      if (!hasScrolled) return false;
      return !isNearVideoOrForm();
    }

    function syncStickyVisibility() {
      var isVisible;

      if (!stickyNode) {
        return;
      }

      isVisible = shouldShowSticky();

      if (stickyState.isVisible === isVisible) {
        return;
      }

      stickyState.isVisible = isVisible;
      stickyNode.classList.toggle('is-visible', isVisible);
      document.body.classList.toggle('has-mobile-cta-sticky-visible', isVisible);
      queueStickyMetricsUpdate();
    }

    function queueStickyVisibilityUpdate() {
      if (stickyState.visibilityFrame) {
        return;
      }

      stickyState.visibilityFrame = window.requestAnimationFrame(function () {
        stickyState.visibilityFrame = 0;
        syncStickyVisibility();
      });
    }

    if (!getStickyConfig().enabled) {
      if (stickyNode) {
        stickyNode.remove();
      }

      document.body.classList.remove('has-mobile-cta-sticky');
      document.body.classList.remove('has-mobile-cta-sticky-visible');
      document.documentElement.style.setProperty('--mobile-cta-sticky-height', '0px');
      document.documentElement.style.setProperty('--mobile-cta-viewport-shift', '0px');
      return;
    }

    if (!stickyNode) {
      stickyNode = buildStickyNode();
      document.body.appendChild(stickyNode);
    }

    if (!stickyNode) {
      return;
    }

    document.body.classList.add('has-mobile-cta-sticky');

    if ('ResizeObserver' in window) {
      var resizeObserver = new ResizeObserver(queueStickyMetricsUpdate);
      resizeObserver.observe(stickyNode);
    }

    window.addEventListener('scroll', queueStickyVisibilityUpdate, { passive: true });
    window.addEventListener('resize', queueStickyMetricsUpdate);
    window.addEventListener('orientationchange', queueStickyMetricsUpdate);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', queueStickyMetricsUpdate);
      window.visualViewport.addEventListener('scroll', queueStickyMetricsUpdate);
    }

    syncStickyVisibility();
    queueStickyMetricsUpdate();
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
      'fornitura-professionisti-v2.html': 'Fornitura professionisti',
      'rivestimenti-interni.html': 'Rivestimenti interni',
      'faq.html': 'FAQ',
      'come-funziona.html': 'Come funziona',
      'contatti.html': 'Contatti',
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
    initMobileStickyCta();
    initTrackedClicks();
    initHomeGallerySlideshow();
    initFaqTabs();
    initPanelCalculator();
    initUnifiedFormToggle();
    initContactForms();
    initThankYouPage();
    initSmartMediaPreload();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
})();
