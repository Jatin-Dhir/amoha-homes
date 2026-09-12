/* ==========================================================================
   Amoha — bougainvillea petals shed from the pointer
   A few bracts break off the cursor as it moves and flutter down. They are the site's own flowers,
   cropped single-petal from the spray cut-outs into assets/img/petals.png, not a generic particle.
   Emission is by distance travelled, not by time, so a slow drag and a quick flick lay the same
   even trail and a resting hand sheds nothing. Fine pointers only; never under reduced motion or
   the lite tier; and the loop sleeps whenever no petal is in the air.
   ========================================================================== */
(function () {
  'use strict';
  const mq = (q) => !!(window.matchMedia && matchMedia(q).matches);
  if (!mq('(hover: hover) and (pointer: fine)') || mq('(prefers-reduced-motion: reduce)')) return;
  if (window.ERA && (ERA.lite || ERA.reduced)) return;

  const CELLS = 8, CELL = 48;          // the sheet: eight petals in 48px cells
  const N = 64;                        // ring buffer: the most petals ever in the air
  const STEP = 38;                     // px of pointer travel per petal
  const GUARD = 6;                     // a teleporting pointer never sheds more than this in a frame

  const sheet = new Image();
  sheet.src = 'assets/img/petals.png';
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
  const pointer = { x: 0, y: 0, in: false };
  const em = { x: 0, y: 0, vx: 0, vy: 0, acc: 0 };
  let raf = 0, last = 0, lastScroll = window.scrollY;
  const rand = (a, b) => a + Math.random() * (b - a);

  const spawn = (x, y) => {
    const p = petals[slot]; slot = (slot + 1) % N;   // take the slot, then advance
    p.x = x; p.y = y;
    p.vx = em.vx * 0.1 + rand(-36, 36);              // a little of the hand's momentum, a little scatter
    p.vy = em.vy * 0.1 - rand(18, 48);               // lifted as it leaves, before it starts to fall
    p.rot = rand(0, Math.PI * 2); p.vr = rand(-2.6, 2.6);
    p.flip = rand(0, Math.PI * 2); p.vf = rand(2.2, 4.6);
    p.phase = rand(0, Math.PI * 2);
    p.size = rand(13, 24); p.cell = (Math.random() * CELLS) | 0;
    p.t = 0; p.life = rand(1.9, 3.1);
  };

  const frame = (now) => {
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
    const scroll = window.scrollY, carried = scroll - lastScroll; lastScroll = scroll;   // petals ride the page as it scrolls
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    for (let i = 0; i < N; i++) {
      const p = petals[i]; if (!p.life) continue;
      p.t += dt; if (p.t >= p.life) { p.life = 0; continue; }
      alive++;
      p.vy += 150 * dt;                                                   // gravity
      p.vx *= 1 - 1.3 * dt; p.vy *= 1 - 0.8 * dt;                        // drag: a bract falls like paper, not a stone
      p.x += (p.vx + Math.sin(p.t * 2.4 + p.phase) * 26) * dt;          // flutter
      p.y += p.vy * dt - carried;
      p.rot += p.vr * dt; p.flip += p.vf * dt;
      const u = p.t / p.life, alpha = u < 0.08 ? u / 0.08 : u > 0.6 ? (1 - u) / 0.4 : 1;
      const c = Math.cos(p.rot), s = Math.sin(p.rot);
      let fx = Math.cos(p.flip); fx = (fx < 0 ? -1 : 1) * Math.max(0.18, Math.abs(fx));   // tumbling, never edge-on to nothing
      ctx.globalAlpha = alpha * 0.95;
      ctx.setTransform(c * fx * dpr, s * fx * dpr, -s * dpr, c * dpr, p.x * dpr, p.y * dpr);
      ctx.drawImage(sheet, p.cell * CELL, 0, CELL, CELL, -p.size / 2, -p.size / 2, p.size, p.size);
    }
    const settled = !pointer.in || Math.abs(pointer.x - em.x) + Math.abs(pointer.y - em.y) < 0.5;
    raf = alive || !settled ? requestAnimationFrame(frame) : 0;
  };
  const wake = () => { if (!raf && !document.hidden) { last = performance.now(); lastScroll = window.scrollY; raf = requestAnimationFrame(frame); } };

  const start = () => {
    fit();
    ctx.imageSmoothingQuality = 'high';
    document.body.appendChild(canvas);
    addEventListener('resize', fit);
    addEventListener('pointermove', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      if (!pointer.in) { em.x = e.clientX; em.y = e.clientY; em.acc = 0; }   // re-entering: no streak from where it left
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.in = true;
      wake();
    }, { passive: true });
    addEventListener('mouseout', (e) => { if (!e.relatedTarget) pointer.in = false; });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; } else wake();
    });
  };
  (sheet.decode ? sheet.decode() : new Promise((r, j) => { sheet.onload = r; sheet.onerror = j; })).then(start).catch(() => {});
})();
