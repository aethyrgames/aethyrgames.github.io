// Aethyr "buy me a coffee" chip. One shared implementation for every Aethyr page.
// Just a link to Ko-fi: no widget, no third-party script.
(function () {
  'use strict';

  var URL = 'https://ko-fi.com/dougfessler';

  function chipHtml(extraClass) {
    return '<a class="support-chip' + (extraClass ? ' ' + extraClass : '') + '" href="' + URL + '"'
      + ' target="_blank" rel="noopener" title="Opens ko-fi.com">'
      + '<img class="sc-mark" src="/img/brand/aethyr-crystal.svg" alt="" aria-hidden="true" width="16" height="16">'
      + '<span class="sc-label sc-long" data-label="Buy me a coffee">Buy me a coffee</span>'
      + '<span class="sc-label sc-short" data-label="Coffee" aria-hidden="true">Coffee</span>'
      + '</a>';
  }

  function footerHtml() {
    return '<p class="foot-support">Aethyr is free and stays free. If it saves you time, you can '
      + chipHtml('support-chip-foot') + '</p>';
  }

  // Random, rare glitch burst. A fixed cadence reads as a metronome, so the gap is random.
  // Skipped while the tab is hidden and when the visitor asked for reduced motion.
  function wireGlitch() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var chips = document.querySelectorAll('.support-chip:not([data-wired])');
    Array.prototype.forEach.call(chips, function (chip) {
      chip.setAttribute('data-wired', '1');
      var burst = function () {
        if (document.hidden) return;
        chip.classList.add('is-glitch');
        setTimeout(function () { chip.classList.remove('is-glitch'); }, 600);
      };
      var schedule = function () {
        setTimeout(function () { burst(); schedule(); }, 14000 + Math.random() * 20000);
      };
      setTimeout(function () { burst(); schedule(); }, 2500 + Math.random() * 3000);
    });
  }

  window.AethyrSupport = { chipHtml: chipHtml, footerHtml: footerHtml, wire: wireGlitch };

  // Home page: the header is static HTML, and main.js rewrites only #site-nav-links,
  // so a chip placed in the header beside it survives the JSON-driven render.
  function mountHomeNav() {
    var nav = document.querySelector('header.nav');
    if (!nav || nav.querySelector('.support-chip')) return;
    var holder = document.createElement('span');
    holder.className = 'nav-support';
    holder.innerHTML = chipHtml();
    var toggle = document.getElementById('nav-toggle');
    nav.insertBefore(holder, toggle || null);
  }

  if (document.querySelector('header.nav')) mountHomeNav();
  wireGlitch();
})();
