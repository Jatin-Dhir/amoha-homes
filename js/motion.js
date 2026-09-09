/* =========================================================
   ERA RESIDENCE — motion engine
   Smooth scroll (Lenis), custom eases, split-text animators,
   scroll reveals, theme sensors, snap, scroll bar, logo ring,
   preloader and cookie card. Original implementation.
   ========================================================= */
window.ERA = window.ERA || {};
(function (ERA) {
  'use strict';
  const D = { s: 0.4, m: 0.8, l: 1.2, stagger: 0.1, delay: 0.3, bp: 992 };
  ERA.D = D;
  ERA.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  ERA.isMobile = () => window.innerWidth < D.bp;
  ERA.lenis = null;
  const arr = (x) => gsap.utils.toArray(x).filter(Boolean);
  ERA.arr = arr;

  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create('eraInOut', '0.75,0,0.25,1');
  CustomEase.create('eraOut', '0.25,1,0.5,1');
  CustomEase.create('eraIn', '0.5,0,0.75,0');
  CustomEase.create('eraEase', '0.25,0.1,0.25,1');
  CustomEase.create('eraDive', '0.6,0,0,1');
  CustomEase.create('eraHor', '0.25,0,0.75,1');
  // a hesitant, stepping loader curve
  CustomEase.create('eraLoader', 'M0,0 C0.08,0.3 0.2,0.38 0.34,0.46 0.46,0.52 0.5,0.54 0.58,0.6 0.66,0.66 0.72,0.84 0.82,0.92 0.9,0.98 1,1 1,1');

  /* ---------- smooth scroll ---------- */
  ERA.initLenis = function () {
    if (ERA.reduced) return null;
    const lenis = new Lenis({
      wrapper: ERA.wrapper || window, content: ERA.content || document.documentElement,
      // This page is a sequence of set pieces — a reveal, an arch, two horizontal chapters — and
      // at the 1.2/1.0 default a single wheel flick threw you past them. 1.6/0.78 fixed that and
      // overshot: an exponential ease has covered ~98% of its distance by 60% of its duration, so
      // 1.6s left well over half a second of sub-pixel drift after the page had visually stopped.
      // Steeper exponent collapses that tail, a shorter duration ends it sooner, and giving back
      // distance per notch makes the page answer the wheel instead of absorbing it.
      duration: 1.1, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -12 * t))
    });
    if (ERA.wrapper) ScrollTrigger.defaults({ scroller: ERA.wrapper });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    ERA.lenis = lenis;
    return lenis;
  };
  ERA.scrollTo = function (target, opts) {
    opts = opts || {};
    if (ERA.lenis) return ERA.lenis.scrollTo(target, opts);
    const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: opts.immediate ? 'auto' : 'smooth' });
  };
  ERA.lockScroll = function () {
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', sw + 'px');
    document.body.style.paddingRight = 'var(--scrollbar-width)';
    document.documentElement.style.overflow = 'hidden';
    ERA.lenis && ERA.lenis.stop();
  };
  ERA.unlockScroll = function () {
    document.documentElement.style.removeProperty('--scrollbar-width');
    document.body.style.paddingRight = '';
    document.documentElement.style.overflow = '';
    ERA.lenis && ERA.lenis.start();
  };

  /* ---------- split helpers (cached per element) ---------- */
  const splitChars = (el) => el._split || (el._split = new SplitText(el, { type: 'chars', tag: 'span', charsClass: 'split-char', smartWrap: true }));
  const splitWordsChars = (el) => el._split || (el._split = new SplitText(el, { type: 'words,chars', tag: 'span', wordsClass: 'split-word', charsClass: 'split-char', smartWrap: true }));
  const splitLines = (el) => el._split || (el._split = new SplitText(el, { type: 'lines,words', tag: 'span', linesClass: 'split-line', wordsClass: 'split-word', mask: 'lines' }));
  const show = (els) => gsap.set(els, { visibility: 'visible' });

  /* ---------- text & container animators: mode = initial | reveal | hide ----------
     Character staggers are capped with gsap's `amount`: at a flat 0.05s each, a 47-character
     heading took 3.8s and was read half-drawn. `amount` spreads the same stagger across a fixed
     total however many characters there are. */
  // accent script: characters swing in around their baseline
  ERA.animA = function (els, mode, delay) {
    arr(els).forEach((el, i) => {
      if (!el.textContent.trim()) return;
      show(el);
      const chars = splitChars(el).chars, off = i * D.stagger;
      if (mode === 'reveal') gsap.fromTo(chars, { opacity: 0, rotateX: 90, x: '10rem', transformOrigin: 'center bottom' },
        { opacity: 1, rotateX: 0, x: '0rem', duration: D.l, delay: (delay ?? D.delay) + off, stagger: { each: D.stagger, amount: 0.6 }, ease: 'eraOut', overwrite: true });
      else if (mode === 'hide') gsap.to(chars, { opacity: 0, rotateX: -90, x: '-10rem', transformOrigin: 'center top', duration: D.s, delay: delay ?? 0, stagger: { each: D.stagger * 0.5, amount: 0.3 }, ease: 'eraIn', overwrite: true });
      else gsap.set(chars, { opacity: 0, rotateX: -90, x: '-10rem', transformOrigin: 'center top' });
    });
  };
  // display headings: characters rise and turn into place
  ERA.animH = function (els, mode, delay) {
    arr(els).forEach((el, i) => {
      if (!el.textContent.trim()) return;
      show(el);
      const chars = splitWordsChars(el).chars, off = i * D.stagger;
      if (mode === 'reveal') gsap.fromTo(chars, { opacity: 0, yPercent: 50, rotateY: 90 },
        { opacity: 1, yPercent: 0, rotateY: 0, duration: D.l, delay: (delay ?? D.delay) + off, stagger: { each: D.stagger * 0.5, amount: 0.5 }, ease: 'eraOut', overwrite: true });
      else if (mode === 'hide') gsap.to(chars, { opacity: 0, yPercent: -50, rotateY: -90, duration: D.s, delay: delay ?? 0, stagger: { each: D.stagger * 0.25, amount: 0.25 }, ease: 'eraIn', overwrite: true });
      else gsap.set(chars, { opacity: 0, yPercent: 50, rotateY: 90 });
    });
  };
  // paragraphs & labels: masked lines slide up
  ERA.animP = function (els, mode, delay) {
    arr(els).forEach((el, i) => {
      if (!el.textContent.trim()) return;
      show(el);
      const lines = splitLines(el).lines, off = i * D.stagger;
      if (mode === 'reveal') gsap.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: D.l, delay: (delay ?? D.delay) + off, stagger: D.stagger, ease: 'eraOut', overwrite: true });
      else if (mode === 'hide') gsap.to(lines, { yPercent: -110, duration: D.s, delay: delay ?? 0, stagger: D.stagger * 0.5, ease: 'eraIn', overwrite: true });
      else gsap.set(lines, { yPercent: 110 });
    });
  };
  // containers (buttons, icons, blocks): fade + lift
  ERA.animCtn = function (els, mode, delay) {
    const list = arr(els); if (!list.length) return;
    show(list);
    const y = ERA.isMobile() ? '11.54rem' : '3.333rem';
    if (mode === 'reveal') gsap.fromTo(list, { opacity: 0, y }, { opacity: 1, y: '0rem', duration: D.l, delay: delay ?? D.delay, stagger: D.stagger, ease: 'eraOut', overwrite: true });
    else if (mode === 'hide') gsap.to(list, { opacity: 0, y: '0rem', duration: D.s, delay: delay ?? 0, stagger: D.stagger * 0.5, ease: 'eraIn', overwrite: true });
    else gsap.set(list, { opacity: 0, y });
  };
  // vertical hairlines draw downward
  ERA.animLine = function (els, mode, delay) {
    const list = arr(els); if (!list.length) return;
    show(list);
    if (mode === 'reveal') gsap.fromTo(list, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: D.l, delay: delay ?? D.delay, stagger: D.stagger, ease: 'eraOut', overwrite: true });
    else if (mode === 'hide') gsap.to(list, { clipPath: 'inset(100% 0% 0% 0%)', duration: D.s, delay: delay ?? 0, stagger: D.stagger * 0.5, ease: 'eraIn', overwrite: true });
    else gsap.set(list, { clipPath: 'inset(0% 0% 100% 0%)' });
  };
  // images: a slanted wipe while the picture settles from a zoom
  ERA.animSlide = function (els, mode, delay) {
    const list = arr(els); if (!list.length) return;
    show(list);
    const inner = list.map((e) => e.firstElementChild).filter(Boolean);
    if (mode === 'reveal') {
      gsap.fromTo(list, { clipPath: 'polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)' }, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: D.l, delay: delay ?? D.delay, ease: 'eraInOut', overwrite: true });
      gsap.fromTo(inner, { scale: 1.5, xPercent: 25 }, { scale: 1, xPercent: 0, duration: D.l, delay: delay ?? D.delay, ease: 'eraInOut', overwrite: 'auto' });   /* true let a later tween kill this one mid-flight, so phone card photos never reached scale 1 and sat cropped inside their frames */
    } else if (mode === 'hide') {
      gsap.fromTo(list, { clipPath: 'polygon(0% 0%, 100% 0%, 125% 100%, 0% 100%)' }, { clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)', duration: D.l, delay: delay ?? 0, ease: 'eraInOut', overwrite: true });
      gsap.to(inner, { scale: 1.5, xPercent: -25, duration: D.l, delay: delay ?? 0, ease: 'eraInOut', overwrite: true });
    } else {
      gsap.set(list, { clipPath: 'polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)' });
      gsap.set(inner, { scale: 1.5, xPercent: 25 });
    }
  };
  ERA.anim = { a: ERA.animA, h: ERA.animH, p: ERA.animP, ctn: ERA.animCtn, line: ERA.animLine, slide: ERA.animSlide };

  /* ---------- scroll reveals: every [data-reveal] plays once when it enters ---------- */
  ERA.initReveals = function () {
    // inside sliders only the first slide reveals on scroll; the others are handled by the slider itself
    const groups = new Map();
    arr('[data-reveal-first]').forEach((el) => { const p = el.parentElement; if (!groups.has(p)) groups.set(p, []); groups.get(p).push(el); });
    groups.forEach((list) => list.slice(1).forEach((el) => el.querySelectorAll('[data-reveal]').forEach((x) => x.removeAttribute('data-reveal'))));

    Object.keys(ERA.anim).forEach((type) => {
      arr('[data-reveal="' + type + '"]').forEach((el) => {
        if (ERA.reduced) { show(el); return; }
        ERA.anim[type](el, 'initial');
        const horiz = el.closest('[data-horizontal]');
        const ca = horiz && horiz._tween;
        ScrollTrigger.create({
          trigger: el, containerAnimation: ca || undefined,
          start: ca ? 'left right' : 'top bottom', once: true,
          onEnter: () => ERA.anim[type](el, 'reveal')
        });
      });
    });
  };

  /* ---------- theme sensors: fixed UI adopts the theme of what sits behind it ---------- */
  ERA.initThemes = function () {
    const uis = arr('[data-theme]'); if (!uis.length) return;
    const classes = ['t-light', 't-brand', 't-color', 't-dark'];
    const map = { light: 't-light', color: 't-color', dark: 't-dark' };
    const apply = (ui, cls) => classes.forEach((c) => ui.classList.toggle(c, c === cls));
    arr('[data-bg]').forEach((sensor) => {
      if (getComputedStyle(sensor).display === 'none') return;
      const cls = map[sensor.dataset.bg]; if (!cls) return;
      const sr = sensor.getBoundingClientRect();
      uis.forEach((ui) => {
        const r = ui.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        if (cx < sr.left || cx > sr.right) return;
        ScrollTrigger.create({
          trigger: sensor, start: () => 'top top+=' + cy, end: () => 'bottom top+=' + cy,
          onEnter: () => apply(ui, cls), onEnterBack: () => apply(ui, cls)
        });
      });
    });
  };

  /* ---------- snap to full-height chapters ---------- */
  ERA.initSnap = function () {
    if (ERA.isMobile() || ERA.reduced || !ERA.lenis) return;
    const els = arr('[data-snap]'); if (!els.length) return;
    let tmr = null;
    ERA.lenis.on('scroll', () => {
      clearTimeout(tmr);
      tmr = setTimeout(() => {
        const vh = window.innerHeight; let best = null, bestRatio = 0;
        els.forEach((el) => {
          // Snap is for chapters that are one screen tall. A scroll-driven chapter (a pinned
          // horizontal track) is several screens, so `visible / min(height, vh)` is over the
          // threshold for its whole length and every pause dragged the reader back to its top.
          if (el.offsetHeight > vh * 1.4) return;
          const r = el.getBoundingClientRect();
          const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
          const ratio = visible / Math.min(el.offsetHeight, vh);
          if (ratio > 0.5 && ratio > bestRatio) { bestRatio = ratio; best = el; }
        });
        if (best) ERA.lenis.scrollTo(best, { duration: D.l, easing: gsap.parseEase('eraEase') });
      }, 40);
    });
  };

  /* ---------- left scroll bar with percentage thumb ---------- */
  ERA.initScrollbar = function () {
    const bar = document.querySelector('[data-bar]'); if (!bar || ERA.isMobile()) return;
    const thumb = bar.querySelector('[data-bar-thumb]'), label = bar.querySelector('[data-bar-label]');
    const update = (p) => { bar.style.setProperty('--progress', (p * 100) + '%'); if (label) label.textContent = String(Math.round(p * 100)).padStart(2, '0'); };
    const limit = () => (ERA.lenis ? ERA.lenis.limit : document.documentElement.scrollHeight - window.innerHeight);
    if (ERA.lenis) ERA.lenis.on('scroll', (e) => update(e.progress));
    else { const f = () => update(gsap.utils.clamp(0, 1, window.scrollY / Math.max(1, limit()))); addEventListener('scroll', f, { passive: true }); f(); }
    let dragging = false;
    thumb.addEventListener('pointerdown', (e) => { dragging = true; thumb.setPointerCapture(e.pointerId); document.body.style.cursor = 'grabbing'; });
    thumb.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const r = bar.getBoundingClientRect();
      const t = gsap.utils.clamp(0, 1, (e.clientY - r.top) / r.height);
      ERA.scrollTo(t * limit(), { duration: 3.2 });
    });
    const stop = () => { dragging = false; document.body.style.cursor = ''; };
    thumb.addEventListener('pointerup', stop); thumb.addEventListener('pointercancel', stop);
  };

  /* ---------- logo ring: keeps turning, speeds up and reverses with scroll ---------- */
  ERA.initLogoRing = function () {
    const ring = document.querySelector('[data-logo-ring]'); if (!ring || ERA.reduced) return;
    const state = { speed: 30 }; let angle = 0, dir = 1, interacted = false, tmr;
    addEventListener('wheel', () => { interacted = true; }, { once: true, passive: true });
    addEventListener('touchmove', () => { interacted = true; }, { once: true, passive: true });
    gsap.ticker.add((t, dt) => { angle += state.speed * (Math.min(dt, 100) / 1000); gsap.set(ring, { rotation: angle, transformOrigin: 'center center' }); });
    const onScroll = (v) => {
      if (!interacted) return;
      if (v !== 0) dir = v > 0 ? 1 : -1;
      gsap.to(state, { speed: dir * (30 + 10 * Math.abs(v)), duration: 0.3, ease: 'eraOut', overwrite: true });
      clearTimeout(tmr); tmr = setTimeout(() => gsap.to(state, { speed: 30 * dir, duration: D.l, ease: 'eraOut' }), 100);
    };
    if (ERA.lenis) ERA.lenis.on('scroll', (e) => onScroll(e.velocity));
    else { let last = scrollY; addEventListener('scroll', () => { onScroll((scrollY - last) / 10); last = scrollY; }, { passive: true }); }
  };

  /* ---------- preloader: an arch rises through a plum panel and opens onto the hero ---------- */
  ERA.initPreloader = function (onReady) {
    const pre = document.querySelector('[data-preloader]');
    // Amoha ships a different first screen (a doorway, below). Era keeps this one.
    if (pre && pre.querySelector('[data-pl-svg]')) { ERA.initDoor(pre, onReady); return; }
    const zoom = document.querySelector('[data-hero-zoom]');
    let visited = false;
    try { visited = !!sessionStorage.getItem('era-visited'); sessionStorage.setItem('era-visited', '1'); } catch (e) {}
    // onReady inits every scene; it must fire exactly once even if the intro timeline is
    // interrupted (a tab backgrounded mid-preload pauses rAF, so the GSAP callback below may
    // never be reached). Guard it and add a wall-clock safety net that also tears the overlay down.
    let readyDone = false, teardownDone = false;
    const ready = () => { if (readyDone) return; readyDone = true; onReady && onReady(); };
    const teardown = () => { if (teardownDone) return; teardownDone = true; ERA.unlockScroll(); pre && pre.remove(); ScrollTrigger.refresh(); };
    if (!pre || ERA.reduced) { pre && pre.remove(); ready(); return; }
    setTimeout(() => { ready(); teardown(); }, 11000);   // past the ~8.3s first-visit intro; only a real stall reaches it
    const mob = ERA.isMobile();
    const W = () => window.innerWidth, H = () => window.innerHeight;
    const arch = { w: mob ? 0.40 : 0.24, y: 1.04 };
    const applyArch = () => {
      const w = W(), h = H(), aw = arch.w * w, ay = arch.y * h, x0 = (w - aw) / 2, r = aw / 2, top = ay + r;
      pre.style.setProperty('--arch-w', aw + 'px');
      pre.style.setProperty('--arch-y', ay + 'px');
      pre.style.clipPath = 'path(evenodd, "M0 0H' + w + 'V' + h + 'H0Z M' + x0 + ' ' + top + ' A' + r + ' ' + r + ' 0 0 1 ' + (x0 + aw) + ' ' + top + ' V' + (h + 10) + ' H' + x0 + ' Z")';
    };
    const heroScale = mob ? 1.15 : 0.75;
    ERA.lockScroll(); window.scrollTo(0, 0); if (ERA.wrapper) ERA.wrapper.scrollTop = 0;
    zoom && gsap.set(zoom, { scale: heroScale, transformOrigin: 'center top' });
    applyArch(); pre.style.display = 'block';
    const q = (s) => pre.querySelectorAll(s);
    const mark = pre.querySelector('.preloader__mark'), decor = pre.querySelector('.decor'), track = pre.querySelector('[data-progress-track]'), ctn = pre.querySelector('.preloader__ctn');
    const tl = gsap.timeline({ onComplete: teardown });
    if (!visited) {
      ERA.animA(q('[data-part="a"]'), 'initial'); ERA.animH(q('[data-part="h"]'), 'initial'); ERA.animP(q('[data-part="p"]'), 'initial'); ERA.animCtn(q('[data-part="ctn"]'), 'initial'); ERA.animLine(q('[data-part="line"]'), 'initial');
      tl.add(() => { ERA.animA(q('[data-part="a"]'), 'reveal'); ERA.animH(q('[data-part="h"]'), 'reveal'); ERA.animP(q('[data-part="p"]'), 'reveal'); ERA.animCtn(q('[data-part="ctn"]'), 'reveal', D.s); ERA.animLine(q('[data-part="line"]'), 'reveal'); })
        .to({}, { duration: D.m })
        .fromTo(mark, { opacity: 0 }, { opacity: 0.05, duration: D.l, ease: 'eraOut' })
        .fromTo(decor, { opacity: 0 }, { opacity: 1, duration: D.l, ease: 'eraOut' }, '<')
        .fromTo(track, { yPercent: -100 }, { yPercent: 0, duration: 2.6, ease: 'eraLoader' });
    } else {
      gsap.set(ctn, { display: 'none' });
      tl.fromTo(mark, { opacity: 0 }, { opacity: 0.05, duration: D.l, ease: 'eraOut' }).fromTo(decor, { opacity: 0 }, { opacity: 1, duration: D.l, ease: 'eraOut' }, '<');
    }
    tl.to(arch, { w: mob ? 0.5 : 0.36, y: 0.15, duration: 1.25 * D.l, ease: 'eraInOut', onUpdate: applyArch }, visited ? '<' : '>')
      .to(arch, { w: 1.25, y: -1.0, duration: 1.9 * D.l, ease: 'eraDive', onUpdate: applyArch }, '<80%')
      // fade the frame + wordmark out as the arch dives, so the hero is uncovered cleanly
      // instead of the intro content snapping away when the overlay is removed
      .to([ctn, mark, decor].filter(Boolean), { opacity: 0, duration: 1.1 * D.l, ease: 'eraOut' }, '<')
      .add(() => { zoom && gsap.fromTo(zoom, { scale: heroScale }, { scale: 1, duration: 1.4 * D.l, ease: 'eraInOut' }); }, '<')
      .add(ready, '<20%');
  };

  /* ---------- page transition: the layers wipe ----------
     Adapted from "Layers Animation with Clip-path" (assets/library/components/awwwards-300/
     Page Transitions/3), the same mechanic that drives the facts rows. Three panels wipe up to
     cover the page you are leaving; the page you arrive on lifts them off the top instead of
     playing the door intro a second time. */
  ERA.initPageTransition = function () {
    const pt = document.querySelector('[data-pt]'); if (!pt) return;
    const layers = arr(pt.querySelectorAll('.pt__layer')); if (!layers.length) return;
    const HIDDEN = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';
    const SHOWN = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
    const GONE = 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)';
    const KEY = 'amoha-pt';

    // arriving through a transition: the cover is already down, so lift it rather than re-running
    // the whole first screen for someone who has only clicked to the next page
    let arriving = false;
    try { arriving = sessionStorage.getItem(KEY) === '1'; sessionStorage.removeItem(KEY); } catch (e) {}
    if (arriving && !ERA.reduced) {
      ERA.ptArriving = true;
      pt.classList.add('is-on');
      gsap.set(layers, { clipPath: SHOWN, opacity: 1 });            // inline, so it outranks the class
      document.documentElement.classList.remove('is-arriving');    // hand off from the pre-paint arming
    }
    ERA.ptReveal = function () {
      if (!ERA.ptArriving) return;
      ERA.ptArriving = false;
      gsap.to(layers.slice().reverse(), {
        clipPath: GONE, duration: 0.72, ease: 'eraInOut', stagger: 0.09,
        onComplete: () => pt.classList.remove('is-on'),
      });
    };

    if (ERA.reduced) return;
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href') || '';
      if (!/^[a-z0-9-]+\.html(\?|#|$)/i.test(href)) return;      // a sibling page, nothing else
      e.preventDefault();
      try { sessionStorage.setItem(KEY, '1'); } catch (err) {}
      const go = () => { location.href = href; };
      pt.classList.add('is-on');
      gsap.set(layers, { opacity: 1 });
      gsap.fromTo(layers, { clipPath: HIDDEN }, {
        clipPath: SHOWN, duration: 0.62, ease: 'eraInOut', onComplete: go,
        stagger: {
          each: 0.085,
          // the component's own economy: once a panel has covered the one beneath it, drop that one
          // instead of leaving three full-viewport layers compositing — it costs real frames on a phone
          onComplete: function () {
            const i = layers.indexOf(this.targets()[0]);
            if (i > 0) gsap.set(layers[i - 1], { opacity: 0 });
          },
        },
      });
      setTimeout(go, 1500);        // a stalled tween must never strand the reader behind the cover
    });
  };

  /* ---------- Amoha's first screen: a doorway being made passable ----------
     The site's corner badge — two gold jambs, a semicircular head, a ground line — drawn at
     architectural scale, opening onto the real hero. Each stage is bound to a boot milestone
     (fonts measured, hero decoded, page built) rather than to a fixed timeline, so a warm cache
     walks straight through and a cold one still reads as deliberate. Progress is legible as how
     much light comes through the opening; there is no bar to disbelieve. */
  ERA.initDoor = function (pre, onReady) {
    // Already seen the door this session? Then never show it again — not on a back navigation, not
    // on a re-entry. Era's own preloader had this guard and the rewrite lost it, so coming back
    // from a project page meant six seconds of intro and a scroll reset every single time.
    let seen = false;
    try { seen = sessionStorage.getItem('amoha-seen') === '1'; sessionStorage.setItem('amoha-seen', '1'); } catch (e) {}
    if (seen && !ERA.ptArriving) {
      pre.remove();
      ERA.unlockScroll();
      onReady && onReady();
      ScrollTrigger.refresh();
      return;
    }

    // arrived through the layers wipe: the reader has already had the first screen, so build the
    // page behind the cover and lift it, rather than making them watch the door open again
    if (ERA.ptArriving) {
      pre.remove();
      ERA.unlockScroll(); window.scrollTo(0, 0);
      onReady && onReady();
      ScrollTrigger.refresh();
      gsap.delayedCall(0.12, () => ERA.ptReveal && ERA.ptReveal());
      return;
    }
    const zoom = document.querySelector('[data-hero-zoom]');
    let readyDone = false, downDone = false;
    const ready = () => { if (readyDone) return; readyDone = true; onReady && onReady(); };
    const teardown = () => {
      if (downDone) return; downDone = true;
      document.documentElement.classList.remove('is-door');   // never leave the hero held back
      ERA.unlockScroll(); pre.remove(); ScrollTrigger.refresh();
    };
    setTimeout(() => { ready(); teardown(); }, 9000);      // only a real stall reaches this

    const el = (s) => pre.querySelector(s);
    const wall = el('[data-pl-wall]'), veil = el('[data-pl-veil]'), svg = el('[data-pl-svg]');
    const gl = el('[data-pl-ground]'), jl = el('[data-pl-jamb-l]'), jr = el('[data-pl-jamb-r]');
    const head = el('[data-pl-head]'), key = el('[data-pl-key]'), rule = el('[data-pl-rule]');
    // 0.88, not Era's 0.75: the door's foot has to stay inside the zoomed-out hero photograph or
    // the opening frames the section below it instead of the picture
    const mob = ERA.isMobile(), heroScale = mob ? 1.12 : 0.88;
    const W = () => window.innerWidth, H = () => window.innerHeight;
    const GROUND = () => H() * 0.78;
    // the opening was 17% of the frame width and read as thin; this gives it real presence while
    // still leaving the wordmark room above the crown
    const r0 = () => (mob ? Math.min(H() * 0.15, W() * 0.36) : Math.min(W() * 0.118, H() * 0.178));

    const g = { r: r0(), spring: GROUND() - r0() * 2.05 };
    let drawing = true;
    const apply = () => {
      const w = W(), h = H(), cx = w / 2, r = g.r, sp = g.spring, gy = sp + r * 2.05;
      const door = 'M' + (cx - r) + ' ' + gy + ' V' + sp +
                   ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + sp + ' V' + gy + ' Z';
      wall.style.clipPath = 'path(evenodd, "M0 0H' + w + 'V' + h + 'H0Z ' + door + '")';
      veil.style.clipPath = 'path("' + door + '")';
      pre.style.setProperty('--pl-spring', sp + 'px');
      pre.style.setProperty('--pl-ground', gy + 'px');
      pre.style.setProperty('--pl-crown', Math.max(0, sp - r) + 'px');
      if (!drawing) return;                                 // the dive's hot frames skip the strokes
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      gl.setAttribute('x1', cx - r * 2.9); gl.setAttribute('x2', cx + r * 2.9);
      gl.setAttribute('y1', gy); gl.setAttribute('y2', gy);
      jl.setAttribute('d', 'M' + (cx - r) + ' ' + gy + ' V' + sp);
      jr.setAttribute('d', 'M' + (cx + r) + ' ' + gy + ' V' + sp);
      head.setAttribute('d', 'M' + (cx - r) + ' ' + sp + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + sp);
    };

    ERA.lockScroll(); window.scrollTo(0, 0); if (ERA.wrapper) ERA.wrapper.scrollTop = 0;
    zoom && gsap.set(zoom, { scale: heroScale, transformOrigin: 'center top' });
    // the door frames the photograph; the hero's own type waits for the dive (see css/amoha.css)
    document.documentElement.classList.add('is-door');
    apply(); pre.style.display = 'block';

    // reduced motion: show the finished composition, hold only as long as the boot takes
    if (ERA.reduced) {
      gsap.set(pre, { '--pl-veil': 0.3, '--pl-spill': 0.07 });
      gsap.set(svg, { visibility: 'visible' });
      gsap.set(pre.querySelector('.pl__place'), { visibility: 'visible' });
      gsap.set([key, rule, gl], { opacity: 1, scaleX: 1 });
      const m = ERA.milestones || {};
      Promise.race([Promise.all([m.fonts, m.hero, m.built].filter(Boolean)), new Promise((r) => setTimeout(r, 1200))])
        .then(() => { ready(); gsap.to(pre, { opacity: 0, duration: 0.2, onComplete: teardown }); });
      return;
    }

    const dash = (p) => { const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }); return L; };
    dash(jl); dash(jr); dash(head);
    gsap.set(svg, { visibility: 'visible' });   // css hides it until here, so first paint never shows a drawn arch
    const plate = pre.querySelector('.pl__place');
    gsap.set([gl, key], { opacity: 0 });
    gsap.set(plate, { autoAlpha: 0, y: 10 });   // a plain fade: animA flies in every character,
    gsap.set(rule, { scaleX: 0, transformOrigin: 'center' });   // ~2s for a line this long
    gsap.set(pre, { '--pl-veil': 0.88, '--pl-spill': 0, '--pl-spill-w': 1 });
    ERA.animH(pre.querySelectorAll('[data-part="h"]'), 'initial');

    let t;   // no resize handling existed on the old preloader; a rotate left the arch stranded
    addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => { if (drawing) { g.r = r0(); g.spring = GROUND() - g.r * 2.05; } apply(); }, 120);
    });

    const m = ERA.milestones || {};
    const after = (p, ms) => Promise.all([p || Promise.resolve(), new Promise((r) => setTimeout(r, ms))]);
    const tw = (o) => new Promise((res) => gsap.to(pre, Object.assign({ onComplete: res }, o)));

    // 1. the jambs rise off the ground line and the wordmark sets: light under the door
    after(m.fonts, 180).then(() => {
      gsap.to(gl, { opacity: 1, duration: D.m, ease: 'eraOut' });
      gsap.to([jl, jr], { strokeDashoffset: 0, duration: 0.52, ease: 'eraOut', stagger: 0.06 });
      ERA.animH(pre.querySelectorAll('[data-part="h"]'), 'reveal');
      gsap.to(pre, { '--pl-veil': 0.62, '--pl-spill': 0.03, duration: 0.9, ease: 'eraOut' });
      // 2. the head sweeps over the crown as the hero finishes decoding: the arch closing and the
      //    view arriving are the same event
      return after(m.hero, 620);
    }).then(() => {
      gsap.to(head, { strokeDashoffset: 0, duration: 0.72, ease: 'eraInOut' });
      gsap.to(pre, { '--pl-veil': 0.3, '--pl-spill': 0.07, '--pl-spill-w': 1.3, duration: 0.8, ease: 'eraOut', delay: 0.28 });
      // the plate settles with the light, so it has read by the time the door opens
      gsap.to(rule, { scaleX: 1, duration: D.m, ease: 'eraOut', delay: 0.2 });
      gsap.to(plate, { autoAlpha: 1, y: 0, duration: D.m, ease: 'eraOut', delay: 0.34 });
      // build the page now, behind the opening: `built` cannot resolve until this has run, so
      // waiting on it first would deadlock the door shut until the safety net fired
      ready();
      return after(m.built, 760);
    }).then(() => {
      // 3. the mark lands on the crown: you may enter
      gsap.fromTo(key, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: D.m, ease: 'eraOut' });
      return tw({ duration: 0.86 });   // let the finished composition stand before it opens
    }).then(() => {
      // 4. the opening dives past the viewport with the springing line pinned, so the door grows
      //    rather than the panel sliding away
      const cover = Math.hypot(W() / 2, Math.max(g.spring, H() - g.spring)) * 1.25;
      // Hold the hero's type back until the opening is genuinely wide. Releasing it at the start of
      // the dive meant the wordmark, sub, buttons and proof row all faded up inside a narrow arch —
      // the page's own text crammed through a letterbox for the best part of a second.
      let opened = false;
      const release = () => { if (opened) return; opened = true; document.documentElement.classList.remove('is-door'); };
      gsap.to([svg, key, pre.querySelector('[data-pl-set]')], { opacity: 0, duration: 0.55, ease: 'eraOut' });
      gsap.to(pre, { '--pl-veil': 0, duration: 0.5, ease: 'eraOut' });
      gsap.delayedCall(0.3, () => { drawing = false; });
      zoom && gsap.fromTo(zoom, { scale: heroScale }, { scale: 1, duration: 1.6, ease: 'eraInOut' });
      gsap.delayedCall(0.31, ready);
      gsap.to(g, { r: cover, duration: 1.55, ease: 'eraDive', onComplete: teardown,
        // tie the release to the door's real width, not to a guessed delay: eraDive is slow off the
        // mark, so a fixed timeout would fire while the opening was still narrow
        onUpdate: () => { apply(); if (g.r > W() * 0.42) release(); } });
    });
  };

  /* ---------- cookie card ---------- */
  ERA.initCookies = function () {
    const box = document.querySelector('[data-cookies]'); if (!box) return;
    let saved = null; try { saved = localStorage.getItem('era-cookies'); } catch (e) {}
    if (saved) { box.remove(); return; }
    const close = (v) => { try { localStorage.setItem('era-cookies', v); } catch (e) {} gsap.to(box, { yPercent: 100, duration: D.m, ease: 'eraIn', onComplete: () => box.remove() }); };
    gsap.fromTo(box, { yPercent: 100 }, { yPercent: 0, duration: D.m, delay: ERA.reduced ? 0 : 4.5, ease: 'eraOut' });
    box.querySelector('[data-cookies="accept"]').addEventListener('click', (e) => { e.preventDefault(); close('accepted'); });
    box.querySelector('[data-cookies="decline"]').addEventListener('click', (e) => { e.preventDefault(); close('declined'); });
  };
})(window.ERA);
