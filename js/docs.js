// Aethyr docs page renderer — fetches a docs-*.json and populates #sidebar and #main-content

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---- section-type renderers ------------------------------------------------

function renderSpells(sec) {
  // Cookbook section: intro + spell cards (incant / description / tools)
  let h = '';
  if (sec.spells && sec.spells.length) {
    h += '<div class="spell-grid">';
    for (const sp of sec.spells) {
      const toolTags = (sp.tools || []).map(t => '<code>' + esc(t) + '</code>').join(' ');
      h += '<div class="spell">'
        + '<p class="incant">' + esc(sp.incant) + '</p>'
        + '<p class="spell-desc">' + esc(sp.description) + '</p>'
        + (toolTags ? '<p class="spell-tools">' + toolTags + '</p>' : '')
        + '</div>';
    }
    h += '</div>';
  }
  return h;
}

function renderCategories(categories) {
  // Reference: grouped tool tables
  let h = '';
  for (const cat of categories) {
    h += '<div class="tool-category">'
      + '<h3>' + esc(cat.name) + ' <span class="tool-count">' + (cat.count || cat.tools.length) + '</span></h3>'
      + '<table class="tool-table"><thead><tr><th scope="col">Name</th><th scope="col">Description</th></tr></thead><tbody>';
    for (const tool of (cat.tools || [])) {
      h += '<tr><td><code>' + esc(tool.name) + '</code></td><td>' + esc(tool.description) + '</td></tr>';
    }
    h += '</tbody></table></div>';
  }
  return h;
}

function renderSkills(skills) {
  // skill descriptions may contain intentional HTML (e.g. <code> tags) — left unescaped
  let h = '<div class="skill-list">';
  for (const sk of skills) {
    h += '<div class="skill-row">'
      + '<div class="skill-name"><code>' + esc(sk.name) + '</code>'
      + (sk.badge ? ' <span class="badge">' + esc(sk.badge) + '</span>' : '')
      + '</div>'
      + '<p>' + (sk.description || '') + '</p>'
      + '</div>';
  }
  return h + '</div>';
}

function renderFlags(flags) {
  let h = '<table class="flag-table"><thead><tr><th scope="col">Name</th><th scope="col">Description</th></tr></thead><tbody>';
  for (const f of flags) {
    h += '<tr><td><code>' + esc(f.name) + '</code></td><td>' + esc(f.description) + '</td></tr>';
  }
  return h + '</tbody></table>';
}

function renderBackends(backends) {
  let h = '<table class="backend-table"><thead><tr><th scope="col">Name</th><th scope="col">Description</th></tr></thead><tbody>';
  for (const b of backends) {
    h += '<tr><td><code>' + esc(b.name) + '</code></td><td>' + esc(b.description) + '</td></tr>';
  }
  return h + '</tbody></table>';
}

function renderSection(sec) {
  let h = '';
  if (sec.html)        h += sec.html;
  if (sec.intro)       h += '<p class="section-intro">' + esc(sec.intro) + '</p>';
  if (sec.spells)      h += renderSpells(sec);
  if (sec.categories)  h += renderCategories(sec.categories);
  if (sec.skills)      h += renderSkills(sec.skills);
  if (sec.flags)       h += renderFlags(sec.flags);
  if (sec.backends)    h += renderBackends(sec.backends);
  return h;
}

