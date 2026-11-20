// FORM — page motion: intro, headline reveals, scroll lighting, pointer lights.
// Runs independently of the WebGL module so the page stays animated if 3D is unavailable.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // Construction drawing: the same Hopf fibres as the Fibre sculpture, projected flat.
  const wireGroup = $('#wire-lines');
  if (wireGroup) {
    const tilt = 1.0, ct = Math.cos(tilt), st = Math.sin(tilt), layers = [{c:-.86, count:9, offset:0}, {c:-.5, count:14, offset:.5}];
    let n = 0;
    layers.forEach(({c, count, offset}) => {
      const s = Math.sqrt(1 - c * c), k = 1 / Math.sqrt(2 * (1 + c));
      for (let f = 0; f < count; f++) {
        const p = (f + offset) / count * Math.PI * 2, a = s * Math.cos(p), b = s * Math.sin(p), pts = [];
        for (let j = 0; j <= 160; j++) {
          const t = j / 160 * Math.PI * 2, d = 1 - k * (1 + c) * Math.cos(t);
          const x = k * (a * Math.sin(t) - b * Math.cos(t)) / d, y = k * (1 + c) * Math.sin(t) / d, z = k * (a * Math.cos(t) + b * Math.sin(t)) / d;
          const py = y * ct - z * st; // tilt the torus toward the viewer
          pts.push(`${j ? 'L' : 'M'}${(210 + 68 * x).toFixed(1)},${(125 + 68 * py).toFixed(1)}`);
        }
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pts.join(' ')); path.setAttribute('pathLength', '1');
        path.style.setProperty('--s', n++ % 12);
        wireGroup.append(path);
      }
    });
  }

  // Split headlines into masked lines.
  $$('main h2').forEach((h2) => {
    if (h2.closest('dialog')) return;
    const parts = h2.innerHTML.split(/<br\s*\/?>/i);
    h2.innerHTML = parts.map((html, i) => `<span class="line"><span class="line-inner" style="--i:${i}">${html.trim()}</span></span>`).join('');
    h2.dataset.reveal = '';
  });
  $$('.art-card').forEach((card, i) => { card.dataset.reveal = ''; card.style.setProperty('--i', i); });
  $$('.wire-art, .process-steps article').forEach((el) => { el.dataset.reveal = ''; });

  // Statement: split into words that are lit as the visitor scrolls through it.
  const statement = $('.statement > p');
  const words = [];
  if (statement) {
    const wrap = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((piece) => {
            if (!piece) return;
            if (/^\s+$/.test(piece)) { frag.append(piece); return; }
            const w = document.createElement('span');
            w.className = 'w'; w.textContent = piece; words.push(w); frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.classList.contains('serif')) {
          wrap(child);
        }
      });
    };
    wrap(statement);
  }

  // Reveal on first view.
  const revealAll = () => $$('[data-reveal]').forEach((el) => el.classList.add('is-in'));
  if ('IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .12 });
    $$('[data-reveal]').forEach((el) => io.observe(el));
  } else revealAll();

  // Intro: let the first frame paint in its dark state, then raise the lights.
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-loaded')));

  // Header: floats with a blurred backing once the hero is passed, hides while reading downward.
  const header = $('.header');
  const statementSection = $('.statement');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    header.classList.toggle('is-floating', y > 120);
    const goingDown = y > lastY + 2, goingUp = y < lastY - 2;
    if (goingDown && y > 520 && !header.contains(document.activeElement)) header.classList.add('is-hidden');
    else if (goingUp || y < 520) header.classList.remove('is-hidden');
    lastY = y;

    if (statementSection && words.length) {
      const vh = innerHeight, r = statement.getBoundingClientRect();
      // Lighting starts as the paragraph enters and completes once its top passes ~a third of the screen.
      const p = clamp((vh * .9 - r.top) / (vh * .6));
      statementSection.style.setProperty('--spin', `${(p * 120).toFixed(2)}deg`);
      if (!reduce.matches) {
        const lit = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
      }
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // Hero key light eases toward the pointer.
  const hero = $('.hero');
  if (hero) {
    let tx = 66, ty = 48, cx = tx, cy = ty, raf = 0;
    const step = () => {
      cx += (tx - cx) * .07; cy += (ty - cy) * .07;
      hero.style.setProperty('--mx', `${cx.toFixed(2)}%`);
      hero.style.setProperty('--my', `${cy.toFixed(2)}%`);
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > .05 ? requestAnimationFrame(step) : 0;
    };
    hero.addEventListener('pointermove', (e) => {
      if (!finePointer.matches || reduce.matches) return;
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width * 100; ty = (e.clientY - r.top) / r.height * 100;
      if (!raf) raf = requestAnimationFrame(step);
    });
    hero.addEventListener('pointerleave', () => { tx = 66; ty = 48; if (!raf) raf = requestAnimationFrame(step); });
  }

  // Each artwork card carries a small light that follows the pointer.
  $$('.art-image').forEach((frame) => {
    frame.addEventListener('pointermove', (e) => {
      if (!finePointer.matches) return;
      const r = frame.getBoundingClientRect();
      frame.parentElement.style.setProperty('--x', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
      frame.parentElement.style.setProperty('--y', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
    });
  });

  reduce.addEventListener('change', (e) => { if (e.matches) { revealAll(); words.forEach((w) => w.classList.add('is-lit')); } });
})();
