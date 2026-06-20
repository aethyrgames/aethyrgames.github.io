// Docs page renderer — fetches a docs-*.json and populates #sidebar and #main-content

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function loadDocsPage(jsonPath) {
  try {
    const res = await fetch(jsonPath, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    // meta
    if (data.meta) {
      if (data.meta.title) {
        document.title = data.meta.title;
        const el = document.getElementById('page-title');
        if (el) el.textContent = data.meta.title;
      }
      if (data.meta.description) {
        const el = document.getElementById('page-desc');
        if (el) el.setAttribute('content', data.meta.description);
      }
    }

    // sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar && data.sidebar) {
      const s = data.sidebar;
      const brandHref = s.brand?.href ?? '/';
      const brandLabel = s.brand?.label ?? 'Aethyr';
      let sideHTML = '<a class="brand" href="' + esc(brandHref) + '">'
        + '<img class="sig" src="' + resolveAssetPath('img/brand/aethyr-crystal.svg') + '" alt="" aria-hidden="true" width="18" height="18"> '
        + esc(brandLabel) + '</a>';
      if (s.backHref) sideHTML += '<a class="home" href="' + esc(s.backHref) + '">&larr; back to site</a>';
      sideHTML += '<nav>';
      for (const section of (s.sections || [])) {
        sideHTML += '<h4>' + (section.heading || '') + '</h4>';
        for (const item of (section.items || [])) {
          sideHTML += '<a href="' + esc(item.href) + '">' + (item.label || '') + '</a>';
        }
      }
      sideHTML += '</nav>';
      sidebar.innerHTML = sideHTML;
    }

    // main content
    const main = document.getElementById('main-content');
    if (main && data.article) {
      const a = data.article;
      const tb = data.topbar;

      let topbarHTML = '';
      if (tb) {
        const crumbs = (tb.crumbs || []).map((c, i) =>
          c.current ? '<b>' + esc(c.label) + '</b>' : esc(c.label)
        ).join(' / ');
        topbarHTML = '<div class="topbar"><span class="crumbs">' + crumbs + '</span>'
          + (tb.badge ? '<span class="badge">' + esc(tb.badge) + '</span>' : '')
          + '</div>';
      }

      let articleHTML = '<h1>' + (a.heading || '') + '</h1>';
      if (a.lead) articleHTML += '<p class="lead">' + a.lead + '</p>';
      if (a.audNote) {
        articleHTML += '<p><span class="aud new">New here</span> <span class="aud vet">UE veteran</span> ' + a.audNote + '</p>';
      }

      for (const sec of (a.sections || [])) {
        articleHTML += '<h2 id="' + esc(sec.id) + '">' + (sec.heading || '') + '</h2>';
        articleHTML += sec.html || '';
      }

      if (a.pager) {
        articleHTML += '<div class="pager">';
        articleHTML += a.pager.prev
          ? '<a href="' + esc(a.pager.prev.href) + '">' + esc(a.pager.prev.label) + '</a>'
          : '<span></span>';
        articleHTML += a.pager.next
          ? '<a href="' + esc(a.pager.next.href) + '">' + esc(a.pager.next.label) + '</a>'
          : '';
        articleHTML += '</div>';
      }

      main.innerHTML = topbarHTML + '<article class="doc">' + articleHTML + '</article>';
    }

    // scroll-spy
    initScrollSpy();

  } catch (err) {
    const main = document.getElementById('main-content');
    if (main) main.innerHTML = '<div class="error-page"><p>Failed to load page content.</p></div>';
    console.error('loadDocsPage error:', err);
  }
}

function resolveAssetPath(path) {
  // Resolve path relative to site root regardless of current URL depth
  const depth = location.pathname.split('/').filter(Boolean).length;
  const prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
  return '/' + path;
}

function initScrollSpy() {
  const links = [...document.querySelectorAll('.side nav a[href^="#"]')];
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(
    es => es.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        map.get(e.target.id)?.classList.add('active');
      }
    }),
    { rootMargin: '-20% 0px -70% 0px' }
  );
  document.querySelectorAll('.doc [id]').forEach(s => io.observe(s));
}
