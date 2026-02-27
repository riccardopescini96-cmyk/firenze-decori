(function () {
  'use strict';

  var body = document.body;
  var navToggle = document.querySelector('.nav-toggle');
  var navWrapper = document.querySelector('.nav-wrapper');
  var desktopMinWidth = 768;

  function setNavOpen(isOpen) {
    body.classList.toggle('nav-open', isOpen);

    if (navToggle) {
      navToggle.setAttribute('aria-expanded', String(isOpen));
    }

    if (navWrapper) {
      navWrapper.setAttribute('aria-hidden', String(!isOpen));
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
      if (window.innerWidth >= desktopMinWidth) {
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
    var slider = document.querySelector('.home-gallery .gallery-grid[data-mobile-slideshow]');
    if (!slider) {
      return;
    }

    var slides = slider.querySelectorAll('figure');
    var dots = document.querySelectorAll('.home-gallery .gallery-dot');
    var mobileQuery = window.matchMedia('(max-width: 767px)');
    var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var activeIndex = 0;
    var autoTimer = null;
    var scrollTimer = null;

    if (slides.length < 2) {
      return;
    }

    function setActiveDot(index) {
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function goToSlide(index, behavior) {
      var boundedIndex = Math.max(0, Math.min(index, slides.length - 1));
      var target = slides[boundedIndex];
      if (!target) {
        return;
      }

      activeIndex = boundedIndex;
      setActiveDot(activeIndex);

      slider.scrollTo({
        left: target.offsetLeft,
        behavior: behavior || 'smooth'
      });
    }

    function stopAuto() {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    function startAuto() {
      stopAuto();
      if (!mobileQuery.matches || reduceMotionQuery.matches) {
        return;
      }

      autoTimer = window.setInterval(function () {
        var next = activeIndex + 1;
        if (next >= slides.length) {
          next = 0;
        }
        goToSlide(next, 'smooth');
      }, 3500);
    }

    function syncFromScroll() {
      var width = slider.clientWidth || 1;
      var nextIndex = Math.round(slider.scrollLeft / width);
      if (nextIndex !== activeIndex) {
        activeIndex = Math.max(0, Math.min(nextIndex, slides.length - 1));
        setActiveDot(activeIndex);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var index = Number(dot.getAttribute('data-slide-to') || 0);
        goToSlide(index, 'smooth');
        startAuto();
      });
    });

    slider.addEventListener('scroll', function () {
      if (!mobileQuery.matches) {
        return;
      }

      if (scrollTimer) {
        window.clearTimeout(scrollTimer);
      }

      scrollTimer = window.setTimeout(syncFromScroll, 80);
    });

    slider.addEventListener('touchstart', stopAuto, { passive: true });
    slider.addEventListener('touchend', startAuto);

    function handleViewportChange() {
      goToSlide(activeIndex, 'auto');
      if (mobileQuery.matches) {
        startAuto();
      } else {
        stopAuto();
      }
    }

    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', handleViewportChange);
    } else if (typeof mobileQuery.addListener === 'function') {
      mobileQuery.addListener(handleViewportChange);
    }

    if (typeof reduceMotionQuery.addEventListener === 'function') {
      reduceMotionQuery.addEventListener('change', handleViewportChange);
    } else if (typeof reduceMotionQuery.addListener === 'function') {
      reduceMotionQuery.addListener(handleViewportChange);
    }

    window.addEventListener('resize', handleViewportChange);

    goToSlide(0, 'auto');
    startAuto();
  }

  function initPanelCalculator() {
    var calculator = document.querySelector('[data-panel-calculator]');
    if (!calculator) {
      return;
    }

    var input = calculator.querySelector('[name="area_m2"]');
    var resultNode = calculator.querySelector('.panel-calc-result');
    var panelAreaM2 = 1.22 * 2.44;

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

  function initContactForm() {
    var form = document.querySelector('.contacts form');
    if (!form) {
      return;
    }

    var statusNode = form.querySelector('.form-status');

    form.addEventListener('submit', function (event) {
      var endpoint = form.getAttribute('action') || '';
      if (!endpoint || endpoint.indexOf('XXXXX') !== -1) {
        setFormStatus(
          statusNode,
          'Configura l\'endpoint Formspree per inviare il modulo.',
          'is-error'
        );
        return;
      }

      event.preventDefault();

      var submitButton = form.querySelector('[type="submit"]');
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

          form.reset();
          setFormStatus(
            statusNode,
            'Richiesta inviata con successo. Ti contatteremo al più presto.',
            'is-success'
          );

          trackEvent('lead_form_submit', {
            user_type: formData.get('user_type') || 'unknown'
          });
        })
        .catch(function () {
          setFormStatus(
            statusNode,
            'Invio non riuscito. Riprova tra qualche minuto.',
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

  initMobileNav();
  setFooterYear();
  initTrackedClicks();
  initHomeGallerySlideshow();
  initPanelCalculator();
  initContactForm();
})();


