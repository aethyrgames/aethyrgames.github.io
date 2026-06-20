/* Aethyr: Arcane Terminal · interactions */
(async () => {
  'use strict';

  /* ---- load home page content from JSON (must happen before init) ---- */
  try {
    const data = await fetch('data/home.json', { cache: 'no-cache' }).then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });

    if (data.meta) {
      document.title = data.meta.title || document.title;
      document.getElementById('page-desc')?.setAttribute('content', data.meta.description || '');
      document.getElementById('og-title')?.setAttribute('content', data.meta.title || '');
      document.getElementById('og-desc')?.setAttribute('content', data.meta.description || '');
    }

    const navLinks = document.getElementById('site-nav-links');
    if (navLinks && data.nav?.links) {
      navLinks.innerHTML = data.nav.links.map(l =>
        '<a href="' + l.href + '"' + (l.class ? ' class="' + l.class + '"' : '') + '>' + l.label + '</a>'
      ).join('');
    }

    const eyebrow = document.getElementById('hero-eyebrow');
    if (eyebrow && data.hero?.eyebrow) eyebrow.innerHTML = '<span class="pulse-dot"></span> ' + data.hero.eyebrow;

    const heroTitle = document.getElementById('hero-title');
    if (heroTitle && data.hero?.title) {
      heroTitle.innerHTML = data.hero.title.map((t, i) =>
        '<span class="' + (data.hero.titleClasses?.[i] || 'glitch') + '" data-text="' + t + '">' + t + '</span>'
      ).join('');
    }

    const heroSub = document.getElementById('hero-sub');
    if (heroSub && data.hero?.sub) heroSub.innerHTML = data.hero.sub;

    const heroCta = document.getElementById('hero-cta');
    if (heroCta && data.hero?.cta) {
      heroCta.innerHTML = data.hero.cta.map(b =>
        '<a class="' + b.class + '" href="' + b.href + '"' + (b.download ? ' download' : '') + '><span>' + b.label + '</span></a>'
      ).join('');
    }

    const heroStats = document.getElementById('hero-stats');
    if (heroStats && data.hero?.stats) {
      heroStats.innerHTML = data.hero.stats.map(s =>
        '<li><b' + (s.dataCount ? ' data-count="' + s.dataCount + '"' : '') + '>' + s.value + '</b><span>' + s.label + '</span></li>'
      ).join('');
    }

    const trustBadges = document.getElementById('trust-badges');
    if (trustBadges && data.hero?.badges) {
      trustBadges.innerHTML = data.hero.badges.map(b =>
        '<span class="trust-badge">' + b.icon + ' ' + b.label + '</span>'
      ).join('');
    }

    const marqueeSet = document.getElementById('marquee-set');
    if (marqueeSet && data.marquee) {
      marqueeSet.innerHTML = data.marquee.map(t => '<span>' + t + '</span><i>◇</i>').join('');
    }

    const clientsInner = document.getElementById('clients-inner');
    if (clientsInner && data.clients) {
      clientsInner.innerHTML = '<h3 class="clients-head">' + data.clients.heading + '</h3>'
        + '<div class="clients-list">'
        + (data.clients?.items || []).map(c =>
            '<span class="client-chip">' + c.name + (c.note ? ' <small>' + c.note + '</small>' : '') + '</span>'
          ).join('')
        + '</div>';
    }

    const featuresHead = document.getElementById('features-head');
    if (featuresHead && data.features) {
      featuresHead.innerHTML =
        '<span class="kicker">' + data.features.kicker + '</span>' +
        '<h2>' + data.features.heading + '</h2>';
    }
    const featuresGrid = document.getElementById('features-grid');
    if (featuresGrid && data.features?.cards) {
      featuresGrid.innerHTML = data.features.cards.map((c, i) =>
        '<article class="card reveal-up" style="--i:' + i + '">' +
        '<div class="card-glyph">' + c.glyph + '</div>' +
        '<h3>' + c.title + '</h3>' +
        '<p>' + c.body + '</p>' +
        '<span class="card-tag">' + c.tag + '</span>' +
        '</article>'
      ).join('');
    }

    const flowHead = document.getElementById('flow-head');
    if (flowHead && data.flow) {
      flowHead.innerHTML =
        '<span class="kicker">' + data.flow.kicker + '</span>' +
        '<h2>' + data.flow.heading + '</h2>';
    }
    const flowSteps = document.getElementById('flow-steps');
    if (flowSteps && data.flow?.steps) {
      flowSteps.innerHTML = data.flow.steps.map((s, i) =>
        '<li class="step reveal-up" style="--i:' + i + '">' +
        '<span class="step-no">' + s.no + '</span>' +
        '<h3>' + s.title + '</h3>' +
        '<p>' + s.body + '</p>' +
        '</li>'
      ).join('');
    }

    const snippetInner = document.getElementById('snippet-inner');
    if (snippetInner && data.snippet) {
      const safeCode = data.snippet.code
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const snippetKicker = data.snippet.kicker || '// QUICK START';
      snippetInner.innerHTML =
        '<div class="section-head reveal-up"><span class="kicker">' + snippetKicker + '</span>'
        + '<h2>' + data.snippet.heading + '</h2>'
        + '<p class="snippet-caption">' + data.snippet.caption + '</p></div>'
        + '<div class="snippet-wrap reveal-up">'
        + '<pre class="snippet-code"><code>' + safeCode + '</code></pre>'
        + '<button class="copy-btn" aria-label="Copy config">⌘ Copy</button>'
        + '</div>';
      const copyBtn = snippetInner.querySelector('.copy-btn');
      if (copyBtn) {
        const codeToCopy = data.snippet.code;
        copyBtn.addEventListener('click', function() {
          navigator.clipboard.writeText(codeToCopy).then(() => {
            this.textContent = '✓ Copied';
            setTimeout(() => { this.textContent = '⌘ Copy'; }, 2200);
          }).catch(() => {
            this.textContent = '✗ Failed';
            setTimeout(() => { this.textContent = '⌘ Copy'; }, 2200);
          });
        });
      }
    }

    const faqInner = document.getElementById('faq-inner');
    if (faqInner && data.faq) {
      const faqKicker = data.faq.kicker || '// FAQ';
      faqInner.innerHTML =
        '<div class="section-head reveal-up"><span class="kicker">' + faqKicker + '</span>'
        + '<h2>' + data.faq.heading + '</h2></div>'
        + data.faq.items.map(item =>
            '<details class="faq-item">'
            + '<summary class="faq-q">' + item.q + '</summary>'
            + '<p class="faq-a">' + item.a + '</p>'
            + '</details>'
          ).join('');
    }

    const summonInner = document.getElementById('summon-inner');
    if (summonInner && data.summon) {
      const ctaHTML = (data.summon?.cta || []).map(b => {
        const btn = '<a class="' + b.class + '" href="' + b.href + '"' +
          (b.download ? ' download' : '') + (b.soon ? ' data-soon' : '') +
          '><span>' + b.label + '</span></a>';
        return b.soon ? '<span class="soon-wrap">' + btn + '</span>' : btn;
      }).join('');
      summonInner.innerHTML =
        '<span class="kicker">' + data.summon.kicker + '</span>' +
        '<h2>' + data.summon.heading + '</h2>' +
        '<p>' + data.summon.body + '</p>' +
        '<div class="summon-cta">' + ctaHTML + '</div>' +
        '<p class="fineprint">' + data.summon.fineprint + '</p>';
    }

    const footer = document.getElementById('site-footer');
    if (footer && data.footer) {
      const footLinksHTML = data.footer.links
        ? '<nav class="foot-links">'
          + data.footer.links.map(l => '<a href="' + l.href + '">' + l.label + '</a>').join('')
          + '</nav>'
        : '';
      footer.innerHTML =
        '<div class="foot-brand"><img class="foot-mark" src="img/brand/aethyr-crystal.svg" alt="" aria-hidden="true" width="20" height="20"> Aethyr</div>' +
        '<p class="foot-note">' + data.footer.tagline + '</p>' +
        footLinksHTML +
        '<p class="foot-legal">' + data.footer.legal + '</p>';
    }
  } catch (err) {
    console.error('loadHomeContent error:', err);
  }

  /* ==== all init below runs after JSON content is in the DOM ==== */

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- nav solidify on scroll ---- */
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('solid', window.scrollY > 40);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  /* ---- hero staggered reveal on load ---- */
  addEventListener('load', () => {
    document.querySelectorAll('.hero .reveal').forEach((el) => {
      const d = parseInt(el.dataset.d || '0', 10);
      setTimeout(() => el.classList.add('in'), 120 + d * 130);
    });
  });
  // Trigger immediately if already loaded (async JSON fetch may finish after 'load')
  if (document.readyState === 'complete') {
    document.querySelectorAll('.hero .reveal').forEach((el) => {
      const d = parseInt(el.dataset.d || '0', 10);
      setTimeout(() => el.classList.add('in'), 120 + d * 130);
    });
  }

  /* ---- scroll reveals ---- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }),
    { threshold: 0.18 }
  );
  document.querySelectorAll('.reveal-up').forEach((el) => io.observe(el));

  /* ---- count-up for hero stats: quick up to (target - 7), then a rapid slow-down
     over the final seven, the last two beats slowest so the number settles gently. ---- */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    if (reduce || !target) { el.textContent = String(target); return; }
    // delays (ms) before showing target-6 .. target (rapid slow-down; last two slowest).
    const tail = [48, 88, 152, 240, 344, 464, 576];
    const delayBefore = (v) => { const k = v - (target - 6); return k < 0 ? 5 : tail[k]; };
    const seen = new IntersectionObserver((ents) => {
      if (!ents[0].isIntersecting) return;
      seen.disconnect();
      let v = 0;
      const step = () => {
        el.textContent = String(v);
        if (v < target) setTimeout(() => { v++; step(); }, delayBefore(v + 1));
      };
      step();
    }, { threshold: 0.6 });
    seen.observe(el);
  });

  /* ---- terminal typewriter (scripted conversation) ---- */
  const script = [
    { c: 'u',   t: '› what does BP_Enemy actually do?' },
    { c: 'a',   t: 'BP_Enemy: 5 vars, 2 functions. BeginPlay seeds health,\n  patrols via a Timeline, fires OnPerception. Want the graph?' },
    { c: 'u',   t: '› give it a 2-second stun when it takes fire damage' },
    { c: 'dim', t: '  + variable  StunTimer (float)' },
    { c: 'dim', t: '  + branch    DamageType == Fire' },
    { c: 'dim', t: '  ~ wire      ApplyStun → SetTimerByEvent(2.0)' },
    { c: 'ok',  t: '  ✓ compiled · saved · backed up  (1 asset, atomic)' },
    { c: 'a',   t: 'Done. Stun wired on fire damage, 2s. Diff is clean.' },
  ];
  const out = document.getElementById('typed');
  let started = false;
  const runTerminal = () => {
    if (started || !out) return; started = true;
    if (reduce) { out.innerHTML = script.map((l) => `<span class="${l.c}">${l.t}</span>`).join('\n'); return; }
    out.style.transition = 'opacity 500ms ease';
    let li = 0;
    const line = () => {
      if (li >= script.length) {
        setTimeout(() => {
          out.style.opacity = '0';
          setTimeout(() => { out.innerHTML = ''; li = 0; out.style.opacity = '1'; line(); }, 500);
        }, 4200);
        return;
      }
      const { c, t } = script[li++];
      const span = document.createElement('span');
      span.className = c; out.appendChild(span);
      let ci = 0;
      const ch = () => {
        span.textContent = t.slice(0, ci++);
        if (ci <= t.length) setTimeout(ch, 14 + Math.random() * 26);
        else { out.appendChild(document.createTextNode('\n')); setTimeout(line, 360); }
      };
      ch();
    };
    line();
  };
  const term = document.querySelector('.terminal');
  if (term) {
    const tio = new IntersectionObserver((e) => { if (e[0].isIntersecting) { runTerminal(); tio.disconnect(); } }, { threshold: 0.4 });
    tio.observe(term);
  }

  /* ---- "coming soon" buttons ---- */
  document.querySelectorAll('[data-soon]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    b.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }],
      { duration: 280, easing: 'ease-in-out' }
    );
  }));

  /* ---- seamless marquee: clone the set to overflow the viewport, then mirror it
     so translateX(-50%) lands exactly one set over and never snaps or gaps ---- */
  (() => {
    const track = document.querySelector('.marquee-track');
    const marquee = track && track.parentElement;
    const set = track && track.querySelector('.marquee-set');
    if (!track || !marquee || !set) return;
    const base = [...set.children].map((n) => n.cloneNode(true));
    const build = () => {
      set.replaceChildren(...base.map((n) => n.cloneNode(true)));
      let guard = 0;
      while (set.scrollWidth < marquee.offsetWidth + 80 && guard++ < 60) {
        base.forEach((n) => set.appendChild(n.cloneNode(true)));
      }
      const setW = set.scrollWidth;
      while (track.children.length > 1) track.removeChild(track.lastChild);
      const clone = set.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
      track.style.setProperty('--marquee-dur', Math.max(20, Math.round(setW / 90)) + 's');
    };
    build();
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
  })();

  /* ---- home mobile nav ---- */
  function initHomeNav() {
    var toggle = document.getElementById('nav-toggle');
    var navEl = document.getElementById('nav');
    if (!toggle || !navEl) return;
    toggle.addEventListener('click', function() {
      var isOpen = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) {
        var firstLink = document.querySelector('#site-nav-links a');
        if (firstLink) firstLink.focus();
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
    document.addEventListener('click', function(e) {
      if (document.body.classList.contains('nav-open') && !navEl.contains(e.target)) {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
  initHomeNav();

  /* ====================================================================
     Blueprint-node constellation, the signature backdrop.
     Nodes drift; nearby nodes wire together; pins pulse; parallax to mouse.
     ==================================================================== */
  const cv = document.getElementById('constellation');
  const lowPower = innerWidth < 760 || matchMedia('(pointer:coarse)').matches;
  if (!cv || reduce || lowPower) return;
  const ctx = cv.getContext('2d');
  let W, H, DPR, nodes, mx = 0.5, my = 0.5, raf;

  const palette = ['28,230,255', '255,43,214', '155,107,255'];
  const NODE_COUNT = () => Math.min(54, Math.floor((window.innerWidth * window.innerHeight) / 26000));

  function resize() {
    DPR = Math.min(2, devicePixelRatio || 1);
    W = cv.width = innerWidth * DPR;
    H = cv.height = innerHeight * DPR;
    cv.style.width = innerWidth + 'px';
    cv.style.height = innerHeight + 'px';
    spawn();
  }
  function spawn() {
    const n = NODE_COUNT();
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.12 * DPR,
      vy: (Math.random() - 0.5) * 0.12 * DPR,
      r: (1.2 + Math.random() * 2.2) * DPR,
      c: palette[(Math.random() * palette.length) | 0],
      ph: Math.random() * Math.PI * 2,
    }));
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const link = 150 * DPR, px = (mx - 0.5) * 26 * DPR, py = (my - 0.5) * 26 * DPR;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0 || a.x > W) a.vx *= -1;
      if (a.y < 0 || a.y > H) a.vy *= -1;
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
        if (d < link) {
          const o = (1 - d / link) * 0.5;
          const gr = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          gr.addColorStop(0, `rgba(${a.c},${o})`);
          gr.addColorStop(1, `rgba(${b.c},${o})`);
          ctx.strokeStyle = gr; ctx.lineWidth = DPR;
          ctx.beginPath();
          const midx = (a.x + b.x) / 2;
          ctx.moveTo(a.x + px, a.y + py);
          ctx.lineTo(midx + px, a.y + py);
          ctx.lineTo(midx + px, b.y + py);
          ctx.lineTo(b.x + px, b.y + py);
          ctx.stroke();
        }
      }
    }
    for (const a of nodes) {
      const pulse = 0.55 + 0.45 * Math.sin(t * 0.002 + a.ph);
      ctx.fillStyle = `rgba(${a.c},${0.5 + pulse * 0.4})`;
      ctx.shadowBlur = 12 * DPR; ctx.shadowColor = `rgba(${a.c},0.8)`;
      ctx.beginPath();
      ctx.rect(a.x - a.r + px, a.y - a.r + py, a.r * 2, a.r * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    raf = requestAnimationFrame(draw);
  }
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; }, { passive: true });
  addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); raf = requestAnimationFrame(draw); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(draw);
  });
  resize();
  raf = requestAnimationFrame(draw);
})();
