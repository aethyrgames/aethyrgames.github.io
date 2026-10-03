/*
 * insights.js: interaction analytics, described in the site's privacy notice.
 *
 * Adds two GA4 events on top of the page's existing gtag setup:
 *   ui_click      a click on a link, button or [data-track] element.
 *                 click_text   = its visible label (max 100 chars, email addresses removed)
 *                 click_target = where it points: same-site path, external host+path,
 *                                "mailto" for email links; never a query string
 *                 page_section = id of the nearest enclosing element that has one
 *   section_view  an h2 heading that stayed at least half on screen for one second,
 *                 sent once per heading per page view. section_name = the heading text.
 *
 * Never collected here: keystrokes, form field contents, selected or copied text,
 * mouse position, session replays. Mark an element with data-no-track to exclude it.
 *
 * If the browser sends Global Privacy Control or Do Not Track, none of this runs.
 */
(function () {
  'use strict';

  var nav = window.navigator || {};
  if (nav.globalPrivacyControl === true || nav.doNotTrack === '1' || window.doNotTrack === '1') return;

  // Some pages keep gtag private (MkDocs Material does), so fall back to the
  // dataLayer it reads from. gtag only accepts an `arguments` object there.
  function send(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
    else if (Array.isArray(window.dataLayer)) (function () { window.dataLayer.push(arguments); })('event', name, params);
  }

  function clean(str, max) {
    return String(str || '')
      .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email]')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  }

  // ---- clicks -------------------------------------------------------------
  function targetOf(el) {
    if (el.tagName === 'A') {
      var href = el.getAttribute('href') || '';
      if (/^mailto:/i.test(href)) return 'mailto';
      if (/^(tel|sms):/i.test(href)) return 'phone';
      try {
        var u = new URL(href, location.href);
        return u.origin === location.origin ? u.pathname + u.hash : u.host + u.pathname;
      } catch (e) {
        return '';
      }
    }
    return el.id ? '#' + el.id : el.tagName.toLowerCase();
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    var el = t && t.closest ? t.closest('a[href], button, [role="button"], [data-track]') : null;
    if (!el || el.closest('[data-no-track]')) return;
    var label = el.getAttribute('data-track') || el.getAttribute('aria-label') ||
                el.textContent || el.getAttribute('title') || '';
    var section = el.parentElement && el.parentElement.closest('[id]');
    send('ui_click', {
      click_text: clean(label, 100),
      click_target: clean(targetOf(el), 100),
      page_section: section ? clean(section.id, 60) : ''
    });
  }, { capture: true, passive: true });

  // ---- sections viewed ----------------------------------------------------
  if ('IntersectionObserver' in window && 'WeakSet' in window) {
    var watched = new WeakSet();
    var seen = {};
    var timers = new Map();

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var h = entry.target;
        if (entry.isIntersecting) {
          if (timers.has(h)) return;
          timers.set(h, setTimeout(function () {
            timers.delete(h);
            if (!h.isConnected) return;
            var name = clean(h.textContent, 80);
            if (!name || seen[name]) return;
            seen[name] = true;
            send('section_view', { section_name: name });
          }, 1000));
        } else if (timers.has(h)) {
          clearTimeout(timers.get(h));
          timers.delete(h);
        }
      });
    }, { threshold: 0.5 });

    // Pages that swap their content in place (the hash routes on the home page)
    // start a fresh count once the old headings leave the DOM. In-page anchor
    // jumps don't remove headings, so they don't reset it.
    var tracked = [];
    var scan = function () {
      var swapped = false;
      tracked = tracked.filter(function (h) {
        if (h.isConnected) return true;
        io.unobserve(h);
        swapped = true;
        return false;
      });
      if (swapped) seen = {};
      var hs = document.getElementsByTagName('h2');
      for (var i = 0; i < hs.length; i++) {
        if (!watched.has(hs[i]) && !hs[i].closest('[data-no-track]')) {
          watched.add(hs[i]);
          tracked.push(hs[i]);
          io.observe(hs[i]);
        }
      }
    };

    var queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      setTimeout(function () { queued = false; scan(); }, 250);
    }).observe(document.documentElement, { childList: true, subtree: true });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
    else scan();
  }
})();
