// Start-up, in order: restore the saved layout and preferences, load the

// The engine boots through the profile, before engine-adjacent shell code
// expects it and before an imgui page's engine.js script tag executes (that
// script reads the global Module this call assembles).
PROFILE.engine.boot({
  canvas: document.getElementById('canvas'),
  onReady: () => engineDidBoot(),
});
// projects and templates, draw everything once, and open a shared document if
// the URL carries one. Loads last, so everything it calls is defined.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.

// ---------- init ----------

loadLayout();
buildPanels();
const hb = lsJson(HOTBAR_KEY, null);
if (Array.isArray(hb)) hb.forEach((t, i) => { if (i < hotbar.length) hotbar[i] = t; });
// A bar that starts empty never gets discovered, so seed it with common
// widgets on first run. Gated on the key being absent, not just on the bar
// being empty: a user who unpins every slot on purpose saves an all-null
// array, and without this check that reseeded on the very next reload.
if (!Array.isArray(hb) && !hotbar.some(Boolean)) {
  ['button', 'text', 'checkbox', 'sliderfloat', 'inputtext', 'separator', 'group']
    .forEach((t, i) => { hotbar[i] = t; });
  saveHotbar();
}
const g = lsJson(PROFILE.storagePrefix + '.guides', []);
if (Array.isArray(g)) guides = g;
renderGuides();
// lsGet, not localStorage.getItem. A browser that blocks storage THROWS here,
// and a throw at the top level of this file stopped the app starting at all:
// no palette, no projects, no first render.
setRulers(lsGet(PROFILE.storagePrefix + '.rulers') !== '0');
setGrid(lsGet(PROFILE.storagePrefix + '.grid') !== '0');

renderPalette();
loadProjects();      // adopts the old single-document save on first run
loadTemplates();
renderTemplates();
renderProjectTabs();
refresh();
// the loaded document is the undo floor
pushHistory();
syncCanvasSize();
applyPan();
// a #d= fragment opens as its own project, so a link never eats your work
loadSharedFromUrl();
// Pasting a share link into a tab that is already open only changes the
// fragment, which fires no load event, so without this the link just sat
// there unopened until the user happened to reload.
window.addEventListener('hashchange', () => { loadSharedFromUrl(); });

document.getElementById('filter').addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.target.value = ''; renderPalette(); e.target.blur(); }
});

