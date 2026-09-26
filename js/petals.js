/* ==========================================================================
   Amoha — bougainvillea petals
   Two sources share one canvas, one sprite sheet and one loop:
   - the pointer: a few bracts break off the cursor as it moves. Emission is by distance travelled,
     not by time, so a slow drag and a quick flick lay the same even trail and a resting hand sheds
     nothing. Fine pointers only.
   - every spray on the page (.flower): now and then a bract lets go of the plant and drifts down.
     It leaves from the pink of the spray itself — each poster is sampled once for its pink pixels,
     mapped through the spray's own rotation and mirroring — never from the empty corners of its
     square. Only sprays on screen shed; phones shed about half as often.
   The petals are the site's own flowers, cropped single-petal from the spray cut-outs into
   assets/img/petals.png, not a generic particle. A falling bract tumbles through the plane — it
   thins to an edge and turns over, showing a paler back — and slides sideways fastest while it is
   edge-on, which is what makes it read as a leaf rather than confetti. Never under reduced motion or
   the lite tier; the loop sleeps whenever nothing is in the air and nothing is due to fall.
   ========================================================================== */
(function () {
  'use strict';
  const mq = (q) => !!(window.matchMedia && matchMedia(q).matches);
  if (mq('(prefers-reduced-motion: reduce)')) return;
  if (window.ERA && (ERA.lite || ERA.reduced)) return;
  const fine = mq('(hover: hover) and (pointer: fine)');

  const CELLS = 8, CELL = 48;          // the sheet: eight petals in 48px cells
  const N = 96;                        // ring buffer: the most petals ever in the air
  const STEP = 38;                     // px of pointer travel per petal
  const GUARD = 6;                     // a teleporting pointer never sheds more than this in a frame
  const TAU = Math.PI * 2;
  const SPRAY_MAX = fine ? 36 : 16;    // spray petals in the air at once
  const GAP = fine ? [0.9, 2.4] : [1.8, 4.2];   // seconds between two bracts from one spray

  const sheet = new Image();
  sheet.src = 'assets/img/petals.png';
  let back = null;                     // the same petals, paler and duller: their undersides
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
  let raf = 0, timer = 0, last = 0, lastScroll = window.scrollY;
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- the pointer's trail ---------- */
  const spawn = (x, y) => {
    const p = take();
    p.kind = 0; p.x = x; p.y = y;
    p.vx = em.vx * 0.1 + rand(-36, 36);              // a little of the hand's momentum, a little scatter
    p.vy = em.vy * 0.1 - rand(18, 48);               // lifted as it leaves, before it starts to fall
    p.rot = rand(0, TAU); p.vr = rand(-2.6, 2.6);
    p.flip = rand(0, TAU); p.vf = rand(2.2, 4.6);
    p.phase = rand(0, TAU);
    p.size = rand(13, 24); p.cell = (Math.random() * CELLS) | 0;
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
    const p = take();
    p.kind = 1; p.x = x; p.y = y;
    p.vx = rand(-10, 10); p.vy = rand(2, 12);       // it lets go, it is not thrown
    p.fall = rand(24, 54);                          // terminal speed: a bract falls like paper
    p.spin = rand(0, TAU); p.vs = rand(1.4, 3.3) * (Math.random() < 0.5 ? -1 : 1);   // the tumble through the plane
    p.roll = rand(0, TAU); p.vroll = rand(-0.9, 0.9);                                // drift within the plane
    p.slip = rand(14, 38);
    p.size = Math.max(11, Math.min(28, r.width * rand(0.022, 0.035)));
    p.cell = (Math.random() * CELLS) | 0;
    p.drop = 0; p.reach = innerHeight * rand(0.3, 0.55);   // how far it falls before it has faded
    p.peak = rand(0.78, 0.95);
    p.t = 0; p.life = 1;
  };
  const due = (now) => {                             // shed from every spray on screen that is due; returns ms to the next
    let soonest = Infinity;
    for (const s of sprays) {
      if (!s.visible) continue;
      if (now >= s.next) { if (aloft() < SPRAY_MAX) shed(s); s.next = now + rand(GAP[0], GAP[1]) * 1000; }
      soonest = Math.min(soonest, s.next - now);
    }
    return soonest;
  };

  /* ---------- one loop for both ---------- */
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(1 / 30, (now - last) / 1000 || 0); last = now;
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    for (let i = 0; i < N; i++) {
      const p = petals[i]; if (!p.life) continue;
      p.t += dt;
      let alpha, c, s, fx, img = sheet;
      if (p.kind === 0) {
        if (p.t >= p.life) { p.life = 0; continue; }
        p.vy += 150 * dt;                                                   // gravity
        p.vx *= 1 - 1.3 * dt; p.vy *= 1 - 0.8 * dt;                        // drag: a bract falls like paper, not a stone
        p.x += (p.vx + Math.sin(p.t * 2.4 + p.phase) * 26) * dt;          // flutter
        p.y += p.vy * dt - carried;
        p.rot += p.vr * dt; p.flip += p.vf * dt;
        const u = p.t / p.life;
        alpha = (u < 0.08 ? u / 0.08 : u > 0.6 ? (1 - u) / 0.4 : 1) * 0.95;
        c = Math.cos(p.rot); s = Math.sin(p.rot);
        fx = Math.cos(p.flip); fx = (fx < 0 ? -1 : 1) * Math.max(0.18, Math.abs(fx));   // tumbling, never edge-on to nothing
      } else {
        const edge = Math.abs(Math.sin(p.spin));                          // 1 when it knifes through the air edge-on
        p.vy += (p.fall * (0.7 + 0.6 * edge) - p.vy) * (1 - Math.exp(-1.8 * dt));   // flat it floats, edge-on it dives
        p.vx *= 1 - 1.2 * dt;
        p.spin += p.vs * dt; p.roll += p.vroll * dt;
        const dy = p.vy * dt;
        p.x += (p.vx + Math.sin(p.spin) * p.slip) * dt;                   // the slip rides the tumble, not a separate wobble
        p.y += dy - carried; p.drop += dy;
        const u = p.drop / p.reach;
        if (u >= 1 || p.y > innerHeight + 40 || p.y < -80) { p.life = 0; continue; }
        alpha = Math.min(1, p.t / 0.35) * (u > 0.7 ? (1 - u) / 0.3 : 1) * p.peak;
        c = Math.cos(p.roll); s = Math.sin(p.roll);
        fx = Math.cos(p.spin);
        if (fx < 0 && back) img = back;                                   // turned over: its paler underside
        fx = (fx < 0 ? -1 : 1) * Math.max(0.06, Math.abs(fx));           // edge-on is the read, but never a zero-width draw
      }
      alive++;
      ctx.globalAlpha = alpha;
      ctx.setTransform(c * fx * dpr, s * fx * dpr, -s * dpr, c * dpr, p.x * dpr, p.y * dpr);
      ctx.drawImage(img, p.cell * CELL, 0, CELL, CELL, -p.size / 2, -p.size / 2, p.size, p.size);
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

  const start = () => {
    fit();
    ctx.imageSmoothingQuality = 'high';
    // the undersides: the same sheet, washed paler and duller
    back = document.createElement('canvas'); back.width = sheet.naturalWidth; back.height = sheet.naturalHeight;
    const b = back.getContext('2d');
    b.drawImage(sheet, 0, 0);
    b.globalCompositeOperation = 'source-atop';
    b.fillStyle = 'rgba(236, 222, 228, .38)';
    b.fillRect(0, 0, back.width, back.height);
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
