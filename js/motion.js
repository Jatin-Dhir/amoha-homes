/*!
 * Amoha Group website — scroll engine, loader, reveals and theme switching
 * Designed and developed by Jatin Dhir <jatindhir.dev@gmail.com>
 */
window.AMOHA = window.AMOHA || {};

(function(AMOHA) {
  'use strict';
  const D = {
    s: .4,
    m: .8,
    l: 1.2,
    stagger: .1,
    delay: .3,
    bp: 992
  };
  AMOHA.D = D;
  AMOHA.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  AMOHA.lite = (() => {
    const n = navigator, c = n.connection || {};
    return !!(c.saveData || /(^|-)2g$/.test(c.effectiveType || '') || n.deviceMemory && n.deviceMemory <= 2 || n.hardwareConcurrency && n.hardwareConcurrency <= 2 || matchMedia('(prefers-reduced-data: reduce)').matches || /[?&]lite\b/.test(location.search));
  })();
  document.documentElement.classList.toggle('is-lite', AMOHA.lite);
  AMOHA.isMobile = () => window.innerWidth < D.bp;
  AMOHA.lenis = null;
  const arr = x => gsap.utils.toArray(x).filter(Boolean);
  AMOHA.arr = arr;
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create('amohaInOut', '0.75,0,0.25,1');
  CustomEase.create('amohaOut', '0.25,1,0.5,1');
  CustomEase.create('amohaIn', '0.5,0,0.75,0');
  CustomEase.create('amohaEase', '0.25,0.1,0.25,1');
  CustomEase.create('amohaDive', '0.6,0,0,1');
  CustomEase.create('amohaHor', '0.25,0,0.75,1');
  CustomEase.create('eraLoader', 'M0,0 C0.08,0.3 0.2,0.38 0.34,0.46 0.46,0.52 0.5,0.54 0.58,0.6 0.66,0.66 0.72,0.84 0.82,0.92 0.9,0.98 1,1 1,1');
  /* ---------- smooth scroll ---------- */  AMOHA.initLenis = function() {
    if (AMOHA.reduced || matchMedia('(pointer: coarse)').matches) return null;
    const lenis = new Lenis({
      wrapper: AMOHA.wrapper || window,
      content: AMOHA.content || document.documentElement,
      duration: 1.1,
      smoothWheel: true,
      wheelMultiplier: .95,
      touchMultiplier: 1.8,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -12 * t))
    });
    if (AMOHA.wrapper) ScrollTrigger.defaults({
      scroller: AMOHA.wrapper
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1e3));
    gsap.ticker.lagSmoothing(0);
    AMOHA.lenis = lenis;
    return lenis;
  };
  AMOHA.scrollTo = function(target, opts) {
    opts = opts || {};
    if (AMOHA.lenis) return AMOHA.lenis.scrollTo(target, opts);
    const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: y,
      behavior: opts.immediate ? 'auto' : 'smooth'
    });
  };
  AMOHA.lockScroll = function() {
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', sw + 'px');
    document.body.style.paddingRight = 'var(--scrollbar-width)';
    document.documentElement.style.overflow = 'hidden';
    AMOHA.lenis && AMOHA.lenis.stop();
  };
  AMOHA.unlockScroll = function() {
    document.documentElement.style.removeProperty('--scrollbar-width');
    document.body.style.paddingRight = '';
    document.documentElement.style.overflow = '';
    AMOHA.lenis && AMOHA.lenis.start();
  };
  /* ---------- split text ---------- */  const WS = {
    reduceWhiteSpace: false,
    prepareText: t => t.replace(/[ \t\n\r\f]+/g, ' ')
  };
  const splitChars = el => el._split || (el._split = new SplitText(el, Object.assign({
    type: 'chars',
    tag: 'span',
    charsClass: 'split-char',
    smartWrap: true
  }, WS)));
  const splitWordsChars = el => el._split || (el._split = new SplitText(el, Object.assign({
    type: 'words,chars',
    tag: 'span',
    wordsClass: 'split-word',
    charsClass: 'split-char',
    smartWrap: true
  }, WS)));
  const splitLines = el => el._split || (el._split = new SplitText(el, Object.assign({
    type: 'lines,words',
    tag: 'span',
    linesClass: 'split-line',
    wordsClass: 'split-word',
    mask: 'lines'
  }, WS)));
  const show = els => gsap.set(els, {
    visibility: 'visible'
  });
  AMOHA.animA = function(els, mode, delay) {
    arr(els).forEach((el, i) => {
      if (!el.textContent.trim()) return;
      show(el);
      const chars = splitChars(el).chars, off = i * D.stagger;
      if (mode === 'reveal') gsap.fromTo(chars, {
        opacity: 0,
        rotateX: 90,
        x: '10rem',
        transformOrigin: 'center bottom'
      }, {
        opacity: 1,
        rotateX: 0,
        x: '0rem',
        duration: D.l,
        delay: (delay ?? D.delay) + off,
        stagger: {
          each: D.stagger,
          amount: .6
        },
        ease: 'amohaOut',
        overwrite: true
      }); else if (mode === 'hide') gsap.to(chars, {
        opacity: 0,
        rotateX: -90,
        x: '-10rem',
        transformOrigin: 'center top',
        duration: D.s,
        delay: delay ?? 0,
        stagger: {
          each: D.stagger * .5,
          amount: .3
        },
        ease: 'amohaIn',
        overwrite: true
      }); else gsap.set(chars, {
        opacity: 0,
        rotateX: -90,
        x: '-10rem',
        transformOrigin: 'center top'
      });
    });
  };
  const settle = el => {
    const s = el._split;
    if (!s || !el._plain || !el.hasAttribute('data-reveal')) return;
    const breaks = Array.prototype.filter.call(el.querySelectorAll('br'), b => getComputedStyle(b).display !== 'none').length;
    if (new Set(s.words.map(w => w.offsetTop)).size !== breaks + 1) return;
    s.revert();
    el._split = null;
  };
  AMOHA.animH = function(els, mode, delay) {
    arr(els).forEach((el, i) => {
      if (!el.textContent.trim()) return;
      show(el);
      if (el._plain == null) el._plain = !el.querySelector(':not(br)');
      const chars = splitWordsChars(el).chars, off = i * D.stagger;
      if (mode === 'reveal') gsap.fromTo(chars, {
        opacity: 0,
        yPercent: 50,
        rotateY: 90
      }, {
        opacity: 1,
        yPercent: 0,
        rotateY: 0,
        duration: D.l,
        delay: (delay ?? D.delay) + off,
        stagger: {
          each: D.stagger * .5,
          amount: .5
        },
        ease: 'amohaOut',
        overwrite: true,
        onComplete: () => settle(el)
      }); else if (mode === 'hide') gsap.to(chars, {
        opacity: 0,
        yPercent: -50,
        rotateY: -90,
        duration: D.s,
        delay: delay ?? 0,
        stagger: {
          each: D.stagger * .25,
          amount: .25
        },
        ease: 'amohaIn',
        overwrite: true
      }); else gsap.set(chars, {
        opacity: 0,
        yPercent: 50,
        rotateY: 90
      });
    });
  };
  AMOHA.animP = function(els, mode, delay) {
    arr(els).forEach((el, i) => {
      if (!el.textContent.trim()) return;
      show(el);
      const lines = splitLines(el).lines, off = i * D.stagger;
      if (mode === 'reveal') gsap.fromTo(lines, {
        yPercent: 110
      }, {
        yPercent: 0,
        duration: D.l,
        delay: (delay ?? D.delay) + off,
        stagger: D.stagger,
        ease: 'amohaOut',
        overwrite: true
      }); else if (mode === 'hide') gsap.to(lines, {
        yPercent: -110,
        duration: D.s,
        delay: delay ?? 0,
        stagger: D.stagger * .5,
        ease: 'amohaIn',
        overwrite: true
      }); else gsap.set(lines, {
        yPercent: 110
      });
    });
  };
  AMOHA.animCtn = function(els, mode, delay) {
    const list = arr(els);
    if (!list.length) return;
    show(list);
    const y = AMOHA.isMobile() ? '11.54rem' : '3.333rem';
    if (mode === 'reveal') gsap.fromTo(list, {
      opacity: 0,
      y: y
    }, {
      opacity: 1,
      y: '0rem',
      duration: D.l,
      delay: delay ?? D.delay,
      stagger: D.stagger,
      ease: 'amohaOut',
      overwrite: true
    }); else if (mode === 'hide') gsap.to(list, {
      opacity: 0,
      y: '0rem',
      duration: D.s,
      delay: delay ?? 0,
      stagger: D.stagger * .5,
      ease: 'amohaIn',
      overwrite: true
    }); else gsap.set(list, {
      opacity: 0,
      y: y
    });
  };
  AMOHA.animLine = function(els, mode, delay) {
    const list = arr(els);
    if (!list.length) return;
    show(list);
    const draw = (set, from, to, gone) => {
      if (!set.length) return;
      if (mode === 'reveal') gsap.fromTo(set, {
        clipPath: from
      }, {
        clipPath: to,
        duration: D.l,
        delay: delay ?? D.delay,
        stagger: D.stagger,
        ease: 'amohaOut',
        overwrite: true
      }); else if (mode === 'hide') gsap.to(set, {
        clipPath: gone,
        duration: D.s,
        delay: delay ?? 0,
        stagger: D.stagger * .5,
        ease: 'amohaIn',
        overwrite: true
      }); else gsap.set(set, {
        clipPath: from
      });
    };
    const h = list.filter(el => el.classList.contains('line-h'));
    draw(list.filter(el => !h.includes(el)), 'inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)', 'inset(100% 0% 0% 0%)');
    draw(h, 'inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)', 'inset(0% 0% 0% 100%)');
  };
  AMOHA.animSlide = function(els, mode, delay) {
    const list = arr(els);
    if (!list.length) return;
    show(list);
    const inner = list.map(e => e.firstElementChild).filter(Boolean);
    if (mode === 'reveal') {
      gsap.fromTo(list, {
        clipPath: 'polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)'
      }, {
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        duration: D.l,
        delay: delay ?? D.delay,
        ease: 'amohaInOut',
        overwrite: true
      });
      gsap.fromTo(inner, {
        scale: 1.5,
        xPercent: 25
      }, {
        scale: 1,
        xPercent: 0,
        duration: D.l,
        delay: delay ?? D.delay,
        ease: 'amohaInOut',
        overwrite: 'auto'
      });
    } else if (mode === 'hide') {
      gsap.fromTo(list, {
        clipPath: 'polygon(0% 0%, 100% 0%, 125% 100%, 0% 100%)'
      }, {
        clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
        duration: D.l,
        delay: delay ?? 0,
        ease: 'amohaInOut',
        overwrite: true
      });
      gsap.to(inner, {
        scale: 1.5,
        xPercent: -25,
        duration: D.l,
        delay: delay ?? 0,
        ease: 'amohaInOut',
        overwrite: true
      });
    } else {
      gsap.set(list, {
        clipPath: 'polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)'
      });
      gsap.set(inner, {
        scale: 1.5,
        xPercent: 25
      });
    }
  };
  AMOHA.anim = {
    a: AMOHA.animA,
    h: AMOHA.animH,
    p: AMOHA.animP,
    ctn: AMOHA.animCtn,
    line: AMOHA.animLine,
    slide: AMOHA.animSlide
  };
  /* ---------- scroll reveals ---------- */  const rowDelay = el => {
    const grid = el.closest('[data-reveal-row]');
    if (!grid) return 0;
    const cell = [ ...grid.children ].find(c => c.contains(el));
    if (!cell) return 0;
    const line = [ ...grid.children ].filter(c => Math.abs(c.offsetTop - cell.offsetTop) < 2);
    return line.indexOf(cell) * .08 + (+el.dataset.revealAfter || 0);
  };
  AMOHA.initReveals = function() {
    const groups = new Map;
    arr('[data-reveal-first]').forEach(el => {
      const p = el.parentElement;
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(el);
    });
    groups.forEach(list => list.slice(1).forEach(el => el.querySelectorAll('[data-reveal]').forEach(x => x.removeAttribute('data-reveal'))));
    const io = new IntersectionObserver(entries => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        io.unobserve(en.target);
        for (const el of en.target._reveals) {
          const d = rowDelay(el);
          AMOHA.anim[el._reveal](el, 'reveal', d ? D.delay + d : undefined);
        }
      }
    });
    const watched = (el, type) => type === 'slide' && el.parentElement || el;
    Object.keys(AMOHA.anim).forEach(type => {
      arr('[data-reveal="' + type + '"]').forEach(el => {
        if (AMOHA.reduced) {
          show(el);
          return;
        }
        AMOHA.anim[type](el, 'initial');
        el._reveal = type;
        const target = watched(el, type);
        (target._reveals || (target._reveals = [])).push(el);
        io.observe(target);
      });
    });
  };
  /* ---------- theme sensors ---------- */  AMOHA.initThemes = function(only) {
    const uis = only ? arr(only) : arr('[data-theme]');
    if (!uis.length) return;
    const classes = [ 't-light', 't-brand', 't-color', 't-dark' ];
    const map = {
      light: 't-light',
      brand: 't-brand',
      color: 't-color',
      dark: 't-dark'
    };
    const apply = (ui, cls, hero) => {
      classes.forEach(c => ui.classList.toggle(c, c === cls));
      ui.classList.toggle('is-hero', !!hero);
    };
    const set = (ui, cls, hero) => {
      ui._t = [ cls, hero ];
      apply(ui, cls, hero);
    };
    const nav = document.querySelector('.ui-nav'), heroEl = document.querySelector('[data-hero]');
    const barFoot = nav && AMOHA.isMobile() ? parseFloat(getComputedStyle(nav, '::before').height) || 0 : 0;
    const heroFoot = heroEl ? heroEl.getBoundingClientRect().bottom : -Infinity;
    const archDrop = (sensor, cx) => {
      if (!sensor.classList.contains('arch')) return 0;
      const sr = sensor.getBoundingClientRect(), R = parseFloat(getComputedStyle(sensor).borderTopLeftRadius) || 0;
      const dx = Math.max(sr.left + R - cx, cx - (sr.right - R), 0);
      return R && dx ? R - Math.sqrt(Math.max(0, R * R - Math.min(dx, R) * Math.min(dx, R))) : 0;
    };
    const sy = ScrollTrigger.getScrollFunc(AMOHA.wrapper || window);
    arr('[data-bg]').forEach(sensor => {
      if (getComputedStyle(sensor).display === 'none') return;
      const cls = map[sensor.dataset.bg];
      if (!cls) return;
      const sr = sensor.getBoundingClientRect(), hero = !!sensor.closest('[data-hero]');
      const byFoot = barFoot && !hero && !sensor.closest('.w-themes');
      const track = sensor.closest('[data-horizontal]'), tw = track && track._tween;
      if (tw) {
        const pieces = uis.map(ui => {
          const r = ui.getBoundingClientRect();
          return {
            ui: ui,
            cx: r.left + r.width / 2,
            cy: r.top + r.height / 2,
            on: false
          };
        });
        const check = () => {
          const b = sensor.getBoundingClientRect();
          pieces.forEach(p => {
            const on = p.cx >= b.left && p.cx <= b.right && p.cy >= b.top && p.cy <= b.bottom;
            if (on === p.on) return;
            p.on = on;
            if (on) apply(p.ui, cls, hero); else if (p.ui._t) apply(p.ui, p.ui._t[0], p.ui._t[1]);
          });
        };
        const prev = tw.eventCallback('onUpdate');
        tw.eventCallback('onUpdate', function() {
          if (prev) prev.apply(this, arguments);
          check();
        });
        ScrollTrigger.addEventListener('refresh', check);
        return;
      }
      uis.forEach(ui => {
        const r = ui.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        if (cx < sr.left || cx > sr.right) return;
        const foot = byFoot && cy < barFoot, top = foot && sr.top > heroFoot + 1 ? barFoot : cy, bottom = foot ? barFoot : cy;
        const bar = ui.querySelector('[data-bar]');
        const cross = y => {
          const b = bar.getBoundingClientRect();
          return (y + sy() - b.top) / (1 + b.height / (ScrollTrigger.maxScroll(AMOHA.wrapper || window) || 1));
        };
        ScrollTrigger.create({
          trigger: sensor,
          start: bar ? () => cross(sensor.getBoundingClientRect().top + archDrop(sensor, cx)) : () => 'top+=' + archDrop(sensor, cx) + ' top+=' + top,
          end: bar ? () => cross(sensor.getBoundingClientRect().bottom) : () => 'bottom top+=' + bottom,
          onEnter: () => set(ui, cls, hero),
          onEnterBack: () => set(ui, cls, hero)
        });
      });
    });
  };
  /* ---------- chapter snap ---------- */  AMOHA.initSnap = function() {
    if (AMOHA.isMobile() || AMOHA.reduced || !AMOHA.lenis) return;
    const els = arr('[data-snap]');
    if (!els.length) return;
    let tmr = null;
    AMOHA.lenis.on('scroll', () => {
      clearTimeout(tmr);
      tmr = setTimeout(() => {
        const vh = window.innerHeight;
        let best = null, bestRatio = 0;
        els.forEach(el => {
          if (el.offsetHeight > vh * 1.4) return;
          const r = el.getBoundingClientRect();
          const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
          const ratio = visible / Math.min(el.offsetHeight, vh);
          if (ratio > .5 && ratio > bestRatio) {
            bestRatio = ratio;
            best = el;
          }
        });
        if (best) AMOHA.lenis.scrollTo(best, {
          duration: D.l,
          easing: gsap.parseEase('amohaEase')
        });
      }, 40);
    });
  };
  /* ---------- scroll bar ---------- */  AMOHA.initScrollbar = function() {
    const bar = document.querySelector('[data-bar]');
    if (!bar || AMOHA.isMobile()) return;
    const thumb = bar.querySelector('[data-bar-thumb]'), label = bar.querySelector('[data-bar-label]');
    const update = p => {
      bar.style.setProperty('--progress', p * 100 + '%');
      if (label) label.textContent = String(Math.round(p * 100)).padStart(2, '0');
    };
    const limit = () => AMOHA.lenis ? AMOHA.lenis.limit : document.documentElement.scrollHeight - window.innerHeight;
    if (AMOHA.lenis) AMOHA.lenis.on('scroll', e => update(e.progress)); else {
      const f = () => update(gsap.utils.clamp(0, 1, window.scrollY / Math.max(1, limit())));
      addEventListener('scroll', f, {
        passive: true
      });
      f();
    }
    let dragging = false;
    thumb.addEventListener('pointerdown', e => {
      dragging = true;
      thumb.setPointerCapture(e.pointerId);
      document.body.style.cursor = 'grabbing';
    });
    thumb.addEventListener('pointermove', e => {
      if (!dragging) return;
      const r = bar.getBoundingClientRect();
      const t = gsap.utils.clamp(0, 1, (e.clientY - r.top) / r.height);
      AMOHA.scrollTo(t * limit(), {
        duration: 3.2
      });
    });
    const stop = () => {
      dragging = false;
      document.body.style.cursor = '';
    };
    thumb.addEventListener('pointerup', stop);
    thumb.addEventListener('pointercancel', stop);
  };
  /* ---------- logo ring ---------- */  AMOHA.initLogoRing = function() {
    const ring = document.querySelector('[data-logo-ring]');
    if (!ring || AMOHA.reduced) return;
    const state = {
      speed: 30
    };
    let angle = 0, dir = 1, interacted = false, tmr;
    addEventListener('wheel', () => {
      interacted = true;
    }, {
      once: true,
      passive: true
    });
    addEventListener('touchmove', () => {
      interacted = true;
    }, {
      once: true,
      passive: true
    });
    gsap.ticker.add((t, dt) => {
      angle += state.speed * (Math.min(dt, 100) / 1e3);
      gsap.set(ring, {
        rotation: angle,
        transformOrigin: 'center center'
      });
    });
    const onScroll = v => {
      if (!interacted) return;
      if (v !== 0) dir = v > 0 ? 1 : -1;
      gsap.to(state, {
        speed: dir * (30 + 10 * Math.abs(v)),
        duration: .3,
        ease: 'amohaOut',
        overwrite: true
      });
      clearTimeout(tmr);
      tmr = setTimeout(() => gsap.to(state, {
        speed: 30 * dir,
        duration: D.l,
        ease: 'amohaOut'
      }), 100);
    };
    if (AMOHA.lenis) AMOHA.lenis.on('scroll', e => onScroll(e.velocity)); else {
      let last = scrollY;
      addEventListener('scroll', () => {
        onScroll((scrollY - last) / 10);
        last = scrollY;
      }, {
        passive: true
      });
    }
  };
  /* ---------- preloader ---------- */  AMOHA.initPreloader = function(onReady) {
    const pre = document.querySelector('[data-preloader]');
    if (pre && pre.hasAttribute('data-loader')) {
      AMOHA.initLoader(pre, onReady);
      return;
    }
    const zoom = document.querySelector('[data-hero-zoom]');
    let visited = false;
    try {
      visited = !!sessionStorage.getItem('amoha-visited');
      sessionStorage.setItem('amoha-visited', '1');
    } catch (e) {}
    let readyDone = false, teardownDone = false;
    const ready = () => {
      if (readyDone) return;
      readyDone = true;
      onReady && onReady();
    };
    const teardown = () => {
      if (teardownDone) return;
      teardownDone = true;
      AMOHA.unlockScroll();
      pre && pre.remove();
      ScrollTrigger.refresh();
    };
    if (!pre || AMOHA.reduced) {
      pre && pre.remove();
      ready();
      return;
    }
    setTimeout(() => {
      ready();
      teardown();
    }, 11e3);
    const mob = AMOHA.isMobile();
    const W = () => window.innerWidth, H = () => window.innerHeight;
    const arch = {
      w: mob ? .4 : .24,
      y: 1.04
    };
    const applyArch = () => {
      const w = W(), h = H(), aw = arch.w * w, ay = arch.y * h, x0 = (w - aw) / 2, r = aw / 2, top = ay + r;
      pre.style.setProperty('--arch-w', aw + 'px');
      pre.style.setProperty('--arch-y', ay + 'px');
      pre.style.clipPath = 'path(evenodd, "M0 0H' + w + 'V' + h + 'H0Z M' + x0 + ' ' + top + ' A' + r + ' ' + r + ' 0 0 1 ' + (x0 + aw) + ' ' + top + ' V' + (h + 10) + ' H' + x0 + ' Z")';
    };
    const heroScale = mob ? 1.15 : .75;
    AMOHA.lockScroll();
    window.scrollTo(0, 0);
    if (AMOHA.wrapper) AMOHA.wrapper.scrollTop = 0;
    zoom && gsap.set(zoom, {
      scale: heroScale,
      transformOrigin: 'center top'
    });
    applyArch();
    pre.style.display = 'block';
    const q = s => pre.querySelectorAll(s);
    const mark = pre.querySelector('.preloader__mark'), decor = pre.querySelector('.decor'), track = pre.querySelector('[data-progress-track]'), ctn = pre.querySelector('.preloader__ctn');
    const tl = gsap.timeline({
      onComplete: teardown
    });
    if (!visited) {
      AMOHA.animA(q('[data-part="a"]'), 'initial');
      AMOHA.animH(q('[data-part="h"]'), 'initial');
      AMOHA.animP(q('[data-part="p"]'), 'initial');
      AMOHA.animCtn(q('[data-part="ctn"]'), 'initial');
      AMOHA.animLine(q('[data-part="line"]'), 'initial');
      tl.add(() => {
        AMOHA.animA(q('[data-part="a"]'), 'reveal');
        AMOHA.animH(q('[data-part="h"]'), 'reveal');
        AMOHA.animP(q('[data-part="p"]'), 'reveal');
        AMOHA.animCtn(q('[data-part="ctn"]'), 'reveal', D.s);
        AMOHA.animLine(q('[data-part="line"]'), 'reveal');
      }).to({}, {
        duration: D.m
      }).fromTo(mark, {
        opacity: 0
      }, {
        opacity: .05,
        duration: D.l,
        ease: 'amohaOut'
      }).fromTo(decor, {
        opacity: 0
      }, {
        opacity: 1,
        duration: D.l,
        ease: 'amohaOut'
      }, '<').fromTo(track, {
        yPercent: -100
      }, {
        yPercent: 0,
        duration: 2.6,
        ease: 'eraLoader'
      });
    } else {
      gsap.set(ctn, {
        display: 'none'
      });
      tl.fromTo(mark, {
        opacity: 0
      }, {
        opacity: .05,
        duration: D.l,
        ease: 'amohaOut'
      }).fromTo(decor, {
        opacity: 0
      }, {
        opacity: 1,
        duration: D.l,
        ease: 'amohaOut'
      }, '<');
    }
    tl.to(arch, {
      w: mob ? .5 : .36,
      y: .15,
      duration: 1.25 * D.l,
      ease: 'amohaInOut',
      onUpdate: applyArch
    }, visited ? '<' : '>').to(arch, {
      w: 1.25,
      y: -1,
      duration: 1.9 * D.l,
      ease: 'amohaDive',
      onUpdate: applyArch
    }, '<80%').to([ ctn, mark, decor ].filter(Boolean), {
      opacity: 0,
      duration: 1.1 * D.l,
      ease: 'amohaOut'
    }, '<').add(() => {
      zoom && gsap.fromTo(zoom, {
        scale: heroScale
      }, {
        scale: 1,
        duration: 1.4 * D.l,
        ease: 'amohaInOut'
      });
    }, '<').add(ready, '<20%');
  };
  /* ---------- page transition: the layers wipe ----------
     Adapted from "Layers Animation with Clip-path" (assets/library/components/awwwards-300/
     Page Transitions/3), the same mechanic that drives the facts rows. Three panels wipe up to
     cover the page you are leaving; the page you arrive on lifts them off the top instead of
     playing the door intro a second time. */  AMOHA.initPageTransition = function() {
    const pt = document.querySelector('[data-pt]');
    if (!pt) return;
    const layers = arr(pt.querySelectorAll('.pt__layer'));
    if (!layers.length) return;
    const HIDDEN = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';
    const SHOWN = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
    const GONE = 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)';
    const KEY = 'amoha-pt';
    let arriving = false;
    try {
      arriving = sessionStorage.getItem(KEY) === '1';
      sessionStorage.removeItem(KEY);
    } catch (e) {}
    if (arriving && !AMOHA.reduced) {
      AMOHA.ptArriving = true;
      pt.classList.add('is-on');
      gsap.set(layers, {
        clipPath: SHOWN,
        opacity: 1
      });
      document.documentElement.classList.remove('is-arriving');
    }
    AMOHA.ptReveal = function() {
      if (!AMOHA.ptArriving) return;
      AMOHA.ptArriving = false;
      gsap.to(layers.slice().reverse(), {
        clipPath: GONE,
        duration: .72,
        ease: 'amohaInOut',
        stagger: .09,
        onComplete: () => pt.classList.remove('is-on')
      });
    };
    if (AMOHA.reduced) return;
    document.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href') || '';
      if (!/^[a-z0-9-]+\.html(\?|#|$)/i.test(href)) return;
      e.preventDefault();
      try {
        sessionStorage.setItem(KEY, '1');
      } catch (err) {}
      const go = () => {
        location.href = href;
      };
      pt.classList.add('is-on');
      gsap.set(layers, {
        opacity: 1
      });
      gsap.fromTo(layers, {
        clipPath: HIDDEN
      }, {
        clipPath: SHOWN,
        duration: .62,
        ease: 'amohaInOut',
        onComplete: go,
        stagger: {
          each: .085,
          onComplete: function() {
            const i = layers.indexOf(this.targets()[0]);
            if (i > 0) gsap.set(layers[i - 1], {
              opacity: 0
            });
          }
        }
      });
      setTimeout(go, 1500);
    });
  };
  let revealedDone;
  AMOHA.revealed = new Promise(r => {
    revealedDone = r;
  });
  setTimeout(() => revealedDone(), 15e3);
  const revealed = () => {
    revealedDone();
    document.dispatchEvent(new Event('amoha:revealed'));
  };
  AMOHA.initLoader = function(pre, onReady) {
    const root = document.documentElement;
    const build = () => Promise.resolve(onReady && onReady());
    let seen = false;
    try {
      seen = sessionStorage.getItem('amoha-seen') === '1';
      sessionStorage.setItem('amoha-seen', '1');
    } catch (e) {}
    if (seen || AMOHA.ptArriving) {
      const arriving = AMOHA.ptArriving;
      root.classList.add('is-open', 'is-in');
      pre.remove();
      AMOHA.unlockScroll();
      if (arriving) window.scrollTo(0, 0);
      build().then(() => {
        ScrollTrigger.refresh();
        if (arriving) gsap.delayedCall(.12, () => AMOHA.ptReveal && AMOHA.ptReveal());
        revealed();
      });
      return;
    }
    const q = s => pre.querySelector(s);
    const open = q('[data-door-open]'), veil = q('[data-door-veil]'), spill = q('[data-door-spill]'), mark = q('[data-door-mark]'), scene = q('[data-door-scene]');
    const fades = pre.querySelectorAll('[data-door-fade]'), zoom = document.querySelector('[data-hero-zoom]');
    const masks = window.CSS && (CSS.supports('mask-composite', 'exclude') || CSS.supports('-webkit-mask-composite', 'xor'));
    AMOHA.lockScroll();
    window.scrollTo(0, 0);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const m = AMOHA.milestones || {};
    const left = ms => wait(Math.max(0, ms - performance.now()));
    const picture = Promise.race([ m.hero || Promise.resolve(), left(6e3) ]);
    const built = wait(120).then(build);
    let gone = false;
    const done = () => {
      pre.remove();
      AMOHA.unlockScroll();
      ScrollTrigger.refresh();
      revealed();
    };
    const leave = () => {
      if (gone) return;
      gone = true;
      if (AMOHA.reduced || !masks) {
        root.classList.add('is-open', 'is-in');
        pre.animate([ {
          opacity: 1
        }, {
          opacity: 0
        } ], {
          duration: 280,
          easing: 'ease-out',
          fill: 'forwards'
        }).finished.then(done, done);
        return;
      }
      const dive = 'cubic-bezier(0.6, 0, 0, 1)', out = 'cubic-bezier(0.25, 1, 0.5, 1)', inOut = 'cubic-bezier(0.75, 0, 0.25, 1)';
      const v = veil.getBoundingClientRect(), r = v.width / 2, spring = v.top + r;
      const W = pre.clientWidth, H = pre.clientHeight;
      const scale = Math.hypot(W / 2, Math.max(spring, H - spring)) / r * 1.12;
      fades.forEach(el => el.animate([ {
        opacity: 1
      }, {
        opacity: 0
      } ], {
        duration: 450,
        easing: out,
        fill: 'forwards'
      }));
      [ veil, spill ].forEach(el => el.animate([ {
        opacity: getComputedStyle(el).opacity
      }, {
        opacity: 0
      } ], {
        duration: 500,
        easing: out,
        fill: 'forwards'
      }));
      const grow = open.animate([ {
        transform: 'scale(1)'
      }, {
        transform: 'scale(' + scale.toFixed(3) + ')'
      } ], {
        duration: 1300,
        easing: dive,
        fill: 'forwards'
      });
      if (zoom) zoom.animate([ {
        transform: getComputedStyle(zoom).transform,
        transformOrigin: '50% 0'
      }, {
        transform: 'none',
        transformOrigin: '50% 0'
      } ], {
        duration: 1500,
        easing: inOut
      });
      if (scene) scene.animate([ {
        opacity: 1
      }, {
        opacity: 0
      } ], {
        duration: 700,
        delay: 450,
        easing: inOut,
        fill: 'forwards'
      });
      root.classList.add('is-open');
      const badge = document.querySelector('.ui-logo__symbol');
      if (badge && mark) {
        const a = mark.getBoundingClientRect(), b = badge.getBoundingClientRect();
        if (b.width) {
          const to = 'translate(' + (b.left + b.width / 2 - (a.left + a.width / 2)).toFixed(1) + 'px, ' + (b.top + b.height / 2 - (a.top + a.height / 2)).toFixed(1) + 'px) scale(' + (b.height / a.height).toFixed(3) + ')';
          mark.animate([ {
            transform: 'none',
            opacity: 1
          }, {
            transform: to,
            opacity: 1,
            offset: .82
          }, {
            transform: to,
            opacity: 0
          } ], {
            duration: 1150,
            easing: inOut,
            fill: 'forwards'
          });
        }
      }
      setTimeout(() => root.classList.add('is-in'), 650);
      grow.finished.then(done, done);
    };
    Promise.all([ left(AMOHA.reduced ? 300 : 2100), picture, built ]).then(() => setTimeout(leave, 200));
    setTimeout(leave, 9e3);
  };
  /* ---------- cookie card ---------- */  AMOHA.initCookies = function() {
    const box = document.querySelector('[data-cookies]');
    if (!box) return;
    let saved = null;
    try {
      saved = localStorage.getItem('amoha-cookies');
    } catch (e) {}
    if (saved) {
      box.remove();
      return;
    }
    const close = v => {
      try {
        localStorage.setItem('amoha-cookies', v);
      } catch (e) {}
      gsap.to(box, {
        yPercent: 100,
        duration: D.m,
        ease: 'amohaIn',
        onComplete: () => box.remove()
      });
    };
    gsap.fromTo(box, {
      yPercent: 100
    }, {
      yPercent: 0,
      duration: D.m,
      delay: AMOHA.reduced ? 0 : 4.5,
      ease: 'amohaOut'
    });
    box.querySelector('[data-cookies="accept"]').addEventListener('click', e => {
      e.preventDefault();
      close('accepted');
    });
    box.querySelector('[data-cookies="decline"]').addEventListener('click', e => {
      e.preventDefault();
      close('declined');
    });
  };
})(window.AMOHA);
