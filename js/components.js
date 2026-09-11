/* =========================================================
   ERA RESIDENCE — interactive components
   hero day/night, pins + floating tips, sliders, amenity tabs,
   accordion, magnetic circle buttons, hover systems, modals,
   form, fit-text and small utilities. Original implementation.
   ========================================================= */
(function (ERA) {
  'use strict';
  const D = ERA.D, arr = ERA.arr;

  /* ---------- hero: day / night ---------- */
  ERA.initHeroTabs = function () {
    const root = document.querySelector('[data-hero-tabs]'); if (!root) return;
    const triggers = arr(root.querySelectorAll('[data-tab-trigger]'));
    const divider = root.querySelector('[data-tabs-divider]');
    let current = 0, busy = false;
    const content = (t) => root.querySelector('[data-tab-content="' + t.dataset.tabTrigger + '"]');
    triggers.forEach((t, i) => t.addEventListener('click', (e) => {
      e.preventDefault();
      if (i === current || busy) return;
      const prev = content(triggers[current]), next = content(t);
      busy = true;
      gsap.timeline({ onComplete: () => { busy = false; } })
        .set(next, { display: 'block', zIndex: 1 }).set(prev, { zIndex: 0 })
        .fromTo(next.querySelector('.img-w'), { opacity: 0 }, { opacity: 1, duration: D.m, ease: 'eraInOut' })
        .set(prev, { display: 'none' });
      triggers[current].classList.remove('is-active'); t.classList.add('is-active'); current = i;
      if (divider) divider.classList.toggle('is-night', t.dataset.tabTrigger === 'night');
    }));
  };

  /* ---------- hotspot pins: breathing rings ---------- */
  ERA.initPins = function () {
    arr('[data-pin]').forEach((pin) => {
      const pulses = pin.querySelectorAll('[data-pin-pulse]'), w = pin.offsetWidth;
      if (!pulses.length || ERA.reduced) return;
      gsap.fromTo(pulses, { opacity: 1, width: w, height: w }, { opacity: 0, width: 1.6 * w, height: 1.6 * w, duration: D.l, ease: 'eraIn', stagger: 0.2, repeat: -1 });
    });
  };

  /* ---------- floating tip cards that follow the pointer ---------- */
  ERA.initTips = function () {
    if (ERA.isMobile()) return;
    const tips = new Map(); arr('[data-tip]').forEach((t) => tips.set(t.dataset.tip, t));
    const active = new Set();
    const place = (tip, x, y) => {
      const r = tip.firstElementChild.getBoundingClientRect();
      tip.classList.toggle('is-left', x + r.width + 40 > window.innerWidth);
      tip.classList.toggle('is-top', y + r.height / 2 > window.innerHeight);
    };
    document.addEventListener('mousemove', (e) => active.forEach((tip) => { place(tip, e.clientX, e.clientY); gsap.to(tip, { x: e.clientX, y: e.clientY, duration: 2 * D.l, ease: 'power3' }); }));
    arr('[data-tip-trigger]').forEach((trig) => {
      const tip = tips.get(trig.dataset.tipTrigger); if (!tip) return;
      trig.addEventListener('mouseenter', (e) => { gsap.set(tip, { x: e.clientX, y: e.clientY }); place(tip, e.clientX, e.clientY); tip.classList.add('is-active'); active.add(tip); });
      trig.addEventListener('mouseleave', () => { tip.classList.remove('is-active', 'is-left', 'is-top'); active.delete(tip); });
    });
  };

  /* ---------- generic slider (benefits, apartment types, gallery) ---------- */
  function partsOf(slide) {
    return { h: slide.querySelectorAll('[data-s="h"]'), p: slide.querySelectorAll('[data-s="p"]'), ctn: slide.querySelectorAll('[data-s="ctn"]'), img: slide.querySelectorAll('[data-s="img"]') };
  }
  ERA.initSliders = function () {
    arr('[data-slider]:not([data-slider="slide"])').forEach((root) => {
      if (root.getAttribute('data-slider') !== '') return;
      const slides = arr(root.querySelectorAll('[data-slider="slide"]'));
      const $ = (k) => root.querySelector('[data-slider="' + k + '"]');
      const pag = $('pag'), prev = $('prev'), next = $('next'), cur = $('current'), nextNum = $('next-num'), progress = $('progress');
      const auto = parseFloat(root.dataset.auto) || 0;
      let i = 0, busy = false, timer = null;
      if (slides.length < 2) { pag && (pag.style.display = 'none'); return; }
      gsap.set(slides, { display: 'none', position: 'absolute' });
      gsap.set(slides[0], { display: 'block', position: 'relative' });
      const counters = () => { cur && (cur.textContent = i + 1); nextNum && (nextNum.textContent = i === slides.length - 1 ? 1 : i + 2); };
      const go = (to) => {
        if (busy || to === i) return;
        busy = true;
        const from = slides[i], dest = slides[to], a = partsOf(from), b = partsOf(dest);
        from.style.zIndex = 0; dest.style.zIndex = 1;
        gsap.timeline({ onComplete: () => { from.style.zIndex = ''; busy = false; } })
          .set(dest, { display: 'block', position: 'relative' }).set(from, { display: 'block', position: 'absolute' })
          .add(() => { dest.querySelectorAll('[data-fit-text]').forEach(ERA.fitText); ERA.animH(b.h, 'initial'); ERA.animP(b.p, 'initial'); ERA.animCtn(b.ctn, 'initial'); ERA.animSlide(b.img, 'initial'); ScrollTrigger.refresh(); })
          .add(() => { ERA.animH(a.h, 'hide', 0); ERA.animP(a.p, 'hide', 0); ERA.animCtn(a.ctn, 'hide', 0); ERA.animSlide(a.img, 'hide', 0); ERA.animSlide(b.img, 'reveal', 0); })
          .to({}, { duration: D.m })
          .add(() => { ERA.animH(b.h, 'reveal', 0); ERA.animP(b.p, 'reveal', 0); ERA.animCtn(b.ctn, 'reveal', D.s); })
          .to({}, { duration: D.s })
          .set(from, { display: 'none' });
        i = to; counters();
      };
      const bar = () => progress && gsap.fromTo(progress, { width: '0%' }, { width: '100%', duration: auto, ease: 'none' });
      const stop = () => { clearInterval(timer); timer = null; if (progress) { gsap.killTweensOf(progress); gsap.set(progress, { width: '0%' }); } };
      const start = () => { if (!auto || ERA.reduced) return; stop(); bar(); timer = setInterval(() => { go(i === slides.length - 1 ? 0 : i + 1); bar(); }, auto * 1000); };
      counters();
      new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.2 }).observe(root);
      document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
      prev && prev.addEventListener('click', () => { go(i === 0 ? slides.length - 1 : i - 1); start(); });
      next && next.addEventListener('click', () => { go(i === slides.length - 1 ? 0 : i + 1); start(); });
    });
  };

  /* ---------- the living landing: the photograph, but with the weather in it ----------
     The still is the base layer and stays the hero: it is what paints first, what a slow link
     keeps, and what anyone with reduced motion sees. The clip is loaded only after the page is
     built, and only fades in once it can actually play, so it can never delay or replace the
     picture — it just brings the clouds, the foliage and the light to life behind the wordmark.
     Only the panel on screen is fetched; the other is fetched the first time you ask for it. */
  /* The phone nav sits on a flat bar rather than a blur, and the bar has to stay out of the way
     of the first screen — the hero is a photograph with the spray hanging into it, and a band
     across the top of that would be the first thing anyone saw. It arrives once the hero is
     mostly past. Desktop ignores this entirely; the bar only exists below 992px. */
  ERA.initNavBar = function () {
    const nav = document.querySelector('.ui-nav'); if (!nav) return;
    const set = () => {
      const y = ERA.lenis ? ERA.lenis.scroll : window.scrollY;
      nav.classList.toggle('is-solid', y > window.innerHeight * 0.55);
    };
    set();
    if (ERA.lenis) ERA.lenis.on('scroll', set);
    else window.addEventListener('scroll', set, { passive: true });
  };

  ERA.initHeroVideo = function () {
    const vids = arr('[data-hero-video]'); if (!vids.length) return;
    if (ERA.reduced) return;                                  // the still is the whole hero here
    if (ERA.lite) return;                                     // lite: the still is the whole hero
    const c = navigator.connection;
    if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return;   // metered or slow: leave the still

    const load = (v) => {
      if (!v || v.dataset.heroLoaded) return;
      v.dataset.heroLoaded = '1';
      v.src = v.dataset.heroVideo;
      // only the frame on screen plays; the warmed one is decoded and held, not run
      v.addEventListener('canplay', () => { v.classList.add('is-ready'); if (visible(v)) v.play().catch(() => {}); }, { once: true });
      v.addEventListener('error', () => { v.remove(); }, { once: true });    // no clip served: the still stands
      v.load();
    };
    const visible = (v) => { const p = v.closest('[data-tab-content]'); return !p || getComputedStyle(p).display !== 'none'; };
    vids.filter(visible).forEach(load);

    // Fetch the other frame once the visible one is running and the page has gone quiet. Waiting
    // for the toggle meant pressing it dropped you onto a still while 3.9MB downloaded — which
    // reads as "changing to dusk stopped the video". This way the swap is immediate.
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 2500));
    const warm = () => idle(() => vids.filter((v) => !visible(v)).forEach(load));
    const first = vids.find(visible);
    if (first) first.addEventListener('canplay', () => setTimeout(warm, 1200), { once: true });
    else warm();

    // and point the control out once, quietly, so the second frame is actually discovered
    const tabs = document.querySelector('.hero__tabs');
    if (tabs && !ERA.reduced) {
      let touched = false;
      arr('[data-tab-trigger]').forEach((t) => t.addEventListener('click', () => { touched = true; tabs.classList.remove('is-hinting'); }, { once: true }));
      setTimeout(() => { if (!touched) tabs.classList.add('is-hinting'); }, 6000);
    }

    arr('[data-tab-trigger]').forEach((t) => t.addEventListener('click', () => {
      // A toggle means the reader has asked for the other view, so fetch it — load() is idempotent
      // and this avoids depending on when gsap flips the panels. Pause after the cross-fade has
      // finished, though: ERA.initHeroTabs only hides the outgoing panel at the end of it, so an
      // earlier check finds both visible and pauses neither.
      vids.forEach(load);
      // The warmed clip's canplay already fired while it was hidden, so nothing would ever start
      // it. Play whatever the swap has just put on screen, then pause the outgoing one once the
      // cross-fade has finished (checking earlier finds both visible and pauses neither).
      gsap.delayedCall(0.08, () => vids.forEach((v) => { if (visible(v) && v.dataset.heroLoaded) v.play().catch(() => {}); }));
      gsap.delayedCall(D.m + 0.2, () => {
        vids.filter((v) => !visible(v)).forEach((v) => v.pause());   // no decoding behind a hidden panel
      });
    }));

    // Nothing tied the clip to the viewport, so a 1080p loop kept decoding the whole time the
    // reader was further down the page. Park it when the hero leaves, resume when it returns —
    // and let tab visibility respect that, rather than restarting a clip nobody can see.
    let onScreen = true;
    const sync = () => vids.forEach((v) => {
      if (!v.dataset.heroLoaded) return;
      if (document.hidden || !onScreen || !visible(v)) v.pause(); else v.play().catch(() => {});
    });
    const hero = vids[0].closest('[data-hero]') || vids[0].closest('section');
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver((es) => { onScreen = es[es.length - 1].isIntersecting; sync(); }, { rootMargin: '10%' }).observe(hero);
    }
    document.addEventListener('visibilitychange', sync);
  };

  /* ---------- amenity tabs with sliding hairline highlight ---------- */
  ERA.initTabs = function () {
    arr('[data-tabs]').forEach((root) => {
      const triggers = arr(root.querySelectorAll('[data-tab-trigger]'));
      const contents = arr(root.querySelectorAll('[data-tab-content]'));
      const hilight = root.querySelector('[data-tab-hilight]');
      const vertical = root.dataset.tabsHilight !== 'hor';
      let i = 0, busy = false;
      const content = (t) => root.querySelector('[data-tab-content="' + t.dataset.tabTrigger + '"]');
      const parts = (c) => ({ h: c.querySelectorAll('[data-t="h"]'), p: c.querySelectorAll('[data-t="p"]'), ctn: c.querySelectorAll('[data-t="ctn"]'), slide: c.querySelectorAll('[data-t="slide"]') });
      gsap.set(contents, { display: 'none', position: 'absolute' }); gsap.set(contents[0], { display: 'block', position: 'relative' });
      const moveHilight = () => { const t = root.querySelector('[data-tab].is-active'); if (!t || !hilight) return;
        gsap.to(hilight, Object.assign(vertical ? { y: t.offsetTop, height: t.offsetHeight } : { x: t.offsetLeft, width: t.offsetWidth }, { duration: D.m, ease: 'eraInOut' })); };
      setTimeout(moveHilight, 60);
      triggers.forEach((t, n) => t.addEventListener('click', () => {
        if (n === i || busy) return;
        busy = true;
        const from = content(triggers[i]), dest = content(t), a = parts(from), b = parts(dest);
        gsap.timeline({ onComplete: () => { busy = false; } })
          .set(dest, { display: 'block', position: 'relative', zIndex: 1 }).set(from, { display: 'block', position: 'absolute', zIndex: 0 })
          .add(() => { ERA.animH(b.h, 'initial'); ERA.animP(b.p, 'initial'); ERA.animCtn(b.ctn, 'initial'); ERA.animSlide(b.slide, 'initial'); ScrollTrigger.refresh(); })
          .add(() => { ERA.animH(a.h, 'hide', 0); ERA.animP(a.p, 'hide', 0); ERA.animCtn(a.ctn, 'hide', 0); ERA.animSlide(a.slide, 'hide', 0); ERA.animSlide(b.slide, 'reveal', 0); })
          .to({}, { duration: D.m })
          .add(() => { ERA.animH(b.h, 'reveal', 0); ERA.animP(b.p, 'reveal', 0); ERA.animCtn(b.ctn, 'reveal', D.s); })
          .to({}, { duration: D.s })
          .set(from, { display: 'none' });
        triggers[i].classList.remove('is-active'); t.classList.add('is-active'); i = n; moveHilight();
      }));
    });
  };

  /* ---------- accordion (facts) ---------- */
  ERA.initAccordions = function () {
    const cards = arr('.other-card');
    let open = null;
    arr('[data-accordion]:not([data-accordion="content"]):not([data-accordion="p"]):not([data-accordion="ctn"])').forEach((card) => {
      const content = card.querySelector('[data-accordion="content"]'), ico = card.querySelector('[data-ico-plus]');
      const p = card.querySelectorAll('[data-accordion="p"]'), ctn = card.querySelectorAll('[data-accordion="ctn"]');
      if (!content) return;
      gsap.set(content, { height: 0, overflow: 'hidden' });
      ERA.animP(p, 'initial'); ERA.animCtn(ctn, 'initial');
      const show = () => { card.classList.add('is-active'); gsap.to(content, { height: 'auto', duration: D.l, ease: 'eraOut', onComplete: () => ScrollTrigger.refresh() }); ico && gsap.fromTo(ico, { rotate: 0 }, { rotate: -45, duration: D.m, ease: 'eraInOut', overwrite: true }); ERA.animP(p, 'reveal'); ERA.animCtn(ctn, 'reveal'); };
      const hide = () => { card.classList.remove('is-active'); gsap.to(content, { height: 0, duration: D.l, ease: 'eraOut', overwrite: true, onComplete: () => ScrollTrigger.refresh() }); ico && gsap.to(ico, { rotate: -90, duration: D.m, ease: 'eraInOut', overwrite: true }); ERA.animP(p, 'hide', 0); ERA.animCtn(ctn, 'hide', 0); };
      card._close = hide;
      card.querySelector('.other-card__name').addEventListener('click', () => {
        if (open && open !== card) open._close();
        if (open !== card) { show(); open = card; if (ERA.showLayer) ERA.showLayer(cards.indexOf(card)); } else { hide(); open = null; }
      });
    });
    // open the first row, so the section reads as content rather than as four labels
    const first = document.querySelector('.other-card [data-accordion="content"]') && document.querySelector('.other-card');
    if (first) first.querySelector('.other-card__name').click();
  };

  /* ---------- layered clip-path transition between the facts rows ----------
     Adapted from "Layers Animation with Clip-path" (assets/library/components/awwwards-300/
     Page Transitions/3): a stack of images, each wiped in from the bottom edge on a stagger,
     the one before it dropped as soon as the next has covered it. Here it is driven by which
     fact row is open rather than by a click anywhere on the page. */
  ERA.initLayers = function () {
    const stack = document.querySelector('[data-layers]'); if (!stack) return;
    const layers = arr(stack.querySelectorAll('.other__layer'));
    const inners = layers.map((l) => l.querySelector('.other__layer-img'));
    if (!layers.length) return;
    const HIDDEN = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';
    const SHOWN = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
    let current = -1, tl = null;

    const settle = (n) => layers.forEach((l, i) => gsap.set(l, { opacity: i === n ? 1 : 0, clipPath: i === n ? SHOWN : HIDDEN }));
    settle(0); current = 0;

    ERA.showLayer = (n) => {
      if (n === current || n < 0 || n >= layers.length) return;
      if (tl) tl.kill();
      const forward = n > current;
      const seq = [];                                    // the layers the wipe passes through
      for (let i = current + (forward ? 1 : -1); forward ? i <= n : i >= n; forward ? i++ : i--) seq.push(i);
      if (!seq.length) return;
      const inner = seq.map((i) => inners[i]);
      if (ERA.reduced) { settle(n); current = n; return; }
      tl = gsap.timeline({ defaults: { duration: 0.9, ease: 'power3.inOut' }, onComplete: () => { settle(n); } })
        .set(seq.map((i) => layers[i]), { opacity: 1 })
        .fromTo(seq.map((i) => layers[i]), { clipPath: HIDDEN }, { clipPath: SHOWN, stagger: 0.12 }, 0)
        .fromTo(inner, { filter: 'brightness(45%)', scale: 1.06 }, { filter: 'brightness(100%)', scale: 1, stagger: 0.12 }, 0);
      current = n;
    };
  };

  /* ---------- magnetic pull on circle buttons ---------- */
  ERA.initMagnetic = function () {
    if (ERA.isMobile() || ERA.reduced) return;
    arr('[data-magnetic]').forEach((el) => {
      const inner = arr(el.querySelectorAll('[data-magnetic-inner]'));
      const reset = (t, hard) => { gsap.killTweensOf(t); (hard ? gsap.set : gsap.to)(t, Object.assign({ x: 0, y: 0, force3D: true, clearProps: 'all' }, hard ? {} : { ease: 'elastic.out(1, 0.3)', duration: 1.6 })); };
      el.addEventListener('mouseenter', () => { reset(el, true); inner.forEach((n) => reset(n, true)); });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect(), s = parseFloat(el.dataset.magnetic) || 25, si = parseFloat(el.dataset.magneticInner) || s;
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { x: px * (s / 16) + 'em', y: py * (s / 16) + 'em', force3D: true, ease: 'power4.out', duration: 1.6 });
        inner.forEach((n) => gsap.to(n, { x: px * (si / 16) + 'em', y: py * (si / 16) + 'em', force3D: true, ease: 'power4.out', duration: 2 }));
      });
      el.addEventListener('mouseleave', () => { reset(el, false); inner.forEach((n) => reset(n, false)); });
    });
  };

  /* ---------- circle buttons: two short arcs grow into a full ring ---------- */
  ERA.initCircleButtons = function () {
    arr('[data-circle-btn]').forEach((btn) => {
      const arcs = btn.querySelectorAll('[data-arc]'); if (!arcs.length) return;
      const C = 2 * Math.PI * 103.5, a = 0.0417 * C;
      gsap.set(arcs, { strokeDasharray: a + ' ' + C });
      const tl = gsap.timeline({ paused: true }).to(arcs, { strokeDasharray: (C / 2) + ' ' + C, duration: D.m, ease: 'eraInOut' });
      btn.addEventListener('mouseenter', () => tl.play()); btn.addEventListener('mouseleave', () => tl.reverse());
    });
  };

  /* ---------- display links: characters flip out, twin flips in, underline wipes ---------- */
  ERA.initLinkHover = function () {
    if (ERA.isMobile()) return;
    arr('[data-hover="link"]').forEach((link) => {
      const texts = link.querySelectorAll('.link_label_text'); if (texts.length < 2) return;
      const a = new SplitText(texts[0], { type: 'lines,words,chars', tag: 'span', linesClass: 'split-line', wordsClass: 'split-word', charsClass: 'split-char', smartWrap: true });
      const b = new SplitText(texts[1], { type: 'words,chars', tag: 'span', wordsClass: 'split-word', charsClass: 'split-char', smartWrap: true });
      const lines = a.lines.map((l) => { const s = document.createElement('span'); s.className = 'link_line'; l.appendChild(s); return s; });
      gsap.set(lines, { scaleX: 1, transformOrigin: 'right center' });
      gsap.set(texts[1], { opacity: 1 });          // see the note in initNavHover
      gsap.set(b.chars, { opacity: 0, x: '-0.4em', yPercent: 25, rotateY: 90 });
      const enter = () => {
        gsap.fromTo(a.chars, { opacity: 1, x: '0em', yPercent: 0, rotateY: 0 }, { opacity: 0, x: '0.4em', yPercent: -25, rotateY: -90, duration: D.m, ease: 'eraOut', stagger: D.stagger / 4, overwrite: true, force3D: true });
        gsap.fromTo(b.chars, { opacity: 0, x: '-0.4em', yPercent: 25, rotateY: 90 }, { opacity: 1, x: '0em', yPercent: 0, rotateY: 0, duration: D.m, ease: 'eraOut', delay: 0.2, stagger: D.stagger / 4, overwrite: true, force3D: true });
        gsap.fromTo(lines, { scaleX: 1, transformOrigin: 'right center' }, { scaleX: 0, duration: D.m, ease: 'eraOut', stagger: D.stagger, overwrite: true });
      };
      const leave = () => {
        gsap.to(a.chars, { opacity: 1, x: '0em', yPercent: 0, rotateY: 0, duration: D.m, ease: 'eraOut', delay: 0.2, stagger: D.stagger / 4, overwrite: true, force3D: true });
        gsap.to(b.chars, { opacity: 0, x: '-0.4em', yPercent: 25, rotateY: 90, duration: D.m, ease: 'eraOut', stagger: D.stagger / 4, overwrite: true, force3D: true });
        gsap.to(lines, { scaleX: 1, transformOrigin: 'left center', duration: D.m, ease: 'eraOut', stagger: D.stagger, overwrite: true });
      };
      link.addEventListener('mouseenter', enter); link.addEventListener('mouseleave', leave);
    });
  };

  /* ---------- nav items: letters roll up, twin rolls in, staggered left to right ---------- */
  ERA.initNavHover = function () {
    if (ERA.isMobile()) return;
    const byX = (total) => (i, target, list) => { const xs = list.map((t) => t.getBoundingClientRect().left); const min = Math.min(...xs), span = Math.max(...xs) - min || 1; return (xs[i] - min) / span * total; };
    arr('[data-hover="nav"]').forEach((item) => {
      const texts = item.querySelectorAll('.nav-item_label_text'); if (texts.length < 2) return;
      const a = new SplitText(texts[0], { type: 'words,chars', tag: 'span', wordsClass: 'split-word', charsClass: 'split-char', smartWrap: true, mask: 'words' });
      const b = new SplitText(texts[1], { type: 'words,chars', tag: 'span', wordsClass: 'split-word', charsClass: 'split-char', smartWrap: true, mask: 'words' });
      // css/amoha.css hides .is-2 outright, because this whole function returns early below 992
      // and the twin was painting on top of the first copy. Reveal the container we now drive.
      gsap.set(texts[1], { opacity: 1 });
      gsap.set(b.chars, { yPercent: 100, opacity: 0 });
      item.addEventListener('mouseenter', () => {
        gsap.fromTo(a.chars, { opacity: 1, yPercent: 0 }, { opacity: 0, yPercent: -100, duration: D.m, ease: 'eraEase', stagger: byX(2 * D.stagger), overwrite: true, force3D: true });
        gsap.fromTo(b.chars, { yPercent: 100, opacity: 0 }, { opacity: 1, yPercent: 0, duration: D.m, ease: 'eraEase', stagger: byX(2 * D.stagger), overwrite: true, force3D: true });
      });
      item.addEventListener('mouseleave', () => {
        gsap.to(a.chars, { opacity: 1, yPercent: 0, duration: D.m, ease: 'eraEase', stagger: byX(2 * D.stagger), overwrite: true, force3D: true });
        gsap.to(b.chars, { opacity: 0, yPercent: 100, duration: D.m, ease: 'eraEase', stagger: byX(2 * D.stagger), overwrite: true, force3D: true });
      });
    });
  };

  /* ---------- modals: book a call (card tumbles in) and mobile menu ---------- */
  ERA.initModals = function () {
    const uis = arr('[data-theme]');
    const modals = {};
    arr('[data-modal]').forEach((m) => { modals[m.dataset.modal] = m; gsap.set(m, { display: 'none' }); });
    const state = {};
    const open = (name) => {
      const m = modals[name]; if (!m || state[name]) return; state[name] = true;
      const box = m.querySelector('[data-modal-box]'), over = m.querySelector('[data-modal-over]');
      gsap.set([m, over], { display: 'block' });
      gsap.fromTo(over, { opacity: 0 }, { opacity: 1, duration: D.l, ease: 'eraOut', overwrite: true });
      if (name === 'menu') {
        uis.forEach((u) => { if (!u.classList.contains('t-dark')) { u.classList.add('t-dark'); u.dataset.modalThemed = '1'; } });
        document.querySelectorAll('.btn-menu_label').forEach((l) => l.classList.toggle('is-active'));
        const q = (s) => m.querySelectorAll(s);
        ERA.animA(q('[data-part="a"]'), 'initial'); ERA.animH(q('[data-part="h"]'), 'initial'); ERA.animP(q('[data-part="p"]'), 'initial'); ERA.animCtn(q('[data-part="ctn"]'), 'initial');
        ERA.animA(q('[data-part="a"]'), 'reveal'); ERA.animH(q('[data-part="h"]'), 'reveal'); ERA.animP(q('[data-part="p"]'), 'reveal'); ERA.animCtn(q('[data-part="ctn"]'), 'reveal');
      } else {
        gsap.set(box, { transformPerspective: 1000 });
        gsap.fromTo(box, { scale: 0, rotateX: -90, yPercent: -100, rotate: -25 }, { scale: 1, rotateX: 0, yPercent: 0, rotate: 0, duration: D.l, ease: 'eraOut', overwrite: true });
        const q = (s) => m.querySelectorAll(s);
        ERA.animA(q('[data-part="a"]'), 'initial'); ERA.animH(q('[data-part="h"]'), 'initial'); ERA.animP(q('[data-part="p"]'), 'initial');
        ERA.animA(q('[data-part="a"]'), 'reveal', D.m); ERA.animH(q('[data-part="h"]'), 'reveal', D.m); ERA.animP(q('[data-part="p"]'), 'reveal', D.m);
        const first = m.querySelector('input'); first && setTimeout(() => first.focus({ preventScroll: true }), 900);
      }
      ERA.lockScroll();
    };
    const close = (name) => {
      const m = modals[name]; if (!m || !state[name]) return; state[name] = false;
      const box = m.querySelector('[data-modal-box]'), over = m.querySelector('[data-modal-over]');
      gsap.to(over, { opacity: 0, duration: D.m, ease: 'eraIn', overwrite: true });
      if (name === 'menu') {
        uis.forEach((u) => { if (u.dataset.modalThemed) { u.classList.remove('t-dark'); delete u.dataset.modalThemed; } });
        document.querySelectorAll('.btn-menu_label').forEach((l) => l.classList.toggle('is-active'));
        const q = (s) => m.querySelectorAll(s);
        ERA.animA(q('[data-part="a"]'), 'hide'); ERA.animH(q('[data-part="h"]'), 'hide'); ERA.animP(q('[data-part="p"]'), 'hide'); ERA.animCtn(q('[data-part="ctn"]'), 'hide');
        gsap.delayedCall(D.m, () => gsap.set([m, over], { display: 'none' }));
      } else {
        gsap.to(box, { scale: 1, rotateX: 90, yPercent: 200, rotate: 25, duration: D.m, ease: 'eraIn', overwrite: true, onComplete: () => gsap.set([m, over], { display: 'none' }) });
      }
      // Only give scrolling back once nothing is open. "Enquire now" inside the menu carries both
      // data-modal-open="cta" and data-modal-close="menu"; the open ran first and locked, then this
      // unconditional unlock handed the page straight back — the sheet sat over a page that scrolled
      // 1,599px behind it. The guard also covers any future modal-to-modal hop.
      if (!Object.keys(state).some((k) => state[k])) ERA.unlockScroll();
    };
    ERA.openModal = open; ERA.closeModal = close;
    arr('[data-modal-open]').forEach((btn) => btn.addEventListener('click', (e) => { e.preventDefault(); const name = btn.dataset.modalOpen; if (name === 'menu' && state.menu) { close('menu'); return; } open(name); }));
    arr('[data-modal-close]').forEach((btn) => btn.addEventListener('click', (e) => {
      const m = btn.closest('[data-modal]'); const name = btn.dataset.modalClose || (m && m.dataset.modal);
      if (name && state[name]) { e.preventDefault(); close(name); }
    }));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') Object.keys(state).forEach((n) => state[n] && close(n)); });
  };

  /* ---------- enquiry form (front-end only) ---------- */
  ERA.initForm = function () {
    arr('[data-form]').forEach((form) => form.addEventListener('submit', (e) => {
      e.preventDefault();
      const required = form.querySelectorAll('[required]'); let ok = true;
      required.forEach((f) => { const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value)); f.style.borderBottomColor = bad ? 'var(--c-error)' : ''; if (bad) ok = false; });
      if (!ok) return;
      const success = form.parentElement.querySelector('[data-form-success]');
      if (success) { success.classList.add('is-on'); gsap.fromTo(success, { opacity: 0 }, { opacity: 1, duration: D.m, ease: 'eraOut' }); }
    }));
  };

  /* ---------- fit a single line of display type to its container ---------- */
  // shrink-only by default; data-fit-text="grow" also enlarges to fill the container
  ERA.fitText = function (el) {
    if (!el.offsetParent) return;                       // hidden (e.g. inactive slide): measured when shown
    const grow = el.dataset.fitText === 'grow';
    el.style.fontSize = ''; el.style.whiteSpace = 'nowrap';
    /* Converge rather than scale once: where the parent is a shrink-to-fit box (a centred
       flex column), its width depends on this very line, so one pass measures against a
       box that then moves. Two or three passes settle it. */
    for (let pass = 0; pass < 4; pass++) {
      el.style.width = 'max-content';
      const target = el.parentElement.clientWidth, w = el.offsetWidth, fs = parseFloat(getComputedStyle(el).fontSize);
      el.style.width = '';
      if (!w || !target) return;
      const ratio = target / w;
      if (ratio >= 1 && !grow) return;              // it already fits, and we never enlarge unless asked
      if (Math.abs(ratio - 1) < 0.004) return;      // settled
      el.style.fontSize = (fs * ratio) + 'px';
    }
  };
  ERA.initFitText = function () {
    const all = () => arr('[data-fit-text]').forEach(ERA.fitText);
    all(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);   // re-measure once the display face is in
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { runs = new WeakMap(); all(); ScrollTrigger.refresh(); }, 80); });   // a real resize earns a fresh budget

    /* a box can change width without the window doing so: a slide is shown, a pin lays out,
       a section gains padding. Re-fit on the box, not just on the window, or the line stays
       at the size it had when it was last measured and overruns its container. */
    if (!window.ResizeObserver) return;
    /* Fitting writes font-size, which resizes the very box being observed. A last-width check
       cannot break that loop: where the parent is shrink-to-fit its width ping-pongs between
       two values, each of which looks "new" against the one stored, so the observer re-enters
       forever and starves the main thread (the page froze at some window widths and not
       others). Suppress the echo of our own writes instead, and give up on a box that will
       not settle rather than ping-pong at frame rate. */
    let seen = new WeakMap(), runs = new WeakMap(), busy = false;
    const ro = new ResizeObserver((entries) => {
      if (busy) return;
      let did = false;
      entries.forEach((e) => {
        const w = Math.round(e.contentRect.width);
        if (!w || seen.get(e.target) === w) return;
        const n = (runs.get(e.target) || 0) + 1;
        if (n > 8) return;                                           // oscillating: leave it at the size it has
        seen.set(e.target, w); runs.set(e.target, n); did = true;
        arr(e.target.querySelectorAll('[data-fit-text]')).forEach(ERA.fitText);
      });
      if (!did) return;
      busy = true;
      requestAnimationFrame(() => requestAnimationFrame(() => { busy = false; }));   // after layout has flushed
    });
    arr('[data-fit-text]').forEach((el) => { if (el.parentElement) ro.observe(el.parentElement); });
  };

  /* ---------- clouds: rasterize the filtered SVG once so the marquee costs nothing to scroll ---------- */
  ERA.initClouds = function () {
    const filter = document.getElementById('cloudf'); if (!filter) return;
    const cache = {};
    arr('svg.cloud').forEach((svg) => {
      const use = svg.querySelector('use'); const id = use ? (use.getAttribute('href') || '').slice(1) : ''; const sym = id && document.getElementById(id); if (!sym) return;
      const vb = sym.getAttribute('viewBox'), dims = vb.split(/\s+/).map(Number), vw = dims[2], vh = dims[3];
      const img = document.createElement('img'); img.className = 'cloud'; img.alt = ''; img.width = vw; img.height = vh; img.decoding = 'async';
      svg.replaceWith(img);
      if (!cache[id]) cache[id] = new Promise((resolve) => {
        const xml = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" width="' + vw + '" height="' + vh + '"><defs>' + filter.outerHTML + '</defs>' + sym.innerHTML + '</svg>';
        const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
        const src = new Image();
        src.onload = () => { const c = document.createElement('canvas'); c.width = vw; c.height = vh; c.getContext('2d').drawImage(src, 0, 0); URL.revokeObjectURL(url); resolve(c.toDataURL('image/png')); };
        src.onerror = () => resolve(url);
        src.src = url;
      });
      cache[id].then((url) => { img.src = url; });
    });
  };

  /* ---------- flowers: a slow breeze on the cut-outs, pivoting from where the branch hangs ---------- */
  ERA.initFlowers = function () {
    // Lite keeps the flowers still. Measured at 4x throttle, a masked poster swaying at 60fps cost
    // a weak device more at rest than the clip it replaced (706 vs 252 ms/s of main thread): the
    // sway repaints its masked layer every frame, a clip composites at its own frame rate.
    if (ERA.reduced || ERA.windActive || ERA.lite) return;   // the WebGL wind owns the motion when available
    // Every flower on these pages is a clip, and a playing clip IS the motion: its poster sits at
    // opacity 0 underneath. The sway used to run on all of them regardless — seven infinite
    // tweens writing transforms every frame, under video and thousands of pixels off-screen.
    // Now only a flower without a clip sways, and only while it is near the viewport.
    const sway = (img, i) => {
      const r = gsap.utils.random, wrap = img.closest('.flower') || img;
      gsap.set(img, { transformOrigin: '50% 0%' });
      const tw = gsap.to(img, { rotation: r(1.4, 2.6) * (i % 2 ? 1 : -1), y: r(-8, 8), scale: 1.015, duration: r(4.5, 7), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: r(0, 2.5), paused: true });
      new IntersectionObserver((es) => { if (es[es.length - 1].isIntersecting) tw.resume(); else tw.pause(); }, { rootMargin: '20%' }).observe(wrap);
    };
    arr('.flower img').forEach((img, i) => {
      const wrap = img.closest('.flower');
      if (wrap && wrap.classList.contains('is-video')) {
        // a clip that fails to load hands its flower back to a sway
        wrap.addEventListener('flower:fallback', () => { if (!ERA.stillFlowers) sway(img, i); }, { once: true });   // a clip that 404s still sways; a device the audition demoted stays still, for the same reason as lite
        return;
      }
      sway(img, i);
    });
  };

  /* ---------- small utilities ---------- */
  /* route map: swap the inline fallback stroke and text stops for the original drawings once they load */
  ERA.initRouteArt = function () {
    const svg = document.querySelector('[data-route] svg'); if (!svg || !window.fetch) return;
    const load = (src) => fetch(src).then((r) => (r.ok ? r.text() : Promise.reject(r.status))).then((txt) => new DOMParser().parseFromString(txt, 'image/svg+xml'));
    const src = svg.getAttribute('data-route-src'), lsrc = svg.getAttribute('data-route-labels-src');
    src && load(src).then((doc) => {
      const path = doc.querySelector('path'), line = svg.querySelector('[data-route-line]');
      if (!path || !line) return;
      line.setAttribute('d', path.getAttribute('d')); line.classList.add('is-art');
    }).catch(() => {});
    lsrc && load(lsrc).then((doc) => {
      const g = svg.querySelector('[data-route-labels]'); if (!g) return;
      Array.from(doc.documentElement.children).forEach((n) => g.appendChild(document.importNode(n, true)));
      svg.classList.add('has-labels');
    }).catch(() => {});
  };

  ERA.initMisc = function () {
    document.querySelectorAll('[data-year]').forEach((y) => { y.textContent = new Date().getFullYear(); });
    // keyboard access for the div-based controls (tabs, accordion headers, pagination)
    arr('[data-tab-trigger], .other-card__name, .pag_prev, .pag_next, [data-modal-open]').forEach((el) => {
      if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.querySelector('a, button')) return;
      el.setAttribute('role', 'button'); if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
    });
    // smooth in-page anchors
    arr('a[href^="#"]:not([data-modal-open]):not([data-tab-trigger]):not([data-cookies])').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); if (id.length < 2) { e.preventDefault(); return; }
      const target = document.querySelector(id); if (!target) return;
      e.preventDefault(); ERA.scrollTo(target, { duration: 2, easing: gsap.parseEase('eraInOut') });
    }));
  };
})(window.ERA);
