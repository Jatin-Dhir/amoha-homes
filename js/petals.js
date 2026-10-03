/* ==========================================================================
   Amoha — bougainvillea petals
   Two sources share one canvas, one sprite sheet and one loop:
   - the pointer: a few bracts break off the cursor as it moves. Emission is by distance travelled,
     not by time, so a slow drag and a quick flick lay the same even trail and a resting hand sheds
     nothing. Fine pointers only.
   - every spray on the page (.flower): bracts let go of the plant and drift down. Each leaves from the
     pink of the spray itself — each poster is sampled once for its pink pixels, mapped through the
     spray's own rotation and mirroring — never from the empty corners of its square. Only sprays on
     screen shed; phones shed about half as often.
   The petals are the site's own flowers, cropped single-bract from the spray cut-outs into
   assets/img/petals.png, not a generic particle. A falling bract tumbles through the plane — it thins
   to an edge and turns over, showing a paler back — and slides sideways fastest while it is edge-on,
   which is what makes it read as a petal rather than confetti.
   Since 2026-09-29 (the client: "more petals should fall", then "work on petals") the sprays let go
   far more often, now and then in a small flurry, and the fall has depth and air:
   - three depths: small faint far petals, the body of the fall, and a few large near ones drawn last,
     softened as if out of focus, that cross in front of everything;
   - a breeze carries each bract away from its plant into the page (a spray at the left edge sends
     them right), gusting slowly, and a petal lying flat catches more of it than one edge-on;
   - each falls most of the screen before it fades, at a speed and shade of its own.
   Never under reduced motion or the lite tier; the loop sleeps whenever nothing is in the air and
   nothing is due to fall.
   ========================================================================== */
