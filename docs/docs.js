// Mobile nav: the hamburger toggles the sidebar as an off-canvas drawer.
// Desktop is unaffected (the button is display:none above the breakpoint).
(function () {
  var side = document.querySelector('.side');
  var btn = document.querySelector('.navtoggle');
  if (!side || !btn) return;

  var ov = document.createElement('div');
  ov.className = 'nav-ov';
  document.body.appendChild(ov);

  function set(open) {
    document.body.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  btn.addEventListener('click', function () {
    set(!document.body.classList.contains('nav-open'));
  });
  ov.addEventListener('click', function () { set(false); });
  // Close after picking a destination (cross-page link or in-page anchor).
  side.addEventListener('click', function (e) {
    if (e.target.closest('a')) set(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') set(false);
  });
})();
