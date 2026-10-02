// Aethyr's latest release, for any page that shows a version or date.
//
// data/release.json is the baseline. It's same-origin, so it loads even when
// GitHub's API is rate-limited or blocked, and the version always shows. The
// API is then asked for the newest release, and if it answers, its tag and date
// win, so the page stays current between edits to release.json.
//
// AethyrRelease.onRelease(fn) calls fn with {tag, date, url}. It can call fn a
// second time when the API reports something different from release.json, so
// fn should overwrite what it rendered rather than append to it.
(function () {
  var REPO = 'aethyrgames/aethyr-mcp-releases';
  var root = (document.currentScript && document.currentScript.src)
    ? new URL('../', document.currentScript.src).href
    : '/';
  var listeners = [];
  var current = null;

  function publish(rel) {
    if (!rel || !rel.tag) return;
    if (current && current.tag === rel.tag && current.date === rel.date) return;
    current = rel;
    listeners.forEach(function (fn) {
      try { fn(rel); } catch (e) { console.warn('release render failed:', e); }
    });
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  }

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // "v0.6.1 · October 1, 2026 · release notes", as HTML.
  function lineHtml(rel, prefix) {
    var parts = [(prefix || 'Latest release') + ' <b>' + escHtml(rel.tag) + '</b>'];
    if (rel.date) parts.push(escHtml(formatDate(rel.date)));
    if (rel.url) parts.push('<a href="' + escHtml(rel.url) + '">release notes</a>');
    return parts.join(' · ');
  }

  fetch(root + 'data/release.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(publish)
    .catch(function (err) { console.warn('release.json skipped:', err); })
    .then(function () {
      return fetch('https://api.github.com/repos/' + REPO + '/releases/latest', {
        headers: { Accept: 'application/vnd.github+json' }
      });
    })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (rel) {
      if (!rel || !rel.tag_name) return;
      publish({ tag: rel.tag_name, date: (rel.published_at || '').slice(0, 10), url: rel.html_url });
    })
    .catch(function (err) { console.warn('release lookup skipped, using release.json:', err); });

  window.AethyrRelease = {
    repo: REPO,
    formatDate: formatDate,
    lineHtml: lineHtml,
    onRelease: function (fn) {
      listeners.push(fn);
      if (current) { try { fn(current); } catch (e) { console.warn('release render failed:', e); } }
    }
  };
})();