(function () {
  'use strict';
  const mq = (q) => !!(window.matchMedia && matchMedia(q).matches);
  if (mq('(prefers-reduced-motion: reduce)')) return;
  if (window.ERA && (ERA.lite || ERA.reduced)) return;
  const fine = mq('(hover: hover) and (pointer: fine)');

  const CELLS = 9, CELL = 48;          // the sheet: nine petals in 48px cells
  const N = 240;                       // ring buffer: the most petals ever in the air
  const STEP = 38;                     // px of pointer travel per petal
  const GUARD = 6;                     // a teleporting pointer never sheds more than this in a frame
  const TAU = Math.PI * 2;
  const SPRAY_MAX = fine ? 150 : 60;   // spray petals in the air at once
  // seconds between two lettings-go of one spray: about four bracts a second on a desktop (measured in
  // view: a spray reached ~13 petals at the slower rate, as each one leaves the foot of the screen)
  const GAP = fine ? [0.15, 0.5] : [0.35, 1];
  // far · mid · near: how many, how big against the spray's own bracts, how clear, how fast, how much
  // breeze each catches. The near ones are few, and softened (drawn from a blurred copy of the sheet).
  const LAYERS = [
    { share: 0.3, scale: [0.55, 0.75], alpha: [0.38, 0.58], fall: 0.72, drift: 0.6 },
    { share: fine ? 0.54 : 0.62, scale: [0.9, 1.15], alpha: [0.8, 0.95], fall: 1, drift: 1 },
    { share: fine ? 0.16 : 0.08, scale: fine ? [1.7, 2.3] : [1.5, 1.9], alpha: [0.72, 0.88], fall: 1.4, drift: 1.35, soft: true },
  ];

  const sheet = new Image();
  sheet.src = 'assets/img/petals.png';
  let faces = [sheet], back = null, soft = null, softBack = null;   // baked in start()
  const canvas = document.createElement('canvas');
  canvas.className = 'petals';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  const fit = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
  };

  const petals = Array.from({ length: N }, () => ({ life: 0 }));
  let slot = 0;
  const take = () => { const p = petals[slot]; slot = (slot + 1) % N; return p; };   // take the slot, then advance
  const pointer = { x: 0, y: 0, in: false };
  const em = { x: 0, y: 0, vx: 0, vy: 0, acc: 0 };
  let raf = 0, timer = 0, last = 0, lastScroll = window.scrollY, clock = 0;
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- the pointer's trail ---------- */
  const spawn = (x, y) => {
    const p = take();
    p.kind = 0; p.layer = 1; p.x = x; p.y = y;
    p.vx = em.vx * 0.1 + rand(-36, 36);              // a little of the hand's momentum, a little scatter
    p.vy = em.vy * 0.1 - rand(18, 48);               // lifted as it leaves, before it starts to fall
    p.rot = rand(0, TAU); p.vr = rand(-2.6, 2.6);
    p.flip = rand(0, TAU); p.vf = rand(2.2, 4.6);
    p.phase = rand(0, TAU);
    p.size = rand(13, 24); p.cell = (Math.random() * CELLS) | 0; p.tint = (Math.random() * 3) | 0;
    p.t = 0; p.life = rand(1.9, 3.1);
  };

  /* ---------- the sprays ---------- */
  const pinkOf = {};                   // poster src -> [u, v] points on its bracts, sampled once
  const sample = (img) => {
    const src = img.currentSrc || img.src;
    if (pinkOf[src] || !img.naturalWidth) return pinkOf[src] || null;
    const S = 64, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, S, S);
    let d; try { d = g.getImageData(0, 0, S, S).data; } catch (e) { return null; }
    const pts = [];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4, r = d[i], gr = d[i + 1], b = d[i + 2];
      if (d[i + 3] > 160 && r > 120 && r > gr + 50 && b > gr + 20) pts.push([(x + 0.5) / S, (y + 0.5) / S]);
    }
    return (pinkOf[src] = pts.length ? pts : null);
  };
  const sprays = [];
  let onScreen = 0;
  const aloft = () => { let n = 0; for (let i = 0; i < N; i++) if (petals[i].life && petals[i].kind === 1) n++; return n; };
  const pickLayer = () => { let u = Math.random(); for (let i = 0; i < LAYERS.length; i++) { u -= LAYERS[i].share; if (u <= 0) return i; } return 1; };
  const shed = (s) => {
    const img = s.el.querySelector('img'); if (!img) return;
    const pts = sample(img); if (!pts) return;
    const r = s.el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const w = s.el.offsetWidth, h = s.el.offsetHeight;
    const t = getComputedStyle(s.el).transform;
    const m = t && t !== 'none' ? new DOMMatrixReadOnly(t) : { a: 1, b: 0, c: 0, d: 1 };
    // a spray usually runs off the screen or past its section's edge, so look for a bract that can be
    // seen — only from what is on screen, never from a part an ancestor crops away. Cropping is read
    // per axis from the computed overflow: on a desktop the numbers and About sections clip only
    // sideways, and their sprays hang below them on purpose.
    let L = 0, T = 0, R = innerWidth, B = innerHeight;
    for (let a = s.el.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a), cx = cs.overflowX !== 'visible', cy = cs.overflowY !== 'visible';
      if (!cx && !cy) continue;
      const k = a.getBoundingClientRect();
      if (cx) { L = Math.max(L, k.left); R = Math.min(R, k.right); }
      if (cy) { T = Math.max(T, k.top); B = Math.min(B, k.bottom); }
    }
    let x, y, tries = 10;
    do {
      const [u, v] = pts[(Math.random() * pts.length) | 0];
      const lx = (u - 0.5) * w, ly = (v - 0.5) * h;
      x = r.left + r.width / 2 + m.a * lx + m.c * ly; y = r.top + r.height / 2 + m.b * lx + m.d * ly;
    } while ((x < L || x > R || y < T || y > B) && --tries);
    if (!tries) return;
    const layer = pickLayer(), Ly = LAYERS[layer];
    const p = take();
    p.kind = 1; p.layer = layer; p.x = x; p.y = y;
    p.vx = rand(-10, 10); p.vy = rand(2, 12);       // it lets go, it is not thrown
    p.fall = rand(34, 66) * Ly.fall;                // terminal speed: a bract falls like paper
    p.spin = rand(0, TAU); p.vs = rand(1.4, 3.3) * (Math.random() < 0.5 ? -1 : 1);   // the tumble through the plane
    p.roll = rand(0, TAU); p.vroll = rand(-0.9, 0.9);                                // drift within the plane
    p.slip = rand(16, 40) * (layer === 2 ? 1.35 : 1);
    // the breeze carries it away from its plant, into the page: from a spray at the left edge, rightward
    p.dir = x < innerWidth / 2 ? 1 : -1; p.catch = rand(0.6, 1.2) * Ly.drift;
    // a bract in the spray is about 1/24 of the poster's width; far ones smaller, near ones larger
    // (never under a floor tied to the screen, or a small spray in a corner sheds specks)
    p.size = Math.max(9, Math.min(64, Math.max(r.width * rand(0.034, 0.05), innerWidth * rand(0.009, 0.013)) * rand(Ly.scale[0], Ly.scale[1])));
    p.cell = (Math.random() * CELLS) | 0; p.tint = (Math.random() * 3) | 0;
    p.drop = 0; p.reach = innerHeight * rand(0.75, 1.2);   // most of the screen before it has faded
    p.peak = rand(Ly.alpha[0], Ly.alpha[1]);
    p.t = 0; p.life = 1;
  };
  const due = (now) => {                             // shed from every spray on screen that is due; returns ms to the next
    let soonest = Infinity;
    for (const s of sprays) {
      if (!s.visible) continue;
      if (now >= s.next) {
        // now and then a small flurry: two or three bracts let go together, as a gust takes them
        const n = Math.random() < 0.3 ? (Math.random() < 0.35 ? 3 : 2) : 1;
        for (let k = 0; k < n && aloft() < SPRAY_MAX; k++) shed(s);
        s.next = now + rand(GAP[0], GAP[1]) * 1000;
      }
      soonest = Math.min(soonest, s.next - now);
    }
    return soonest;
  };

  /* ---------- one loop for both ---------- */
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(1 / 30, (now - last) / 1000 || 0); last = now; clock += dt;
    if (pointer.in) {
      const k = 1 - Math.exp(-16 * dt);                                   // the emitter lags the hand a touch
      const nx = em.x + (pointer.x - em.x) * k, ny = em.y + (pointer.y - em.y) * k;
      const dx = nx - em.x, dy = ny - em.y, moved = Math.hypot(dx, dy);
      em.vx = dt ? dx / dt : 0; em.vy = dt ? dy / dt : 0;
      em.acc += moved;
      let n = 0;
      while (em.acc >= STEP && n < GUARD) {
        em.acc -= STEP; n++;
        const t = moved > 1e-6 ? Math.min(1, (n * STEP) / moved) : 0;    // each petal where it is owed along the segment
        spawn(em.x + dx * t, em.y + dy * t);
      }
      if (n === GUARD) em.acc = 0;
      em.x = nx; em.y = ny;
    }
    const wait = onScreen ? due(now) : Infinity;
    const scroll = window.scrollY, carried = scroll - lastScroll; lastScroll = scroll;   // petals ride the page as it scrolls
    // one breeze for the whole page, gusting slowly, never still and never a gale (px/s)
    const wind = 16 + 9 * Math.sin(clock * 0.21) + 5 * Math.sin(clock * 0.57 + 1.1);
    const ease = 1 - Math.exp(-0.9 * dt);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    for (let layer = 0; layer < LAYERS.length; layer++) {                  // far first, near last
      for (let i = 0; i < N; i++) {
        const p = petals[i]; if (!p.life || p.layer !== layer) continue;
        p.t += dt;
        let alpha, c, s, fx, img;
        if (p.kind === 0) {
          if (p.t >= p.life) { p.life = 0; continue; }
          p.vy += 150 * dt;                                                 // gravity
          p.vx *= 1 - 1.3 * dt; p.vy *= 1 - 0.8 * dt;                      // drag: a bract falls like paper, not a stone
          p.x += (p.vx + Math.sin(p.t * 2.4 + p.phase) * 26) * dt;        // flutter
          p.y += p.vy * dt - carried;
          p.rot += p.vr * dt; p.flip += p.vf * dt;
          const u = p.t / p.life;
          alpha = (u < 0.08 ? u / 0.08 : u > 0.6 ? (1 - u) / 0.4 : 1) * 0.95;
          c = Math.cos(p.rot); s = Math.sin(p.rot);
          fx = Math.cos(p.flip); fx = (fx < 0 ? -1 : 1) * Math.max(0.18, Math.abs(fx));   // tumbling, never edge-on to nothing
          img = faces[p.tint] || sheet;
        } else {
          const edge = Math.abs(Math.sin(p.spin)), flat = 1 - edge;       // edge 1 when it knifes through the air edge-on
          p.vy += (p.fall * (0.7 + 0.6 * edge) - p.vy) * (1 - Math.exp(-1.8 * dt));   // flat it floats, edge-on it dives
          p.vx += (p.dir * wind * p.catch * (0.45 + 0.55 * flat) - p.vx) * ease;       // flat it catches the breeze
          p.spin += p.vs * dt; p.roll += p.vroll * dt;
          const dy = p.vy * dt;
          p.x += (p.vx + Math.sin(p.spin) * p.slip) * dt;                 // the slip rides the tumble, not a separate wobble
          p.y += dy - carried; p.drop += dy;
          const u = p.drop / p.reach;
          if (u >= 1 || p.y > innerHeight + 60 || p.y < -120 || p.x < -80 || p.x > innerWidth + 80) { p.life = 0; continue; }
          alpha = Math.min(1, p.t / 0.35) * (u > 0.75 ? (1 - u) / 0.25 : 1) * p.peak;
          c = Math.cos(p.roll); s = Math.sin(p.roll);
          fx = Math.cos(p.spin);
          const under = fx < 0;
          img = layer === 2 && soft ? (under && softBack ? softBack : soft) : under && back ? back : faces[p.tint] || sheet;   // turned over: its paler underside
          fx = (fx < 0 ? -1 : 1) * Math.max(0.06, Math.abs(fx));         // edge-on is the read, but never a zero-width draw
        }
        alive++;
        ctx.globalAlpha = alpha;
        ctx.setTransform(c * fx * dpr, s * fx * dpr, -s * dpr, c * dpr, p.x * dpr, p.y * dpr);
        ctx.drawImage(img, p.cell * CELL, 0, CELL, CELL, -p.size / 2, -p.size / 2, p.size, p.size);
      }
    }
    const settled = !pointer.in || Math.abs(pointer.x - em.x) + Math.abs(pointer.y - em.y) < 0.5;
    if (alive || !settled) raf = requestAnimationFrame(frame);
    else if (wait < Infinity) { clearTimeout(timer); timer = setTimeout(wake, Math.max(16, wait)); }   // nothing aloft: sleep until the next bract is due
  };
  const wake = () => {
    if (raf || document.hidden) return;
    clearTimeout(timer);
    last = performance.now(); lastScroll = window.scrollY; raf = requestAnimationFrame(frame);
  };

  // a copy of the sheet with a wash laid over the petals only (source-atop), optionally blurred first
  const bake = (wash, blur) => {
    const c = document.createElement('canvas'); c.width = sheet.naturalWidth; c.height = sheet.naturalHeight;
    const g = c.getContext('2d');
    if (blur) g.filter = `blur(${blur}px)`;
    g.drawImage(sheet, 0, 0);
    g.filter = 'none';
    if (wash) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = wash; g.fillRect(0, 0, c.width, c.height); }
    return c;
  };

  const start = () => {
    fit();
    ctx.imageSmoothingQuality = 'high';
    // three shades of the same petals, so no two bracts share one pink: as cut, a little deeper, a little
    // paler; the undersides are washed paler and duller still; the near ones come from a softened copy
    faces = [sheet, bake('rgba(120, 8, 70, .16)'), bake('rgba(255, 236, 246, .2)')];
    back = bake('rgba(236, 222, 228, .38)');
    soft = bake(null, 1.1);
    softBack = bake('rgba(236, 222, 228, .38)', 1.1);
    document.body.appendChild(canvas);
    addEventListener('resize', fit);
    if (fine) {
      addEventListener('pointermove', (e) => {
        if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        if (!pointer.in) { em.x = e.clientX; em.y = e.clientY; em.acc = 0; }   // re-entering: no streak from where it left
        pointer.x = e.clientX; pointer.y = e.clientY; pointer.in = true;
        wake();
      }, { passive: true });
      addEventListener('mouseout', (e) => { if (!e.relatedTarget) pointer.in = false; });
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; clearTimeout(timer); } else wake();
    });
    // every spray sheds while it is on screen; the first bract comes a moment after it arrives
    const io = 'IntersectionObserver' in window && new IntersectionObserver((entries) => {
      const now = performance.now();
      for (const en of entries) {
        const s = en.target._petalSpray; if (!s) continue;
        if (en.isIntersecting && !s.visible) s.next = now + rand(0.3, 1.2) * 1000;
        s.visible = en.isIntersecting;
      }
      onScreen = sprays.filter((s) => s.visible).length;
      if (onScreen) wake();
    }, { rootMargin: '0px' });
    if (io) document.querySelectorAll('.flower').forEach((el) => {
      const s = { el, visible: false, next: 0 };
      el._petalSpray = s; sprays.push(s); io.observe(el);
    });
  };
  (sheet.decode ? sheet.decode() : new Promise((r, j) => { sheet.onload = r; sheet.onerror = j; })).then(start).catch(() => {});
})();
