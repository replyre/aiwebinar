/* =========================================================================
   Innovgeist — AI Education Partnership
   No dependencies. Every enhancement degrades gracefully without JS.
   ========================================================================= */
(function () {
  'use strict';

  /* -----------------------------------------------------------------------
     CONFIG

     FORM_ENDPOINT — FormSubmit.co AJAX endpoint. Submissions are emailed to
     CONTACT_EMAIL and copied to CONTACT_CC; nothing is stored anywhere.

     ACTIVATION (one-time, required): the very first POST makes FormSubmit
     send a "Confirm your email" message to CONTACT_EMAIL. Until someone
     clicks the link in it, submissions are accepted but never delivered.

     To keep the address out of the page source, create a masked endpoint at
     formsubmit.co and swap in 'https://formsubmit.co/ajax/el/xxxxxxx'.

     Leave FORM_ENDPOINT empty to fall back to opening the visitor's mail
     client with the enquiry pre-filled — so the form is never a dead end.
     ----------------------------------------------------------------------- */
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/support@innovgeist.com';
  var CONTACT_EMAIL = 'support@innovgeist.com';
  var CONTACT_CC = 'replyrgupta@gmail.com';

  /* Must match the mobile-navigation breakpoint in styles.css. */
  var MOBILE_NAV_MAX = 1120;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ============================ Scroll reveal =========================== */
  function initReveal() {
    var targets = $$('[data-reveal]');
    if (!targets.length) return;

    targets.forEach(function (el) {
      var d = el.getAttribute('data-reveal-delay');
      if (d) el.style.setProperty('--reveal-delay', d);
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var pending = targets.slice();

    function show(el) {
      el.classList.add('is-visible');
      var i = pending.indexOf(el);
      if (i > -1) pending.splice(i, 1);
      io.unobserve(el);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        // `top < 0` catches an element already above the viewport by the time
        // its notification is delivered.
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) show(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    targets.forEach(function (el) { io.observe(el); });

    // Safety net. A fast flick, a scrollbar drag or an in-page jump can carry
    // an element from below the fold to above it with no frame in between
    // where it intersects — no notification is ever delivered, and the content
    // would stay invisible for good. Sweep what's left on scroll.
    var queued = false;

    function sweep() {
      queued = false;
      var fold = window.innerHeight;
      pending.slice().forEach(function (el) {
        if (el.getBoundingClientRect().top < fold) show(el);
      });
      if (!pending.length) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    }

    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sweep);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  /* ========================= Header: stuck state ======================== */
  function initHeader() {
    var header = $('[data-header]');
    if (!header) return;
    var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* =========================== Mobile navigation ======================== */
  function initNav() {
    var toggle = $('[data-nav-toggle]');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    var isMobile = function () {
      return window.matchMedia('(max-width: ' + MOBILE_NAV_MAX + 'px)').matches;
    };

    // The menu/close glyphs are swapped by CSS off aria-expanded.
    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && isMobile()) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      setOpen(false);
    });

    window.addEventListener('resize', function () {
      if (!isMobile() && nav.classList.contains('is-open')) setOpen(false);
    });
  }

  /* ====================== Active section in the nav ===================== */
  function initActiveNav() {
    var links = $$('.nav-list a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      map[id] = link;
      sections.push(section);
    });
    if (!sections.length) return;

    var visible = [];

    function highlight() {
      // Topmost visible section wins, so the marker never jitters.
      var best = null;
      var bestTop = Infinity;
      visible.forEach(function (id) {
        var top = document.getElementById(id).getBoundingClientRect().top;
        if (top < bestTop) { bestTop = top; best = id; }
      });
      links.forEach(function (l) { l.classList.remove('is-active'); });
      if (best && map[best]) map[best].classList.add('is-active');
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var i = visible.indexOf(entry.target.id);
        if (entry.isIntersecting && i === -1) visible.push(entry.target.id);
        else if (!entry.isIntersecting && i > -1) visible.splice(i, 1);
      });
      highlight();
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ============================== Carousel ============================== */
  function initCarousel() {
    $$('[data-carousel]').forEach(function (root) {
      var track = $('[data-carousel-track]', root);
      var dotsWrap = $('[data-carousel-dots]', root);
      var slides = track ? $$('.carousel__slide', track) : [];
      if (!track || slides.length < 2) return;

      var AUTOPLAY_MS = 7000;
      var index = 0;
      var timer = null;
      var dots = [];

      // Build the dots from the slides so markup and behaviour can't drift.
      if (dotsWrap) {
        slides.forEach(function (slide, i) {
          var label = (slide.getAttribute('aria-label') || '').split('—').pop().trim() ||
            'Slide ' + (i + 1);
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'carousel__dot';
          dot.setAttribute('aria-label', 'Show ' + label);
          dot.addEventListener('click', function () { go(i, true); });
          dotsWrap.appendChild(dot);
          dots.push(dot);
        });
      }

      function go(next, stop) {
        index = (next + slides.length) % slides.length;
        track.style.transform = 'translateX(' + (-100 * index) + '%)';
        slides.forEach(function (s, i) {
          // Keep off-screen slides out of the tab order and the a11y tree.
          s.setAttribute('aria-hidden', String(i !== index));
          $$('a, button', s).forEach(function (el) { el.tabIndex = i === index ? 0 : -1; });
        });
        dots.forEach(function (d, i) { d.setAttribute('aria-current', String(i === index)); });
        if (stop) pause();
      }

      function play() {
        if (reduceMotion || timer) return;
        timer = setInterval(function () { go(index + 1); }, AUTOPLAY_MS);
      }
      function pause() {
        if (!timer) return;
        clearInterval(timer);
        timer = null;
      }

      var prev = $('[data-carousel-prev]', root);
      var next = $('[data-carousel-next]', root);
      if (prev) prev.addEventListener('click', function () { go(index - 1, true); });
      if (next) next.addEventListener('click', function () { go(index + 1, true); });

      root.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1, true); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1, true); }
      });

      // Hovering or tabbing in shouldn't yank the card out from under you.
      root.addEventListener('mouseenter', pause);
      root.addEventListener('mouseleave', play);
      root.addEventListener('focusin', pause);
      root.addEventListener('focusout', function (e) {
        if (!root.contains(e.relatedTarget)) play();
      });

      // Horizontal swipe on touch devices.
      var startX = null;
      var startY = null;
      root.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        pause();
      }, { passive: true });
      root.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;
        // Ignore mostly-vertical drags so page scrolling still works.
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
        startX = startY = null;
        play();
      }, { passive: true });

      // Don't spend cycles animating a carousel that's scrolled out of view.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) { entry.isIntersecting ? play() : pause(); });
        }, { threshold: 0.25 }).observe(root);
      } else {
        play();
      }

      go(0);
    });
  }

  /* =============================== Tabs ================================= */
  function initTabs() {
    $$('[data-tabs]').forEach(function (root) {
      var tabs = $$('[role="tab"]', root);
      if (!tabs.length) return;

      function select(tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { select(tab); });

        tab.addEventListener('keydown', function (e) {
          var next = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
          else if (e.key === 'Home') next = tabs[0];
          else if (e.key === 'End') next = tabs[tabs.length - 1];
          if (!next) return;
          e.preventDefault();
          select(next, true);
        });
      });
    });
  }

  /* ========================== Layer diagram ============================= */
  function initLayers() {
    $$('[data-layers]').forEach(function (root) {
      var layers = $$('.layer', root);

      layers.forEach(function (layer) {
        var btn = $('.layer__btn', layer);
        if (!btn) return;

        btn.addEventListener('click', function () {
          var open = !layer.classList.contains('is-open');
          // One layer at a time keeps the stack readable.
          layers.forEach(function (other) {
            other.classList.remove('is-open');
            var b = $('.layer__btn', other);
            if (b) b.setAttribute('aria-expanded', 'false');
          });
          if (open) {
            layer.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
          }
        });
      });

      // Open the foundation layer so the section never reads as inert.
      var first = layers[layers.length - 1];
      if (first) {
        first.classList.add('is-open');
        var b = $('.layer__btn', first);
        if (b) b.setAttribute('aria-expanded', 'true');
      }
    });
  }

  /* ============================= Counters =============================== */
  function initCounters() {
    var els = $$('[data-count-to]');
    if (!els.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.textContent = el.getAttribute('data-count-to'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        run(entry.target);
      });
    }, { threshold: 0.4 });

    els.forEach(function (el) { io.observe(el); });

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count-to')) || 0;
      var duration = 1100;
      var start = null;

      function frame(now) {
        if (start === null) start = now;
        var p = Math.min(1, (now - start) / duration);
        // easeOutCubic
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = String(target);
      }
      requestAnimationFrame(frame);
    }
  }

  /* ============================ FAQ accordion =========================== */
  function initFaq() {
    var root = $('[data-faq]');
    if (!root) return;
    var items = $$('details', root);
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) { if (other !== item) other.open = false; });
      });
    });
  }

  /* ============================== Lightbox ============================== */
  function initLightbox() {
    var box = $('[data-lightbox]');
    var gallery = $('[data-gallery]');
    if (!box || !gallery) return;

    var img = $('[data-lightbox-img]', box);
    var caption = $('[data-lightbox-caption]', box);
    var closeBtn = $('.lightbox__close', box);
    var lastFocused = null;

    function open(btn) {
      var thumb = $('img', btn);
      lastFocused = btn;
      img.src = btn.getAttribute('data-full') || (thumb && thumb.src) || '';
      img.alt = (thumb && thumb.alt) || '';
      caption.textContent = btn.getAttribute('data-caption') || '';
      box.hidden = false;
      document.body.classList.add('is-locked');
      closeBtn.focus();
    }

    function close() {
      box.hidden = true;
      img.src = '';
      document.body.classList.remove('is-locked');
      if (lastFocused) lastFocused.focus();
    }

    gallery.addEventListener('click', function (e) {
      var btn = e.target.closest('.gallery__btn');
      if (btn) open(btn);
    });

    box.addEventListener('click', function (e) {
      if (e.target.closest('[data-lightbox-close]')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      // Only the close button is focusable inside, so keep Tab on it.
      if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
    });
  }

  /* ============================ Contact form ============================ */
  function initForm() {
    var form = $('[data-contact-form]');
    if (!form) return;

    var status = $('[data-form-status]', form);
    var submit = $('button[type="submit"]', form);
    var submitLabel = submit ? submit.innerHTML : '';

    function setStatus(message, state) {
      if (!status) return;
      status.textContent = message;
      status.hidden = !message;
      if (state) status.setAttribute('data-state', state);
      else status.removeAttribute('data-state');
    }

    function showError(field, message) {
      field.setAttribute('aria-invalid', 'true');
      var note = form.querySelector('[data-error-for="' + field.id + '"]');
      if (note) { note.textContent = message; note.hidden = false; }
    }

    function clearError(field) {
      field.removeAttribute('aria-invalid');
      var note = form.querySelector('[data-error-for="' + field.id + '"]');
      if (note) { note.textContent = ''; note.hidden = true; }
    }

    function validate() {
      var firstBad = null;
      $$('[required]', form).forEach(function (field) {
        clearError(field);
        var value = field.value.trim();
        var message = '';

        if (!value) message = 'This field is required.';
        else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          message = 'Enter a valid email address.';
        }

        if (message) {
          showError(field, message);
          if (!firstBad) firstBad = field;
        }
      });
      return firstBad;
    }

    form.addEventListener('input', function (e) {
      if (e.target.hasAttribute('aria-invalid')) clearError(e.target);
    });

    /* Labelled payload for FormSubmit. Object keys become the row labels in
       the notification email, so they read as prose rather than field names.
       Keys prefixed `_` are FormSubmit directives, not form data. */
    function buildPayload(data) {
      var programs = data.getAll('programs');
      var institution = data.get('institution') || 'New enquiry';

      return {
        'Institution': institution,
        'Name': data.get('name') || '—',
        'Role / designation': data.get('role') || '—',
        'Email': data.get('email') || '—',
        'Phone': data.get('phone') || '—',
        'Approx. participants': data.get('participants') || '—',
        'Programs of interest': programs.length ? programs.join(', ') : '—',
        'Preferred timeframe': data.get('timeframe') || '—',
        'Message': data.get('message') || '—',

        _subject: 'AI Education Partnership enquiry — ' + institution,
        _template: 'table',
        _cc: CONTACT_CC,
        // Reply-To on the notification, so Reply reaches the enquirer.
        _replyto: data.get('email') || '',
        _autoresponse:
          'Thank you for reaching out to Innovgeist Technologies. We have received ' +
          'your request and will get back to you within two working days.\n\n' +
          'Regards,\nInnovgeist Technologies Pvt. Ltd.\n' +
          CONTACT_EMAIL + ' | +91 81272 73162',
        // No interstitial CAPTCHA page — required for the AJAX endpoint.
        _captcha: 'false',
        // Honeypot: bots fill the hidden input, humans cannot see it.
        _honey: data.get('_honey') || ''
      };
    }

    function buildMailto(data) {
      var programs = data.getAll('programs');
      var lines = [
        'Institution: ' + (data.get('institution') || '—'),
        'Name: ' + (data.get('name') || '—'),
        'Role: ' + (data.get('role') || '—'),
        'Email: ' + (data.get('email') || '—'),
        'Phone: ' + (data.get('phone') || '—'),
        'Approx. participants: ' + (data.get('participants') || '—'),
        'Programs of interest: ' + (programs.length ? programs.join(', ') : '—'),
        'Preferred timeframe: ' + (data.get('timeframe') || '—'),
        '',
        'Message:',
        data.get('message') || '—'
      ];
      var subject = 'AI Education Partnership enquiry — ' + (data.get('institution') || 'New enquiry');
      return 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        (CONTACT_CC ? '&cc=' + encodeURIComponent(CONTACT_CC) : '') +
        '&body=' + encodeURIComponent(lines.join('\n'));
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstBad = validate();
      if (firstBad) {
        setStatus('Please correct the highlighted fields.', 'error');
        firstBad.focus();
        return;
      }

      var data = new FormData(form);

      if (!FORM_ENDPOINT) {
        window.location.href = buildMailto(data);
        setStatus(
          'Your email app is opening with these details filled in. If nothing ' +
          'happens, write to ' + CONTACT_EMAIL + ' directly.'
        );
        return;
      }

      // Silently accept and discard anything that trips the honeypot.
      if (data.get('_honey')) {
        form.reset();
        setStatus('Thank you — your request has been sent. We reply within two working days.');
        return;
      }

      if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }
      setStatus('');

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(buildPayload(data))
      })
        .then(function (res) { return res.json(); })
        .then(function (body) {
          // FormSubmit reports failures in the body, so res.ok is not enough.
          if (String(body.success) !== 'true') {
            throw new Error(body.message || 'Request rejected');
          }
          form.reset();
          setStatus('Thank you — your request has been sent. We reply within two working days.');
        })
        .catch(function () {
          setStatus(
            'Something went wrong sending the form. Please email ' +
            CONTACT_EMAIL + ' or call +91 81272 73162.',
            'error'
          );
        })
        .finally(function () {
          if (submit) { submit.disabled = false; submit.innerHTML = submitLabel; }
        });
    });
  }

  /* ============================== Footer year =========================== */
  function initYear() {
    var el = $('[data-year]');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ================================ Boot =============================== */
  function boot() {
    initHeader();
    initNav();
    initActiveNav();
    initCarousel();
    initTabs();
    initLayers();
    initCounters();
    initReveal();
    initFaq();
    initLightbox();
    initForm();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
