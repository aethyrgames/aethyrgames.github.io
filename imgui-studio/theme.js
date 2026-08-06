// The two theme tables, kept separate on purpose: one for the generated code
// and one for the editor chrome around it.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.

// ---------- highlight themes ----------
// Token slots: com str kw type const num support supfn macro fn cls param op field.
// "Doki" is ported from the user's ReSharper Dark .icls (Rider scheme). Its
// values were confirmed against Rider screenshots by sampling pixels.
// Themes with no distinct member color use their foreground for `field`.
const THEMES = {
  'monokai-bright': {
    name: 'Monokai Bright', bg: '#272822', fg: '#F8F8F2',
    com: '#75715E', str: '#E6DB74', kw: '#F92672', type: '#66D9EF', const: '#AE81FF',
    num: '#AE81FF', support: '#66D9EF', supfn: '#66D9EF', macro: '#66D9EF',
    fn: '#A6E22E', cls: '#A6E22E', param: '#FD971F', op: '#F92672', field: '#F8F8F2',
    italics: ['c-type', 'c-support', 'c-param'],
  },
  'doki': {
    name: 'Doki', bg: '#1E1E1E', fg: '#DCDCDC',
    com: '#57A64A', str: '#D69D85', kw: '#569CD6', type: '#569CD6', const: '#569CD6',
    num: '#B5CEA8', support: '#ADD8E6', supfn: '#FF8000', macro: '#BD63C5',
    fn: '#FF8000', cls: '#00C0C0', param: '#9CDCFE', op: '#DCDCDC', field: '#DDA0DD',
    italics: [],
  },
  'dracula': {
    name: 'Dracula', bg: '#282A36', fg: '#F8F8F2',
    com: '#6272A4', str: '#F1FA8C', kw: '#FF79C6', type: '#8BE9FD', const: '#BD93F9',
    num: '#BD93F9', support: '#8BE9FD', supfn: '#8BE9FD', macro: '#BD93F9',
    fn: '#50FA7B', cls: '#8BE9FD', param: '#FFB86C', op: '#FF79C6', field: '#F8F8F2',
    italics: ['c-type', 'c-support', 'c-param'],
  },
  'one-dark': {
    name: 'One Dark', bg: '#282C34', fg: '#ABB2BF',
    com: '#5C6370', str: '#98C379', kw: '#C678DD', type: '#E5C07B', const: '#D19A66',
    num: '#D19A66', support: '#56B6C2', supfn: '#56B6C2', macro: '#C678DD',
    fn: '#61AFEF', cls: '#E5C07B', param: '#E06C75', op: '#ABB2BF', field: '#E06C75',
    italics: ['c-com'],
  },
  'vs-dark': {
    name: 'VS Code Dark+', bg: '#1E1E1E', fg: '#D4D4D4',
    com: '#6A9955', str: '#CE9178', kw: '#C586C0', type: '#569CD6', const: '#569CD6',
    num: '#B5CEA8', support: '#4EC9B0', supfn: '#DCDCAA', macro: '#DCDCAA',
    fn: '#DCDCAA', cls: '#4EC9B0', param: '#9CDCFE', op: '#D4D4D4', field: '#9CDCFE',
    italics: [],
  },
  'gruvbox': {
    name: 'Gruvbox Dark', bg: '#282828', fg: '#EBDBB2',
    com: '#928374', str: '#B8BB26', kw: '#FB4934', type: '#FABD2F', const: '#D3869B',
    num: '#D3869B', support: '#FE8019', supfn: '#FE8019', macro: '#8EC07C',
    fn: '#B8BB26', cls: '#FABD2F', param: '#83A598', op: '#EBDBB2', field: '#EBDBB2',
    italics: ['c-com'],
  },
  'nord': {
    name: 'Nord', bg: '#2E3440', fg: '#D8DEE9',
    com: '#616E88', str: '#A3BE8C', kw: '#81A1C1', type: '#81A1C1', const: '#81A1C1',
    num: '#B48EAD', support: '#8FBCBB', supfn: '#88C0D0', macro: '#5E81AC',
    fn: '#88C0D0', cls: '#8FBCBB', param: '#D8DEE9', op: '#81A1C1', field: '#D8DEE9',
    italics: ['c-param'],
  },
  'solarized-dark': {
    name: 'Solarized Dark', bg: '#002B36', fg: '#839496',
    com: '#586E75', str: '#2AA198', kw: '#859900', type: '#B58900', const: '#CB4B16',
    num: '#D33682', support: '#268BD2', supfn: '#268BD2', macro: '#CB4B16',
    fn: '#268BD2', cls: '#B58900', param: '#839496', op: '#839496', field: '#839496',
    italics: ['c-com'],
  },
  'solarized-light': {
    name: 'Solarized Light', bg: '#FDF6E3', fg: '#657B83',
    com: '#93A1A1', str: '#2AA198', kw: '#859900', type: '#B58900', const: '#CB4B16',
    num: '#D33682', support: '#268BD2', supfn: '#268BD2', macro: '#CB4B16',
    fn: '#268BD2', cls: '#B58900', param: '#657B83', op: '#657B83', field: '#657B83',
    italics: ['c-com'],
  },
  'github-light': {
    name: 'GitHub Light', bg: '#FFFFFF', fg: '#24292E',
    com: '#6A737D', str: '#032F62', kw: '#D73A49', type: '#D73A49', const: '#005CC5',
    num: '#005CC5', support: '#6F42C1', supfn: '#6F42C1', macro: '#D73A49',
    fn: '#6F42C1', cls: '#E36209', param: '#24292E', op: '#D73A49', field: '#24292E',
    italics: [],
  },
};

