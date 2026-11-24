const REPO = 'https://api.github.com/repos/akobirjontulqinovfuture/keelyard';

const BEATS = [
  {
    title: 'The agent edits.',
    lead: 'Every change is snapshotted as it happens.',
    lines: [
      ['dim', '$ keelyard status'],
      ['cmd', 'snapshot 2  ·  src/app.py'],
      ['cmd', 'snapshot 3  ·  tests/test_api.py'],
      ['dim', 'proof    open — no passing run on current files']
    ]
  },
  {
    title: 'The gate blocks.',
    lead: 'An agent that changed files cannot finish until the tests pass on the current files. Deleted tests, new skip or xfail, or fewer tests run keep the proof open.',
    lines: [
      ['dim', 'agent tried to stop'],
      ['ok',  'GATE BLOCKED'],
      ['cmd', 'proof still open'],
      ['dim', 'reason  tests deleted · fewer tests run']
    ]
  },
  {
    title: 'Tests pass.',
    lead: 'Rewind restores the files, then a real test run is recorded against them.',
    lines: [
      ['dim', '$ keelyard rewind to 2'],
      ['cmd', 'restored  tests/test_api.py'],
      ['dim', '$ pytest'],
      ['ok',  'tests passed  ·  recorded']
    ]
  },
  {
    title: 'Done.',
    lead: 'Evidence is shown as test-verified, command-succeeded, or agent-claimed. Bundles are signed. The session can end.',
    lines: [
      ['dim', '$ keelyard status'],
      ['ok',  'proof    test-verified'],
      ['cmd', 'timeline  1 → 2 → 3 → rewind 2'],
      ['dim', 'session can end']
    ]
  }
];

const SNAP = {
  1: 'Snapshot 1 — starting point.',
  2: 'Snapshot 2 — the last good tree, before the tests were deleted.',
  3: 'Snapshot 3 — tests deleted. Proof stays open.',
  4: 'Snapshot 4 — the agent tried to stop. The gate blocked it.'
};

function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function renderTerm(i) {
  const beat = BEATS[i];
  const title = $('#storyTitle');
  const lead = $('#storyLead');
  const body = $('#termBody');
  if (title && title.textContent !== beat.title) title.textContent = beat.title;
  if (lead) lead.textContent = beat.lead;
  if (body) {
    body.innerHTML = beat.lines
      .map(([k, t]) => `<span class="${k}">${t}</span>`)
      .join('\n');
  }
  $$('#beats li').forEach((el, n) => el.classList.toggle('is-on', n === i));
}

function setSnap(n) {
  $$('#tlRow li').forEach(el => el.classList.toggle('is-on', +el.dataset.n === n));
  const fill = $('#tlFill');
  if (fill) fill.style.width = ((n - 1) / 3) * 100 + '%';
  const st = $('#tlStatus');
  if (st) st.textContent = SNAP[n];
}

function wireCopy() {
  const btn = $('#btnCopy');
  const pre = $('#installCmd');
  if (!btn || !pre) return;
  btn.addEventListener('click', async () => {
    const text = pre.textContent.replace(/\n$/, '');
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copied';
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
      btn.textContent = 'Copied';
    }
    setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
  });
}

function wireTimeline() {
  $$('#tlRow li').forEach(el => el.addEventListener('click', () => setSnap(+el.dataset.n)));
  const btn = $('#btnRewind');
  if (btn) btn.addEventListener('click', () => setSnap(2));
  setSnap(1);
}

function wireVideo() {
  const reel = document.querySelector('.reel');
  if (!reel) return;
  const src = reel.getAttribute('data-video');
  if (!src) return;
  const frame = $('#promoSlot');
  const img = frame.querySelector('img');
  const cap = frame.querySelector('.reel__cap');
  const v = document.createElement('video');
  v.src = src;
  v.controls = true;
  v.playsInline = true;
  v.preload = 'metadata';
  if (img) v.poster = img.getAttribute('src');
  v.setAttribute('aria-label', 'keelyard promo');
  frame.insertBefore(v, cap || null);
  if (img) img.remove();
  if (cap) cap.remove();
}

function fetchStars() {
  fetch(REPO)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => {
      const n = d && d.stargazers_count;
      if (typeof n !== 'number') return;
      $$('[data-stars]').forEach(el => {
        el.textContent = String(n);
        el.hidden = false;
      });
    })
    .catch(() => {});
}

function bootMotion() {
  renderTerm(0);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Animations still run when reduced-motion is set, just with a shorter distance.
  const lenis = new Lenis({ lerp: reduce ? 0.16 : 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  gsap.registerPlugin(ScrollTrigger);

  gsap.from('.hero h1, .hero .lede, .hero .actions, .hero .eyebrow, .reel', {
    y: reduce ? 12 : 28, opacity: 0, duration: reduce ? 0.45 : 0.9,
    stagger: reduce ? 0.05 : 0.1, ease: 'power3.out', delay: 0.05
  });

  ScrollTrigger.create({
    trigger: '.story',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: self => {
      const i = Math.min(3, Math.floor(self.progress * 3.999));
      if (bootMotion._i !== i) { bootMotion._i = i; renderTerm(i); }
    }
  });

  gsap.from('.rewind__copy, .tl', {
    scrollTrigger: { trigger: '.rewind', start: 'top 75%' },
    y: reduce ? 10 : 24, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out'
  });
  gsap.from('.install .shell, .agents .cards li', {
    scrollTrigger: { trigger: '.install', start: 'top 80%' },
    y: reduce ? 10 : 20, opacity: 0, duration: 0.55, stagger: 0.07, ease: 'power2.out'
  });
}

function boot() {
  wireCopy();
  wireTimeline();
  wireVideo();
  fetchStars();
  if (window.gsap && window.ScrollTrigger && window.Lenis) bootMotion();
  else {
    renderTerm(0);
    // CDN failed: still show beat 0 and allow hash navigation.
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
