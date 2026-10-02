// Aethyr "buy me a coffee" chip. One shared implementation for every Aethyr page.
// Just a link to Ko-fi: no widget, no third-party script.
(function () {
  'use strict';

  var URL = 'https://ko-fi.com/dougfessler';

  function chipHtml(extraClass) {
    return '<a class="support-chip' + (extraClass ? ' ' + extraClass : '') + '" href="' + URL + '"'
      + ' target="_blank" rel="noopener" title="Buy me a potion (opens ko-fi.com)" aria-label="Buy me a potion">'
      + '<svg class="sc-mark" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">'
      + '<defs><linearGradient id="sc-potion-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2fb9ff"/><stop offset="1" stop-color="#9b6bff"/></linearGradient></defs>'
      + '<path d="M6 1.6h4v1.6H6z" fill="#b98a5a"/>'
      + '<path d="M6.4 3.2h3.2v2.6c0 .5.3.9.7 1.3A4.6 4.6 0 1 1 5.7 7.1c.4-.4.7-.8.7-1.3z" fill="url(#sc-potion-g)" fill-opacity=".9" stroke="#8fe3ff" stroke-width=".8" stroke-linejoin="round"/>'
      + '<circle cx="6.6" cy="10.4" r=".8" fill="#fff" fill-opacity=".7"/></svg>'
      + '<span class="sc-label sc-long" data-label="Buy me a potion">Buy me a potion</span>'
      + '<span class="sc-label sc-short" data-label="Potion" aria-hidden="true">Potion</span>'
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