// ---------- UI themes ----------
// The chrome, not the code pane: those are separate settings because you may
// well want a dark editor around a light snippet, or the reverse. Each theme
// fills the same twelve color slots plus the four neutrals, and `dark: false`
// flips the neutral washes so hover and veil stay visible on a light ground.

const UI_THEME_KEY = PROFILE.storagePrefix + '.uitheme';

const UI_THEMES = {
  doki: {
    name: 'Doki (Monokai)',
    bg: '#1e1e1e', surface: '#2d2d2d', gutter: '#141414', fg: '#F8F8F2',
    comment: '#75715E', border: '#49483E',
    pink: '#F92672', orange: '#FD971F', yellow: '#E6DB74',
    green: '#A6E22E', cyan: '#66D9EF', purple: '#AE81FF',
  },
  // aethyr.gg's "Arcane Terminal": cyan is the primary presence, magenta is
  // disruption, violet is depth, ember is the rare warm anomaly. Values taken
  // from that site's own :root, with two tints derived to fill slots its
  // four-color palette doesn't cover.
  aethyr: {
    name: 'Aethyr (Arcane Terminal)',
    bg: '#0b0c1a', surface: '#1c1f3a', gutter: '#070710', fg: '#e8ecff',
    comment: '#8b93c4', border: '#2a2f57',
    pink: '#ff2bd6', orange: '#ff8a4c', yellow: '#ffc46b',
    green: '#2fb9ff', cyan: '#63f5ff', purple: '#9b6bff',
  },
  dracula: {
    name: 'Dracula',
    bg: '#282A36', surface: '#343746', gutter: '#21222C', fg: '#F8F8F2',
    comment: '#6272A4', border: '#44475A',
    pink: '#FF79C6', orange: '#FFB86C', yellow: '#F1FA8C',
    green: '#50FA7B', cyan: '#8BE9FD', purple: '#BD93F9',
  },
  nord: {
    name: 'Nord',
    bg: '#2E3440', surface: '#3B4252', gutter: '#272C36', fg: '#ECEFF4',
    comment: '#6C7A96', border: '#434C5E',
    pink: '#BF616A', orange: '#D08770', yellow: '#EBCB8B',
    green: '#A3BE8C', cyan: '#88C0D0', purple: '#B48EAD',
  },
  'tokyo-night': {
    name: 'Tokyo Night',
    bg: '#1A1B26', surface: '#24283B', gutter: '#16161E', fg: '#C0CAF5',
    comment: '#565F89', border: '#2F334D',
    pink: '#F7768E', orange: '#FF9E64', yellow: '#E0AF68',
    green: '#9ECE6A', cyan: '#7DCFFF', purple: '#BB9AF7',
  },
  'one-dark': {
    name: 'One Dark',
    bg: '#282C34', surface: '#333842', gutter: '#21252B', fg: '#ABB2BF',
    comment: '#5C6370', border: '#3E4451',
    pink: '#E06C75', orange: '#D19A66', yellow: '#E5C07B',
    green: '#98C379', cyan: '#56B6C2', purple: '#C678DD',
  },
  'gruvbox-dark': {
    name: 'Gruvbox Dark',
    bg: '#282828', surface: '#3C3836', gutter: '#1D2021', fg: '#EBDBB2',
    comment: '#928374', border: '#504945',
    pink: '#FB4934', orange: '#FE8019', yellow: '#FABD2F',
    green: '#B8BB26', cyan: '#8EC07C', purple: '#D3869B',
  },
  'catppuccin-mocha': {
    name: 'Catppuccin Mocha',
    bg: '#1E1E2E', surface: '#313244', gutter: '#181825', fg: '#CDD6F4',
    comment: '#6C7086', border: '#45475A',
    pink: '#F38BA8', orange: '#FAB387', yellow: '#F9E2AF',
    green: '#A6E3A1', cyan: '#89DCEB', purple: '#CBA6F7',
  },
  'solarized-dark': {
    name: 'Solarized Dark',
    bg: '#002B36', surface: '#073642', gutter: '#00212B', fg: '#93A1A1',
    comment: '#586E75', border: '#0F4453',
    pink: '#DC322F', orange: '#CB4B16', yellow: '#B58900',
    green: '#859900', cyan: '#2AA198', purple: '#6C71C4',
  },
  'solarized-light': {
    name: 'Solarized Light',
    dark: false,
    bg: '#FDF6E3', surface: '#EEE8D5', gutter: '#F5EFDC', fg: '#586E75',
    comment: '#93A1A1', border: '#DDD6C1',
    pink: '#DC322F', orange: '#CB4B16', yellow: '#B58900',
    green: '#859900', cyan: '#268BD2', purple: '#6C71C4',
  },
  'github-light': {
    name: 'GitHub Light',
    dark: false,
    bg: '#FFFFFF', surface: '#F6F8FA', gutter: '#EAEEF2', fg: '#24292E',
    comment: '#6A737D', border: '#D0D7DE',
    pink: '#CF222E', orange: '#BC4C00', yellow: '#9A6700',
    green: '#1A7F37', cyan: '#0969DA', purple: '#8250DF',
  },
};