// ---- main loader -----------------------------------------------------------

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
      let sideHTML = '<a class="brand" href="' + esc(s.brand?.href ?? '/') + '">'
        + '<img class="sig" src="/img/brand/aethyr-crystal.svg" alt="" aria-hidden="true" width="18" height="18"> '
        + esc(s.brand?.label ?? 'Aethyr') + '</a>';
      if (s.backHref) sideHTML += '<a class="home" href="' + esc(s.backHref) + '">&larr; back to site</a>';
      sideHTML += '<nav aria-label="Docs navigation">';
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

      // topbar — crumbs can be plain strings or {label, current} objects
      let topbarHTML = '';
      if (tb) {
        const crumbs = (tb.crumbs || []).map(c =>
          typeof c === 'string' ? esc(c) : (c.current ? '<b>' + esc(c.label) + '</b>' : esc(c.label))
        ).join(' / ');
        topbarHTML = '<div class="topbar">'
          + '<button class="navtoggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="sidebar">'
          + '<span></span><span></span><span></span></button>'
          + '<span class="crumbs">' + crumbs + '</span>'
          + (tb.badge ? '<span class="badge">' + esc(tb.badge) + '</span>' : '')
          + '</div>';
      }

      let articleHTML = '<h1>' + (a.heading || '') + '</h1>';
      if (a.lead) articleHTML += '<p class="lead">' + a.lead + '</p>';
      if (a.audNote) {
        articleHTML += '<p><span class="aud new">New here</span> <span class="aud vet">UE veteran</span> ' + a.audNote + '</p>';
      }

      // cookbook: top note block
      if (a.note) {
        articleHTML += '<div class="note ' + esc(a.note.type || 'tip') + '">' + (a.note.html || '') + '</div>';
      }
      // cookbook: spellnav pill bar
      if (a.spellnav) {
        articleHTML += '<div class="spellnav">';
        for (const link of a.spellnav) {
          articleHTML += '<a href="' + esc(link.href) + '">' + esc(link.label) + '</a>';
        }
        articleHTML += '</div>';
      }

      // tutorials: stories grid
      if (a.stories) {
        articleHTML += '<div class="stories">';
        for (const story of a.stories) {
          articleHTML += '<a class="story" href="' + esc(story.href) + '">'
            + '<span class="g">' + story.glyph + '</span>'
            + '<h3>' + esc(story.title) + '</h3>'
            + '<p>' + esc(story.desc) + '</p>'
            + '<span class="via">' + esc(story.via) + '</span>'
            + '</a>';
        }
        articleHTML += '</div>';
      }

      // all pages: sections
      for (const sec of (a.sections || [])) {
        const icon = sec.icon ? ' <span class="sec-icon">' + sec.icon + '</span>' : '';
        articleHTML += '<h2 id="' + esc(sec.id) + '">' + (sec.heading || '') + icon + '</h2>';
        articleHTML += renderSection(sec);
      }

      // pager
      if (a.pager) {
        articleHTML += '<div class="pager">';
        articleHTML += a.pager.prev
          ? '<a href="' + esc(a.pager.prev.href) + '">' + esc(a.pager.prev.label) + '</a>'
          : '<span></span>';
        if (a.pager.next) articleHTML += '<a href="' + esc(a.pager.next.href) + '">' + esc(a.pager.next.label) + '</a>';
        articleHTML += '</div>';
      }

      main.innerHTML = topbarHTML + '<article class="doc">' + articleHTML + '</article>';
    }

    initScrollSpy();
    initMobileNav();

  } catch (err) {
    const main = document.getElementById('main-content');
    if (main) main.innerHTML = '<div class="error-page"><p>Failed to load page content. Please refresh.</p></div>';
    console.error('loadDocsPage error:', err);
  }
}

// ---- interactions ----------------------------------------------------------

function initMobileNav() {
  const side = document.querySelector('.side');
  const btn = document.querySelector('.navtoggle');
  if (!side || !btn || btn.dataset.wired) return;
  btn.dataset.wired = '1';
  let ov = document.querySelector('.nav-ov');
  if (!ov) { ov = document.createElement('div'); ov.className = 'nav-ov'; document.body.appendChild(ov); }
  const set = open => {
    document.body.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      var firstLink = side.querySelector('a'); if (firstLink) firstLink.focus();
    } else {
      btn.focus();
    }
  };
  btn.addEventListener('click', () => set(!document.body.classList.contains('nav-open')));
  ov.addEventListener('click', () => set(false));
  side.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
}

function initScrollSpy() {
  const links = [...document.querySelectorAll('.side nav a[href^="#"]')];
  if (!links.length) return;
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const sections = [...document.querySelectorAll('.doc [id]')].filter(s => map.has(s.id));
  if (!sections.length) return;

  let current = null, ticking = false;

  function spy() {
    const threshold = window.innerHeight * 0.3;
    let active = null;
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= threshold) active = s;
    }
    if (active !== current) {
      current = active;
      links.forEach(l => l.classList.remove('active'));
      if (active) map.get(active.id)?.classList.add('active');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(spy); ticking = true; }
  }, { passive: true });
  spy();
}
