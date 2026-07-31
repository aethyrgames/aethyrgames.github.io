// Start-up, in order: restore the saved layout and preferences, load the
// projects and templates, draw everything once, and open a shared document if
// the URL carries one. Loads last, so everything it calls is defined.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.

// ---------- init ----------

loadLayout();
buildPanels();
try {
  const hb = JSON.parse(localStorage.getItem(HOTBAR_KEY) || 'null');
  if (Array.isArray(hb)) hb.forEach((t, i) => { if (i < hotbar.length) hotbar[i] = t; });
} catch (e) {}
// a bar that starts empty never gets discovered, so seed it with common widgets
if (!hotbar.some(Boolean)) {
  ['button', 'text', 'checkbox', 'sliderfloat', 'inputtext', 'separator', 'group']
    .forEach((t, i) => { hotbar[i] = t; });
  saveHotbar();
}
try {
  const g = JSON.parse(localStorage.getItem('imguistudio.guides') || '[]');
  if (Array.isArray(g)) guides = g;
} catch (e) {}
renderGuides();
setRulers(localStorage.getItem('imguistudio.rulers') !== '0');
setGrid(localStorage.getItem('imguistudio.grid') !== '0');

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

document.getElementById('filter').addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.target.value = ''; renderPalette(); e.target.blur(); }
});