// Light themes need the opposite washes: white-on-white hover is nothing, and
// a black scanline over paper is a smear.
const NEUTRALS = {
  dark: {
    hover: 'rgba(255, 255, 255, 0.06)',
    veil: 'rgba(0, 0, 0, 0.35)',
    backdrop: 'rgba(0, 0, 0, 0.55)',
    scan: 'rgba(0, 0, 0, 0.30)',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
  },
  light: {
    hover: 'rgba(0, 0, 0, 0.05)',
    veil: 'rgba(0, 0, 0, 0.06)',
    backdrop: 'rgba(0, 0, 0, 0.35)',
    scan: 'rgba(0, 0, 0, 0.06)',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
  },
};

let currentUiTheme = 'doki';

// Split in two so the variables can be set at load, before the rulers and the
// engine exist: writing custom properties is safe at any point, repainting is
// not. applyUiTheme is what the UI calls once everything is up.
function applyUiTheme(key) {
  setThemeVars(key);
  // the grid tints itself from --mk-fg in CSS, so nothing else to push
  drawRulers();
}

const hexToRgbBytes = h => {
  const n = parseInt(String(h).replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const bytesToHex = c => '#' + c.map(v =>
  Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

function relLum(hex) {
  return hexToRgbBytes(hex).map(v => v / 255).map(x =>
    x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4))
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
}

function contrastRatio(a, b) {
  const l1 = Math.max(relLum(a), relLum(b)), l2 = Math.min(relLum(a), relLum(b));
  return (l1 + 0.05) / (l2 + 0.05);
}

// The workspace has to read as a different surface from the panels around it.
// Several themes' gutters sit within a couple of percent of their panel
// background, which left the canvas looking like a hole in the UI rather than a
// thing on it. Push it away from the panel until the separation is obvious,
// deterministically, so a new theme can't quietly reintroduce the problem.
const CANVAS_MIN_CONTRAST = 1.20;

function deriveCanvasColor(bg, gutter, isDark) {
  let best = gutter;
  if (contrastRatio(bg, best) >= CANVAS_MIN_CONTRAST) return best;
  const dir = isDark ? -1 : -1;   // both directions recess: darker than the panels
  for (let step = 1; step <= 60; step++) {
    const c = hexToRgbBytes(gutter).map(v => v + dir * step * (isDark ? 1.6 : 3.2));
    best = bytesToHex(c);
    if (contrastRatio(bg, best) >= CANVAS_MIN_CONTRAST) return best;
  }
  // A near-black theme simply cannot get darker than it already is. Rather
  // than flip the canvas lighter than its panels, which inverts the look the
  // theme was going for, take the darkest available and let the border below
  // carry the separation.
  return best;
}

// Panel headers read as a recessed band rather than another lit surface. The
// gutter nudged a little darker gets there (#141414 -> #111111 on the default
// theme), but two themes ship a gutter that is already almost black, and a black
// header was the earlier complaint. So the tone has a floor, enforced here where
// a conditional is possible, rather than in a CSS color-mix that cannot clamp.
const HEAD_MIN_TONE = 16;
const tone = hex => {
  const [r, g, b] = hexToRgbBytes(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

function deriveHeadColor(gutter, isDark) {
  // a light theme's gutter already reads as a band against its panels
  if (!isDark) return gutter;
  let c = hexToRgbBytes(gutter).map(v => v - 3);
  while (tone(bytesToHex(c)) < HEAD_MIN_TONE) {
    const next = c.map(v => v + 1.5);
    if (next.every(v => v >= 255)) break;
    c = next;
  }
  return bytesToHex(c);
}

function setThemeVars(key) {
  const t = UI_THEMES[key] || UI_THEMES.doki;
  const root = document.documentElement.style;
  root.setProperty('--mk-canvas', deriveCanvasColor(t.bg, t.gutter, t.dark !== false));
  root.setProperty('--mk-head', deriveHeadColor(t.gutter, t.dark !== false));
  for (const slot of ['bg', 'surface', 'gutter', 'fg', 'comment', 'border',
    'pink', 'orange', 'yellow', 'green', 'cyan', 'purple']) {
    root.setProperty('--mk-' + slot, t[slot]);
  }
  const n = NEUTRALS[t.dark === false ? 'light' : 'dark'];
  root.setProperty('--mk-hover', n.hover);
  root.setProperty('--mk-veil', n.veil);
  root.setProperty('--mk-backdrop', n.backdrop);
  root.setProperty('--mk-scan', n.scan);
  root.setProperty('--shadow', n.shadow);
  currentUiTheme = UI_THEMES[key] ? key : 'doki';
  try { localStorage.setItem(UI_THEME_KEY, currentUiTheme); } catch (e) {}
}


const THEME_KEY = PROFILE.storagePrefix + '.theme';

function applyTheme(key) {
  const t = THEMES[key] || THEMES['monokai-bright'];
  const it = new Set(t.italics || []);
  const slots = {
    'c-com': t.com, 'c-str': t.str, 'c-kw': t.kw, 'c-type': t.type,
    'c-const': t.const, 'c-num': t.num, 'c-support': t.support, 'c-supfn': t.supfn,
    'c-macro': t.macro, 'c-fn': t.fn, 'c-class': t.cls, 'c-param': t.param, 'c-op': t.op,
    'c-field': t.field || t.fg,
  };
  // the edit layer is the same highlighter, so it takes the same colors
  const rules = [
    '#code, #codeEditHl { background: ' + t.bg + '; color: ' + t.fg + '; }',
    '#codeEditWrap { background: ' + t.bg + '; }',
    '#codeEdit { caret-color: ' + t.fg + '; }',
  ];
  for (const [cls, col] of Object.entries(slots)) {
    rules.push('#code .' + cls + ', #codeEditHl .' + cls
      + ' { color: ' + col + '; font-style: ' + (it.has(cls) ? 'italic' : 'normal') + '; }');
  }
  document.getElementById('themeStyle').textContent = rules.join('\n');
}

const themeSel = document.getElementById('themeSel');
for (const [key, t] of Object.entries(THEMES)) {
  const o = document.createElement('option');
  o.value = key;
  o.textContent = t.name;
  themeSel.appendChild(o);
}
// variables only at this point: the rulers and the engine come later
setThemeVars(lsGet(UI_THEME_KEY, 'doki') || 'doki');

let currentTheme = lsGet(THEME_KEY);
if (!THEMES[currentTheme]) currentTheme = 'monokai-bright';
themeSel.value = currentTheme;
applyTheme(currentTheme);
themeSel.onchange = () => {
  currentTheme = themeSel.value;
  try { localStorage.setItem(THEME_KEY, currentTheme); } catch (e) {}
  applyTheme(currentTheme);
};

