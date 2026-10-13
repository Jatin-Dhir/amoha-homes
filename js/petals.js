/*!
 * Amoha Group website
 * Falling petals
 * Designed and developed by Jatin Dhir <jatindhir.dev@gmail.com>
 */
(function() {
  'use strict';
  const mq = q => !!(window.matchMedia && matchMedia(q).matches);
  if (mq('(prefers-reduced-motion: reduce)')) return;
  if (window.AMOHA && (AMOHA.lite || AMOHA.reduced)) return;
  const fine = mq('(hover: hover) and (pointer: fine)');
  const CELLS = 9, CELL = 48;
  const N = 240;
  const STEP = 38;
  const GUARD = 6;
  const TAU = Math.PI * 2;
  const SPRAY_MAX = fine ? 150 : 60;
  const GAP = fine ? [ .15, .5 ] : [ .35, 1 ];
  const LAYERS = [ {
    share: .3,
    scale: [ .55, .75 ],
    alpha: [ .42, .6 ],
    fall: .72,
    drift: .6
  }, {
    share: fine ? .58 : .62,
    scale: [ .9, 1.1 ],
    alpha: [ .82, .95 ],
    fall: 1,
    drift: 1
  }, {
    share: fine ? .12 : .08,
    scale: [ 1.12, 1.3 ],
    alpha: [ .86, .96 ],
    fall: 1.22,
    drift: 1.18
  } ];
  const SIZE_MAX = 40;
  const sheet = new Image;
  sheet.src = 'assets/img/petals.png';
  let faces = [ sheet ], back = null;
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
  const petals = Array.from({
    length: N
  }, () => ({
    life: 0
  }));
  let slot = 0;
  const take = () => {
    const p = petals[slot];
    slot = (slot + 1) % N;
    return p;
  };
  const pointer = {
    x: 0,
    y: 0,
    in: false
  };
  const em = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    acc: 0
  };
  let raf = 0, timer = 0, last = 0, lastScroll = window.scrollY, clock = 0;
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- the pointer's trail ---------- */
  const spawn = (x, y) => {
    const p = take();
    p.kind = 0;
    p.layer = 1;
    p.x = x;
    p.y = y;
    p.vx = em.vx * .1 + rand(-36, 36);
    p.vy = em.vy * .1 - rand(18, 48);
    p.rot = rand(0, TAU);
    p.vr = rand(-2.6, 2.6);
    p.flip = rand(0, TAU);
    p.vf = rand(2.2, 4.6);
    p.phase = rand(0, TAU);
    p.size = rand(13, 24);
    p.cell = Math.random() * CELLS | 0;
    p.tint = Math.random() * 3 | 0;
    p.t = 0;
    p.life = rand(1.9, 3.1);
  };

  /* ---------- the sprays ---------- */
  const pinkOf = {};
  const sample = img => {
    const src = img.currentSrc || img.src;
    if (pinkOf[src] || !img.naturalWidth) return pinkOf[src] || null;
    const S = 64, c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d', {
      willReadFrequently: true
    });
    g.drawImage(img, 0, 0, S, S);
    let d;
    try {
      d = g.getImageData(0, 0, S, S).data;
    } catch (e) {
      return null;
    }
    const pts = [];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4, r = d[i], gr = d[i + 1], b = d[i + 2];
      if (d[i + 3] > 160 && r > 120 && r > gr + 50 && b > gr + 20) pts.push([ (x + .5) / S, (y + .5) / S ]);
    }
    return pinkOf[src] = pts.length ? pts : null;
  };
  const sprays = [];
  let onScreen = 0;
  const aloft = () => {
    let n = 0;
    for (let i = 0; i < N; i++) if (petals[i].life && petals[i].kind === 1) n++;
    return n;
  };
  const pickLayer = () => {
    let u = Math.random();
    for (let i = 0; i < LAYERS.length; i++) {
      u -= LAYERS[i].share;
      if (u <= 0) return i;
    }
    return 1;
  };
  const shed = s => {
    const img = s.el.querySelector('img');
    if (!img) return;
    const pts = sample(img);
    if (!pts) return;
    const r = s.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const w = s.el.offsetWidth, h = s.el.offsetHeight;
    const t = getComputedStyle(s.el).transform;
    const m = t && t !== 'none' ? new DOMMatrixReadOnly(t) : {
      a: 1,
      b: 0,
      c: 0,
      d: 1
    };
    let L = 0, T = 0, R = innerWidth, B = innerHeight;
    for (let a = s.el.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a), cx = cs.overflowX !== 'visible', cy = cs.overflowY !== 'visible';
      if (!cx && !cy) continue;
      const k = a.getBoundingClientRect();
      if (cx) {
        L = Math.max(L, k.left);
        R = Math.min(R, k.right);
      }
      if (cy) {
        T = Math.max(T, k.top);
        B = Math.min(B, k.bottom);
      }
    }
    let x, y, tries = 10;
    do {
      const [u, v] = pts[Math.random() * pts.length | 0];
      const lx = (u - .5) * w, ly = (v - .5) * h;
      x = r.left + r.width / 2 + m.a * lx + m.c * ly;
      y = r.top + r.height / 2 + m.b * lx + m.d * ly;
    } while ((x < L || x > R || y < T || y > B) && --tries);
    if (!tries) return;
    const layer = pickLayer(), Ly = LAYERS[layer];
    const p = take();
    p.kind = 1;
    p.layer = layer;
    p.x = x;
    p.y = y;
    p.vx = rand(-10, 10);
    p.vy = rand(2, 12);
    p.fall = rand(34, 66) * Ly.fall;
    p.spin = rand(0, TAU);
    p.vs = rand(1.4, 3.3) * (Math.random() < .5 ? -1 : 1);
    p.roll = rand(0, TAU);
    p.vroll = rand(-.9, .9);
    p.slip = rand(16, 40) * (layer === 2 ? 1.15 : 1);
    p.dir = x < innerWidth / 2 ? 1 : -1;
    p.catch = rand(.6, 1.2) * Ly.drift;
    p.size = Math.max(9, Math.min(SIZE_MAX, Math.max(r.width * rand(.034, .05), innerWidth * rand(.009, .013)) * rand(Ly.scale[0], Ly.scale[1])));
    p.cell = Math.random() * CELLS | 0;
    p.tint = Math.random() * 3 | 0;
    p.drop = 0;
    p.reach = innerHeight * rand(.75, 1.2);
    p.peak = rand(Ly.alpha[0], Ly.alpha[1]);
    p.t = 0;
    p.life = 1;
  };
  const due = now => {
    let soonest = Infinity;
    for (const s of sprays) {
      if (!s.visible) continue;
      if (now >= s.next) {
        const n = Math.random() < .3 ? Math.random() < .35 ? 3 : 2 : 1;
        for (let k = 0; k < n && aloft() < SPRAY_MAX; k++) shed(s);
        s.next = now + rand(GAP[0], GAP[1]) * 1e3;
      }
      soonest = Math.min(soonest, s.next - now);
    }
    return soonest;
  };

  /* ---------- one loop for both ---------- */
  const frame = now => {
    raf = 0;
    const dt = Math.min(1 / 30, (now - last) / 1e3 || 0);
    last = now;
    clock += dt;
    if (pointer.in) {
      const k = 1 - Math.exp(-16 * dt);
      const nx = em.x + (pointer.x - em.x) * k, ny = em.y + (pointer.y - em.y) * k;
      const dx = nx - em.x, dy = ny - em.y, moved = Math.hypot(dx, dy);
      em.vx = dt ? dx / dt : 0;
      em.vy = dt ? dy / dt : 0;
      em.acc += moved;
      let n = 0;
      while (em.acc >= STEP && n < GUARD) {
        em.acc -= STEP;
        n++;
        const t = moved > 1e-6 ? Math.min(1, n * STEP / moved) : 0;
        spawn(em.x + dx * t, em.y + dy * t);
      }
      if (n === GUARD) em.acc = 0;
      em.x = nx;
      em.y = ny;
    }
    const wait = onScreen ? due(now) : Infinity;
    const scroll = window.scrollY, carried = scroll - lastScroll;
    lastScroll = scroll;
    const wind = 16 + 9 * Math.sin(clock * .21) + 5 * Math.sin(clock * .57 + 1.1);
    const ease = 1 - Math.exp(-.9 * dt);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    for (let layer = 0; layer < LAYERS.length; layer++) {
      for (let i = 0; i < N; i++) {
        const p = petals[i];
        if (!p.life || p.layer !== layer) continue;
        p.t += dt;
        let alpha, c, s, fx, img;
        if (p.kind === 0) {
          if (p.t >= p.life) {
            p.life = 0;
            continue;
          }
          p.vy += 150 * dt;
          p.vx *= 1 - 1.3 * dt;
          p.vy *= 1 - .8 * dt;
          p.x += (p.vx + Math.sin(p.t * 2.4 + p.phase) * 26) * dt;
          p.y += p.vy * dt - carried;
          p.rot += p.vr * dt;
          p.flip += p.vf * dt;
          const u = p.t / p.life;
          alpha = (u < .08 ? u / .08 : u > .6 ? (1 - u) / .4 : 1) * .95;
          c = Math.cos(p.rot);
          s = Math.sin(p.rot);
          fx = Math.cos(p.flip);
          fx = (fx < 0 ? -1 : 1) * Math.max(.18, Math.abs(fx));
          img = faces[p.tint] || sheet;
        } else {
          const edge = Math.abs(Math.sin(p.spin)), flat = 1 - edge;
          p.vy += (p.fall * (.7 + .6 * edge) - p.vy) * (1 - Math.exp(-1.8 * dt));
          p.vx += (p.dir * wind * p.catch * (.45 + .55 * flat) - p.vx) * ease;
          p.spin += p.vs * dt;
          p.roll += p.vroll * dt;
          const dy = p.vy * dt;
          p.x += (p.vx + Math.sin(p.spin) * p.slip) * dt;
          p.y += dy - carried;
          p.drop += dy;
          const u = p.drop / p.reach;
          if (u >= 1 || p.y > innerHeight + 60 || p.y < -120 || p.x < -80 || p.x > innerWidth + 80) {
            p.life = 0;
            continue;
          }
          alpha = Math.min(1, p.t / .35) * (u > .75 ? (1 - u) / .25 : 1) * p.peak;
          c = Math.cos(p.roll);
          s = Math.sin(p.roll);
          fx = Math.cos(p.spin);
          const under = fx < 0;
          img = under && back ? back : faces[p.tint] || sheet;
          fx = (fx < 0 ? -1 : 1) * Math.max(.06, Math.abs(fx));
        }
        alive++;
        ctx.globalAlpha = alpha;
        ctx.setTransform(c * fx * dpr, s * fx * dpr, -s * dpr, c * dpr, p.x * dpr, p.y * dpr);
        ctx.drawImage(img, p.cell * CELL, 0, CELL, CELL, -p.size / 2, -p.size / 2, p.size, p.size);
      }
    }
    const settled = !pointer.in || Math.abs(pointer.x - em.x) + Math.abs(pointer.y - em.y) < .5;
    if (alive || !settled) raf = requestAnimationFrame(frame); else if (wait < Infinity) {
      clearTimeout(timer);
      timer = setTimeout(wake, Math.max(16, wait));
    }
  };
  const wake = () => {
    if (raf || document.hidden) return;
    clearTimeout(timer);
    last = performance.now();
    lastScroll = window.scrollY;
    raf = requestAnimationFrame(frame);
  };
  const bake = wash => {
    const c = document.createElement('canvas');
    c.width = sheet.naturalWidth;
    c.height = sheet.naturalHeight;
    const g = c.getContext('2d');
    g.drawImage(sheet, 0, 0);
    if (wash) {
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = wash;
      g.fillRect(0, 0, c.width, c.height);
    }
    return c;
  };
  const start = () => {
    fit();
    ctx.imageSmoothingQuality = 'high';
    faces = [ sheet, bake('rgba(120, 8, 70, .16)'), bake('rgba(255, 236, 246, .2)') ];
    back = bake('rgba(236, 222, 228, .38)');
    document.body.appendChild(canvas);
    addEventListener('resize', fit);
    if (fine) {
      addEventListener('pointermove', e => {
        if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        if (!pointer.in) {
          em.x = e.clientX;
          em.y = e.clientY;
          em.acc = 0;
        }
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.in = true;
        wake();
      }, {
        passive: true
      });
      addEventListener('mouseout', e => {
        if (!e.relatedTarget) pointer.in = false;
      });
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        clearTimeout(timer);
      } else wake();
    });
    const io = 'IntersectionObserver' in window && new IntersectionObserver(entries => {
      const now = performance.now();
      for (const en of entries) {
        const s = en.target._petalSpray;
        if (!s) continue;
        if (en.isIntersecting && !s.visible) s.next = now + rand(.3, 1.2) * 1e3;
        s.visible = en.isIntersecting;
      }
      onScreen = sprays.filter(s => s.visible).length;
      if (onScreen) wake();
    }, {
      rootMargin: '0px'
    });
    if (io) document.querySelectorAll('.flower').forEach(el => {
      const s = {
        el: el,
        visible: false,
        next: 0
      };
      el._petalSpray = s;
      sprays.push(s);
      io.observe(el);
    });
  };
  const idle = fn => window.requestIdleCallback ? requestIdleCallback(fn, {
    timeout: 1500
  }) : setTimeout(fn, 300);
  Promise.all([ window.AMOHA && AMOHA.revealed, sheet.decode ? sheet.decode() : new Promise((r, j) => {
    sheet.onload = r;
    sheet.onerror = j;
  }) ]).then(() => idle(start)).catch(() => {});
})();
