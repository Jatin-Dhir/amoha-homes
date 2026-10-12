/*!
 * Amoha Group website — interactive components: buttons, links, navigation, modals, enquiry form
 * Designed and developed by Jatin Dhir <jatindhir.dev@gmail.com>
 */
(function(AMOHA) {
  'use strict';
  const D = AMOHA.D, arr = AMOHA.arr;
  /* ---------- hero ---------- */  AMOHA.initHeroTabs = function() {
    const root = document.querySelector('[data-hero-tabs]');
    if (!root) return;
    const triggers = arr(root.querySelectorAll('[data-tab-trigger]'));
    const divider = root.querySelector('[data-tabs-divider]');
    let current = 0, busy = false;
    const content = t => root.querySelector('[data-tab-content="' + t.dataset.tabTrigger + '"]');
    triggers.forEach((t, i) => t.addEventListener('click', e => {
      e.preventDefault();
      if (i === current || busy) return;
      const prev = content(triggers[current]), next = content(t);
      busy = true;
      gsap.timeline({
        onComplete: () => {
          busy = false;
        }
      }).set(next, {
        display: 'block',
        zIndex: 1
      }).set(prev, {
        zIndex: 0
      }).fromTo(next.querySelector('.img-w'), {
        opacity: 0
      }, {
        opacity: 1,
        duration: D.m,
        ease: 'amohaInOut'
      }).set(prev, {
        display: 'none'
      });
      triggers[current].classList.remove('is-active');
      t.classList.add('is-active');
      current = i;
      if (divider) divider.classList.toggle('is-night', i === 1);
    }));
  };
  /* ---------- hotspot pins ---------- */  AMOHA.initPins = function() {
    arr('[data-pin]').forEach(pin => {
      const pulses = pin.querySelectorAll('[data-pin-pulse]'), w = pin.offsetWidth;
      if (!pulses.length || AMOHA.reduced) return;
      gsap.fromTo(pulses, {
        opacity: 1,
        width: w,
        height: w
      }, {
        opacity: 0,
        width: 1.6 * w,
        height: 1.6 * w,
        duration: D.l,
        ease: 'amohaIn',
        stagger: .2,
        repeat: -1
      });
    });
  };
  /* ---------- tip cards ---------- */  AMOHA.initTips = function() {
    if (AMOHA.isMobile()) return;
    const tips = new Map;
    arr('[data-tip]').forEach(t => tips.set(t.dataset.tip, t));
    const active = new Set;
    const place = (tip, x, y) => {
      const r = tip.firstElementChild.getBoundingClientRect();
      tip.classList.toggle('is-left', x + r.width + 40 > window.innerWidth);
      tip.classList.toggle('is-top', y + r.height / 2 > window.innerHeight);
    };
    document.addEventListener('mousemove', e => active.forEach(tip => {
      place(tip, e.clientX, e.clientY);
      gsap.to(tip, {
        x: e.clientX,
        y: e.clientY,
        duration: 2 * D.l,
        ease: 'power3'
      });
    }));
    arr('[data-tip-trigger]').forEach(trig => {
      const tip = tips.get(trig.dataset.tipTrigger);
      if (!tip) return;
      trig.addEventListener('mouseenter', e => {
        gsap.set(tip, {
          x: e.clientX,
          y: e.clientY
        });
        place(tip, e.clientX, e.clientY);
        tip.classList.add('is-active');
        active.add(tip);
      });
      trig.addEventListener('mouseleave', () => {
        tip.classList.remove('is-active', 'is-left', 'is-top');
        active.delete(tip);
      });
    });
  };
  /* ---------- slider ---------- */  function partsOf(slide) {
    return {
      h: slide.querySelectorAll('[data-s="h"]'),
      p: slide.querySelectorAll('[data-s="p"]'),
      ctn: slide.querySelectorAll('[data-s="ctn"]'),
      img: slide.querySelectorAll('[data-s="img"]')
    };
  }
  AMOHA.initSliders = function() {
    arr('[data-slider]:not([data-slider="slide"])').forEach(root => {
      if (root.getAttribute('data-slider') !== '') return;
      const slides = arr(root.querySelectorAll('[data-slider="slide"]'));
      const $ = k => root.querySelector('[data-slider="' + k + '"]');
      const pag = $('pag'), prev = $('prev'), next = $('next'), cur = $('current'), nextNum = $('next-num'), progress = $('progress');
      const auto = parseFloat(root.dataset.auto) || 0;
      let i = 0, busy = false, timer = null;
      if (slides.length < 2) {
        pag && (pag.style.display = 'none');
        return;
      }
      gsap.set(slides, {
        display: 'none',
        position: 'absolute'
      });
      gsap.set(slides[0], {
        display: 'block',
        position: 'relative'
      });
      const counters = () => {
        cur && (cur.textContent = i + 1);
        nextNum && (nextNum.textContent = i === slides.length - 1 ? 1 : i + 2);
      };
      const go = to => {
        if (busy || to === i) return;
        busy = true;
        const from = slides[i], dest = slides[to], a = partsOf(from), b = partsOf(dest);
        from.style.zIndex = 0;
        dest.style.zIndex = 1;
        gsap.timeline({
          onComplete: () => {
            from.style.zIndex = '';
            busy = false;
          }
        }).set(dest, {
          display: 'block',
          position: 'relative'
        }).set(from, {
          display: 'block',
          position: 'absolute'
        }).add(() => {
          dest.querySelectorAll('[data-fit-text]').forEach(AMOHA.fitText);
          AMOHA.animH(b.h, 'initial');
          AMOHA.animP(b.p, 'initial');
          AMOHA.animCtn(b.ctn, 'initial');
          AMOHA.animSlide(b.img, 'initial');
          ScrollTrigger.refresh();
        }).add(() => {
          AMOHA.animH(a.h, 'hide', 0);
          AMOHA.animP(a.p, 'hide', 0);
          AMOHA.animCtn(a.ctn, 'hide', 0);
          AMOHA.animSlide(a.img, 'hide', 0);
          AMOHA.animSlide(b.img, 'reveal', 0);
        }).to({}, {
          duration: D.m
        }).add(() => {
          AMOHA.animH(b.h, 'reveal', 0);
          AMOHA.animP(b.p, 'reveal', 0);
          AMOHA.animCtn(b.ctn, 'reveal', D.s);
        }).to({}, {
          duration: D.s
        }).set(from, {
          display: 'none'
        });
        i = to;
        counters();
      };
      const bar = () => progress && gsap.fromTo(progress, {
        width: '0%'
      }, {
        width: '100%',
        duration: auto,
        ease: 'none'
      });
      const stop = () => {
        clearInterval(timer);
        timer = null;
        if (progress) {
          gsap.killTweensOf(progress);
          gsap.set(progress, {
            width: '0%'
          });
        }
      };
      const start = () => {
        if (!auto || AMOHA.reduced) return;
        stop();
        bar();
        timer = setInterval(() => {
          go(i === slides.length - 1 ? 0 : i + 1);
          bar();
        }, auto * 1e3);
      };
      counters();
      new IntersectionObserver(([e]) => e.isIntersecting ? start() : stop(), {
        threshold: .2
      }).observe(root);
      document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
      prev && prev.addEventListener('click', () => {
        go(i === 0 ? slides.length - 1 : i - 1);
        start();
      });
      next && next.addEventListener('click', () => {
        go(i === slides.length - 1 ? 0 : i + 1);
        start();
      });
    });
  };
  AMOHA.initNavBar = function() {
    const nav = document.querySelector('.ui-nav');
    if (!nav) return;
    const hero = document.querySelector('[data-hero]'), dome = !!document.querySelector('.benefits.arch');
    const sy = () => AMOHA.lenis ? AMOHA.lenis.scroll : window.scrollY;
    let heroEnd = -Infinity, clearAt = 0;
    const measure = () => {
      heroEnd = hero ? hero.getBoundingClientRect().bottom + sy() : -Infinity;
      clearAt = dome ? (parseFloat(getComputedStyle(nav, '::before').height) || 0) * .7 : 0;
    };
    const set = () => {
      const y = sy();
      nav.classList.toggle('is-solid', y > window.innerHeight * .55 && heroEnd - y <= clearAt);
    };
    measure();
    set();
    ScrollTrigger.addEventListener('refresh', () => {
      measure();
      set();
    });
    if (AMOHA.lenis) AMOHA.lenis.on('scroll', set); else window.addEventListener('scroll', set, {
      passive: true
    });
  };
  AMOHA.initHeroVideo = function() {
    const vids = arr('[data-hero-video]');
    if (!vids.length) return;
    if (AMOHA.reduced) return;
    if (AMOHA.lite) return;
    const c = navigator.connection;
    if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return;
    const load = v => {
      if (!v || v.dataset.heroLoaded) return;
      v.dataset.heroLoaded = '1';
      v.src = v.dataset.heroVideo;
      v.addEventListener('canplay', () => {
        v.classList.add('is-ready');
        if (visible(v)) v.play().catch(() => {});
      }, {
        once: true
      });
      v.addEventListener('error', () => {
        v.remove();
      }, {
        once: true
      });
      v.load();
    };
    const visible = v => {
      const p = v.closest('[data-tab-content]');
      return !p || getComputedStyle(p).display !== 'none';
    };
    vids.filter(visible).forEach(load);
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 2500));
    const warm = () => idle(() => vids.filter(v => !visible(v)).forEach(load));
    const first = vids.find(visible);
    if (first) first.addEventListener('canplay', () => setTimeout(warm, 1200), {
      once: true
    }); else warm();
    const tabs = document.querySelector('.hero__tabs');
    if (tabs && !AMOHA.reduced) {
      let touched = false;
      arr('[data-tab-trigger]').forEach(t => t.addEventListener('click', () => {
        touched = true;
        tabs.classList.remove('is-hinting');
      }, {
        once: true
      }));
      setTimeout(() => {
        if (!touched) tabs.classList.add('is-hinting');
      }, 6e3);
    }
    arr('[data-tab-trigger]').forEach(t => t.addEventListener('click', () => {
      vids.forEach(load);
      gsap.delayedCall(.08, () => vids.forEach(v => {
        if (visible(v) && v.dataset.heroLoaded) v.play().catch(() => {});
      }));
      gsap.delayedCall(D.m + .2, () => {
        vids.filter(v => !visible(v)).forEach(v => v.pause());
      });
    }));
    let onScreen = true;
    const sync = () => vids.forEach(v => {
      if (!v.dataset.heroLoaded) return;
      if (document.hidden || !onScreen || !visible(v)) v.pause(); else v.play().catch(() => {});
    });
    const hero = vids[0].closest('[data-hero]') || vids[0].closest('section');
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(es => {
        onScreen = es[es.length - 1].isIntersecting;
        sync();
      }, {
        rootMargin: '10%'
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', sync);
  };
  /* ---------- tabs ---------- */  AMOHA.initTabs = function() {
    arr('[data-tabs]').forEach(root => {
      const triggers = arr(root.querySelectorAll('[data-tab-trigger]'));
      const contents = arr(root.querySelectorAll('[data-tab-content]'));
      const hilight = root.querySelector('[data-tab-hilight]');
      const vertical = root.dataset.tabsHilight !== 'hor';
      let i = 0, busy = false;
      const content = t => root.querySelector('[data-tab-content="' + t.dataset.tabTrigger + '"]');
      const parts = c => ({
        h: c.querySelectorAll('[data-t="h"]'),
        p: c.querySelectorAll('[data-t="p"]'),
        ctn: c.querySelectorAll('[data-t="ctn"]'),
        slide: c.querySelectorAll('[data-t="slide"]')
      });
      gsap.set(contents, {
        display: 'none',
        position: 'absolute'
      });
      gsap.set(contents[0], {
        display: 'block',
        position: 'relative'
      });
      const moveHilight = () => {
        const t = root.querySelector('[data-tab].is-active');
        if (!t || !hilight) return;
        gsap.to(hilight, Object.assign(vertical ? {
          y: t.offsetTop,
          height: t.offsetHeight
        } : {
          x: t.offsetLeft,
          width: t.offsetWidth
        }, {
          duration: D.m,
          ease: 'amohaInOut'
        }));
      };
      setTimeout(moveHilight, 60);
      triggers.forEach((t, n) => t.addEventListener('click', () => {
        if (n === i || busy) return;
        busy = true;
        const from = content(triggers[i]), dest = content(t), a = parts(from), b = parts(dest);
        gsap.timeline({
          onComplete: () => {
            busy = false;
          }
        }).set(dest, {
          display: 'block',
          position: 'relative',
          zIndex: 1
        }).set(from, {
          display: 'block',
          position: 'absolute',
          zIndex: 0
        }).add(() => {
          AMOHA.animH(b.h, 'initial');
          AMOHA.animP(b.p, 'initial');
          AMOHA.animCtn(b.ctn, 'initial');
          AMOHA.animSlide(b.slide, 'initial');
          ScrollTrigger.refresh();
        }).add(() => {
          AMOHA.animH(a.h, 'hide', 0);
          AMOHA.animP(a.p, 'hide', 0);
          AMOHA.animCtn(a.ctn, 'hide', 0);
          AMOHA.animSlide(a.slide, 'hide', 0);
          AMOHA.animSlide(b.slide, 'reveal', 0);
        }).to({}, {
          duration: D.m
        }).add(() => {
          AMOHA.animH(b.h, 'reveal', 0);
          AMOHA.animP(b.p, 'reveal', 0);
          AMOHA.animCtn(b.ctn, 'reveal', D.s);
        }).to({}, {
          duration: D.s
        }).set(from, {
          display: 'none'
        });
        triggers[i].classList.remove('is-active');
        t.classList.add('is-active');
        i = n;
        moveHilight();
      }));
    });
  };
  /* ---------- accordion ---------- */  AMOHA.initAccordions = function() {
    const cards = arr('.other-card');
    let open = null;
    arr('[data-accordion]:not([data-accordion="content"]):not([data-accordion="p"]):not([data-accordion="ctn"])').forEach(card => {
      const content = card.querySelector('[data-accordion="content"]'), ico = card.querySelector('[data-ico-plus]');
      const p = card.querySelectorAll('[data-accordion="p"]'), ctn = card.querySelectorAll('[data-accordion="ctn"]');
      if (!content) return;
      gsap.set(content, {
        height: 0,
        overflow: 'hidden'
      });
      AMOHA.animP(p, 'initial');
      AMOHA.animCtn(ctn, 'initial');
      const show = () => {
        card.classList.add('is-active');
        gsap.to(content, {
          height: 'auto',
          duration: D.l,
          ease: 'amohaOut',
          onComplete: () => ScrollTrigger.refresh()
        });
        ico && gsap.fromTo(ico, {
          rotate: 0
        }, {
          rotate: -45,
          duration: D.m,
          ease: 'amohaInOut',
          overwrite: true
        });
        AMOHA.animP(p, 'reveal');
        AMOHA.animCtn(ctn, 'reveal');
      };
      const hide = () => {
        card.classList.remove('is-active');
        gsap.to(content, {
          height: 0,
          duration: D.l,
          ease: 'amohaOut',
          overwrite: true,
          onComplete: () => ScrollTrigger.refresh()
        });
        ico && gsap.to(ico, {
          rotate: -90,
          duration: D.m,
          ease: 'amohaInOut',
          overwrite: true
        });
        AMOHA.animP(p, 'hide', 0);
        AMOHA.animCtn(ctn, 'hide', 0);
      };
      card._close = hide;
      card.querySelector('.other-card__name').addEventListener('click', () => {
        if (open && open !== card) open._close();
        if (open !== card) {
          show();
          open = card;
          if (AMOHA.showLayer) AMOHA.showLayer(cards.indexOf(card));
        } else {
          hide();
          open = null;
        }
      });
    });
    const first = document.querySelector('.other-card [data-accordion="content"]') && document.querySelector('.other-card');
    if (first) first.querySelector('.other-card__name').click();
  };
  AMOHA.initAboutWindow = function() {
    const win = document.querySelector('[data-about-window]');
    if (!win) return;
    const views = arr(win.querySelectorAll('.about__view'));
    let current = 0;
    const show = n => {
      if (n === current) return;
      current = n;
      views.forEach((v, i) => v.classList.toggle('is-on', i <= n));
    };
    const io = new IntersectionObserver(entries => {
      for (const en of entries) if (en.isIntersecting) show(+en.target.dataset.aboutCh);
    }, {
      rootMargin: '-50% 0px -50% 0px'
    });
    arr('[data-about-ch]').forEach(ch => io.observe(ch));
  };
  AMOHA.initLayers = function() {
    const stack = document.querySelector('[data-layers]');
    if (!stack) return;
    const layers = arr(stack.querySelectorAll('.other__layer'));
    const inners = layers.map(l => l.querySelector('.other__layer-img'));
    if (!layers.length) return;
    const HIDDEN = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';
    const SHOWN = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
    let current = -1, tl = null;
    const settle = n => layers.forEach((l, i) => gsap.set(l, {
      opacity: i === n ? 1 : 0,
      clipPath: i === n ? SHOWN : HIDDEN
    }));
    settle(0);
    current = 0;
    AMOHA.showLayer = n => {
      if (n === current || n < 0 || n >= layers.length) return;
      if (tl) tl.kill();
      const forward = n > current;
      const seq = [];
      for (let i = current + (forward ? 1 : -1); forward ? i <= n : i >= n; forward ? i++ : i--) seq.push(i);
      if (!seq.length) return;
      const inner = seq.map(i => inners[i]);
      if (AMOHA.reduced) {
        settle(n);
        current = n;
        return;
      }
      tl = gsap.timeline({
        defaults: {
          duration: .9,
          ease: 'power3.inOut'
        },
        onComplete: () => {
          settle(n);
        }
      }).set(seq.map(i => layers[i]), {
        opacity: 1
      }).fromTo(seq.map(i => layers[i]), {
        clipPath: HIDDEN
      }, {
        clipPath: SHOWN,
        stagger: .12
      }, 0).fromTo(inner, {
        filter: 'brightness(45%)',
        scale: 1.06
      }, {
        filter: 'brightness(100%)',
        scale: 1,
        stagger: .12
      }, 0);
      current = n;
    };
  };
  /* ---------- magnetic buttons ---------- */  AMOHA.initMagnetic = function() {
    if (AMOHA.isMobile() || AMOHA.reduced) return;
    arr('[data-magnetic]').forEach(el => {
      const inner = arr(el.querySelectorAll('[data-magnetic-inner]'));
      const reset = (t, hard) => {
        gsap.killTweensOf(t);
        (hard ? gsap.set : gsap.to)(t, Object.assign({
          x: 0,
          y: 0,
          force3D: true,
          clearProps: 'all'
        }, hard ? {} : {
          ease: 'elastic.out(1, 0.3)',
          duration: 1.6
        }));
      };
      el.addEventListener('mouseenter', () => {
        reset(el, true);
        inner.forEach(n => reset(n, true));
      });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect(), s = parseFloat(el.dataset.magnetic) || 25, si = parseFloat(el.dataset.magneticInner) || s;
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        gsap.to(el, {
          x: px * (s / 16) + 'em',
          y: py * (s / 16) + 'em',
          force3D: true,
          ease: 'power4.out',
          duration: 1.6
        });
        inner.forEach(n => gsap.to(n, {
          x: px * (si / 16) + 'em',
          y: py * (si / 16) + 'em',
          force3D: true,
          ease: 'power4.out',
          duration: 2
        }));
      });
      el.addEventListener('mouseleave', () => {
        reset(el, false);
        inner.forEach(n => reset(n, false));
      });
    });
  };
  /* ---------- circle buttons ---------- */  AMOHA.initCircleButtons = function() {
    arr('[data-circle-btn]').forEach(btn => {
      const arcs = btn.querySelectorAll('[data-arc]');
      if (!arcs.length) return;
      const C = 2 * Math.PI * 103.5, a = .0417 * C;
      gsap.set(arcs, {
        strokeDasharray: a + ' ' + C
      });
      const tl = gsap.timeline({
        paused: true
      }).to(arcs, {
        strokeDasharray: C / 2 + ' ' + C,
        duration: D.m,
        ease: 'amohaInOut'
      });
      btn.addEventListener('mouseenter', () => tl.play());
      btn.addEventListener('mouseleave', () => tl.reverse());
    });
  };
  /* ---------- display links ---------- */  AMOHA.initLinkHover = function() {
    if (AMOHA.isMobile()) return;
    arr('[data-hover="link"]').forEach(link => {
      const texts = link.querySelectorAll('.link_label_text');
      if (texts.length < 2) return;
      const a = new SplitText(texts[0], {
        type: 'lines,words,chars',
        tag: 'span',
        linesClass: 'split-line',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        smartWrap: true
      });
      const b = new SplitText(texts[1], {
        type: 'words,chars',
        tag: 'span',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        smartWrap: true
      });
      const OUT = {
        opacity: 0,
        x: '0.4em',
        yPercent: -25,
        rotateY: -90
      };
      const AWAY = {
        opacity: 0,
        x: '-0.4em',
        yPercent: 25,
        rotateY: 90
      };
      const HOME = {
        opacity: 1,
        x: '0em',
        yPercent: 0,
        rotateY: 0
      };
      const lines = a.lines.map(l => {
        const s = document.createElement('span');
        s.className = 'link_line';
        l.appendChild(s);
        return s;
      });
      if (link.closest('.ui-nav')) {
        a.lines.forEach(l => {
          l.classList.add('t-dark');
          l.setAttribute('data-theme', '');
        });
        AMOHA.initThemes(a.lines);
      }
      gsap.set(lines, {
        scaleX: 1,
        transformOrigin: 'right center'
      });
      gsap.set(texts[1], {
        opacity: 1
      });
      gsap.set(b.chars, AWAY);
      const enter = () => {
        gsap.fromTo(a.chars, HOME, {
          ...OUT,
          duration: D.m,
          ease: 'amohaOut',
          stagger: D.stagger / 4,
          overwrite: true,
          force3D: true
        });
        gsap.fromTo(b.chars, AWAY, {
          ...HOME,
          duration: D.m,
          ease: 'amohaOut',
          delay: .2,
          stagger: D.stagger / 4,
          overwrite: true,
          force3D: true
        });
        gsap.fromTo(lines, {
          scaleX: 1,
          transformOrigin: 'right center'
        }, {
          scaleX: 0,
          duration: D.m,
          ease: 'amohaOut',
          stagger: D.stagger,
          overwrite: true
        });
      };
      const leave = () => {
        gsap.to(a.chars, {
          ...HOME,
          duration: D.m,
          ease: 'amohaOut',
          delay: .2,
          stagger: D.stagger / 4,
          overwrite: true,
          force3D: true
        });
        gsap.to(b.chars, {
          ...AWAY,
          duration: D.m,
          ease: 'amohaOut',
          stagger: D.stagger / 4,
          overwrite: true,
          force3D: true
        });
        gsap.to(lines, {
          scaleX: 1,
          transformOrigin: 'left center',
          duration: D.m,
          ease: 'amohaOut',
          stagger: D.stagger,
          overwrite: true
        });
      };
      link.addEventListener('mouseenter', enter);
      link.addEventListener('mouseleave', leave);
    });
  };
  /* ---------- nav items ---------- */  AMOHA.initNavHover = function() {
    if (AMOHA.isMobile()) return;
    const byX = total => (i, target, list) => {
      const xs = list.map(t => t.getBoundingClientRect().left);
      const min = Math.min(...xs), span = Math.max(...xs) - min || 1;
      return (xs[i] - min) / span * total;
    };
    arr('[data-hover="nav"]').forEach(item => {
      const texts = item.querySelectorAll('.nav-item_label_text');
      if (texts.length < 2) return;
      const a = new SplitText(texts[0], {
        type: 'words,chars',
        tag: 'span',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        smartWrap: true,
        mask: 'words'
      });
      const b = new SplitText(texts[1], {
        type: 'words,chars',
        tag: 'span',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        smartWrap: true,
        mask: 'words'
      });
      gsap.set(texts[1], {
        opacity: 1
      });
      gsap.set(b.chars, {
        yPercent: 100,
        opacity: 0
      });
      item.addEventListener('mouseenter', () => {
        gsap.fromTo(a.chars, {
          opacity: 1,
          yPercent: 0
        }, {
          opacity: 0,
          yPercent: -100,
          duration: D.m,
          ease: 'amohaEase',
          stagger: byX(2 * D.stagger),
          overwrite: true,
          force3D: true
        });
        gsap.fromTo(b.chars, {
          yPercent: 100,
          opacity: 0
        }, {
          opacity: 1,
          yPercent: 0,
          duration: D.m,
          ease: 'amohaEase',
          stagger: byX(2 * D.stagger),
          overwrite: true,
          force3D: true
        });
      });
      item.addEventListener('mouseleave', () => {
        gsap.to(a.chars, {
          opacity: 1,
          yPercent: 0,
          duration: D.m,
          ease: 'amohaEase',
          stagger: byX(2 * D.stagger),
          overwrite: true,
          force3D: true
        });
        gsap.to(b.chars, {
          opacity: 0,
          yPercent: 100,
          duration: D.m,
          ease: 'amohaEase',
          stagger: byX(2 * D.stagger),
          overwrite: true,
          force3D: true
        });
      });
    });
  };
  /* ---------- modals ---------- */  AMOHA.initModals = function() {
    const uis = arr('[data-theme]');
    const modals = {};
    arr('[data-modal]').forEach(m => {
      modals[m.dataset.modal] = m;
      gsap.set(m, {
        display: 'none'
      });
    });
    const state = {};
    const open = name => {
      const m = modals[name];
      if (!m || state[name]) return;
      state[name] = true;
      const box = m.querySelector('[data-modal-box]'), over = m.querySelector('[data-modal-over]');
      gsap.set([ m, over ], {
        display: 'block'
      });
      gsap.fromTo(over, {
        opacity: 0
      }, {
        opacity: 1,
        duration: D.l,
        ease: 'amohaOut',
        overwrite: true
      });
      if (name === 'menu') {
        uis.forEach(u => {
          if (!u.classList.contains('t-dark')) {
            u.classList.add('t-dark');
            u.dataset.modalThemed = '1';
          }
        });
        document.querySelectorAll('.btn-menu_label').forEach(l => l.classList.toggle('is-active'));
        document.querySelectorAll('.btn-menu').forEach(b => b.classList.add('is-open'));
        const q = s => m.querySelectorAll(s);
        AMOHA.animA(q('[data-part="a"]'), 'initial');
        AMOHA.animH(q('[data-part="h"]'), 'initial');
        AMOHA.animP(q('[data-part="p"]'), 'initial');
        AMOHA.animCtn(q('[data-part="ctn"]'), 'initial');
        AMOHA.animA(q('[data-part="a"]'), 'reveal');
        AMOHA.animH(q('[data-part="h"]'), 'reveal');
        AMOHA.animP(q('[data-part="p"]'), 'reveal');
        AMOHA.animCtn(q('[data-part="ctn"]'), 'reveal');
      } else {
        gsap.set(box, {
          transformPerspective: 1e3
        });
        gsap.fromTo(box, {
          scale: 0,
          rotateX: -90,
          yPercent: -100,
          rotate: -25
        }, {
          scale: 1,
          rotateX: 0,
          yPercent: 0,
          rotate: 0,
          duration: D.l,
          ease: 'amohaOut',
          overwrite: true
        });
        const q = s => m.querySelectorAll(s);
        AMOHA.animA(q('[data-part="a"]'), 'initial');
        AMOHA.animH(q('[data-part="h"]'), 'initial');
        AMOHA.animP(q('[data-part="p"]'), 'initial');
        AMOHA.animA(q('[data-part="a"]'), 'reveal', D.m);
        AMOHA.animH(q('[data-part="h"]'), 'reveal', D.m);
        AMOHA.animP(q('[data-part="p"]'), 'reveal', D.m);
        const first = m.querySelector('input');
        if (first && matchMedia('(pointer: fine)').matches) setTimeout(() => first.focus({
          preventScroll: true
        }), 900);
      }
      AMOHA.lockScroll();
    };
    const close = name => {
      const m = modals[name];
      if (!m || !state[name]) return;
      state[name] = false;
      const box = m.querySelector('[data-modal-box]'), over = m.querySelector('[data-modal-over]');
      gsap.to(over, {
        opacity: 0,
        duration: D.m,
        ease: 'amohaIn',
        overwrite: true
      });
      if (name === 'menu') {
        uis.forEach(u => {
          if (u.dataset.modalThemed) {
            u.classList.remove('t-dark');
            delete u.dataset.modalThemed;
          }
        });
        document.querySelectorAll('.btn-menu_label').forEach(l => l.classList.toggle('is-active'));
        document.querySelectorAll('.btn-menu').forEach(b => b.classList.remove('is-open'));
        const q = s => m.querySelectorAll(s);
        AMOHA.animA(q('[data-part="a"]'), 'hide');
        AMOHA.animH(q('[data-part="h"]'), 'hide');
        AMOHA.animP(q('[data-part="p"]'), 'hide');
        AMOHA.animCtn(q('[data-part="ctn"]'), 'hide');
        gsap.delayedCall(D.m, () => gsap.set([ m, over ], {
          display: 'none'
        }));
      } else {
        gsap.to(box, {
          scale: 1,
          rotateX: 90,
          yPercent: 200,
          rotate: 25,
          duration: D.m,
          ease: 'amohaIn',
          overwrite: true,
          onComplete: () => gsap.set([ m, over ], {
            display: 'none'
          })
        });
      }
      if (!Object.keys(state).some(k => state[k])) AMOHA.unlockScroll();
    };
    AMOHA.openModal = open;
    AMOHA.closeModal = close;
    arr('[data-modal-open]').forEach(btn => btn.addEventListener('click', e => {
      e.preventDefault();
      const name = btn.dataset.modalOpen;
      if (name === 'menu' && state.menu) {
        close('menu');
        return;
      }
      open(name);
    }));
    arr('[data-modal-close]').forEach(btn => btn.addEventListener('click', e => {
      const m = btn.closest('[data-modal]');
      const name = btn.dataset.modalClose || m && m.dataset.modal;
      if (name && state[name]) {
        e.preventDefault();
        close(name);
      }
    }));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') Object.keys(state).forEach(n => state[n] && close(n));
    });
  };
  /* ---------- enquiry form ---------- */  AMOHA.initForm = function() {
    arr('[data-form]').forEach(form => form.addEventListener('submit', e => {
      e.preventDefault();
      const required = form.querySelectorAll('[required]');
      let ok = true;
      required.forEach(f => {
        const bad = !f.value.trim() || f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value);
        f.style.borderBottomColor = bad ? 'var(--c-error)' : '';
        if (bad) ok = false;
      });
      if (!ok) return;
      const success = form.parentElement.querySelector('[data-form-success]');
      if (success) {
        success.classList.add('is-on');
        gsap.fromTo(success, {
          opacity: 0
        }, {
          opacity: 1,
          duration: D.m,
          ease: 'amohaOut'
        });
      }
    }));
  };
  /* ---------- fit text ---------- */  AMOHA.fitText = function(el) {
    if (!el.offsetParent) return;
    const grow = el.dataset.fitText === 'grow';
    el.style.fontSize = '';
    el.style.whiteSpace = 'nowrap';
    for (let pass = 0; pass < 4; pass++) {
      el.style.width = 'max-content';
      const target = el.parentElement.clientWidth, w = el.offsetWidth, fs = parseFloat(getComputedStyle(el).fontSize);
      el.style.width = '';
      if (!w || !target) return;
      const ratio = target / w;
      if (ratio >= 1 && !grow) return;
      if (Math.abs(ratio - 1) < .004) return;
      el.style.fontSize = fs * ratio + 'px';
    }
  };
  AMOHA.initFitText = function() {
    const all = () => arr('[data-fit-text]').forEach(AMOHA.fitText);
    all();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);
    let t;
    addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        runs = new WeakMap;
        all();
        ScrollTrigger.refresh();
      }, 80);
    });
    if (!window.ResizeObserver) return;
    let seen = new WeakMap, runs = new WeakMap, busy = false;
    const ro = new ResizeObserver(entries => {
      if (busy) return;
      let did = false;
      entries.forEach(e => {
        const w = Math.round(e.contentRect.width);
        if (!w || seen.get(e.target) === w) return;
        const n = (runs.get(e.target) || 0) + 1;
        if (n > 8) return;
        seen.set(e.target, w);
        runs.set(e.target, n);
        did = true;
        arr(e.target.querySelectorAll('[data-fit-text]')).forEach(AMOHA.fitText);
      });
      if (!did) return;
      busy = true;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        busy = false;
      }));
    });
    arr('[data-fit-text]').forEach(el => {
      if (el.parentElement) ro.observe(el.parentElement);
    });
  };
  /* ---------- clouds ---------- */  AMOHA.initClouds = function() {
    const filter = document.getElementById('cloudf');
    if (!filter) return;
    const cache = {};
    arr('svg.cloud').forEach(svg => {
      const use = svg.querySelector('use');
      const id = use ? (use.getAttribute('href') || '').slice(1) : '';
      const sym = id && document.getElementById(id);
      if (!sym) return;
      const vb = sym.getAttribute('viewBox'), dims = vb.split(/\s+/).map(Number), vw = dims[2], vh = dims[3];
      const img = document.createElement('img');
      img.className = 'cloud';
      img.alt = '';
      img.width = vw;
      img.height = vh;
      img.decoding = 'async';
      svg.replaceWith(img);
      if (!cache[id]) cache[id] = new Promise(resolve => {
        const xml = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" width="' + vw + '" height="' + vh + '"><defs>' + filter.outerHTML + '</defs>' + sym.innerHTML + '</svg>';
        const url = URL.createObjectURL(new Blob([ xml ], {
          type: 'image/svg+xml'
        }));
        const src = new Image;
        src.onload = () => {
          const c = document.createElement('canvas');
          c.width = vw;
          c.height = vh;
          c.getContext('2d').drawImage(src, 0, 0);
          URL.revokeObjectURL(url);
          resolve(c.toDataURL('image/png'));
        };
        src.onerror = () => resolve(url);
        src.src = url;
      });
      cache[id].then(url => {
        img.src = url;
      });
    });
  };
  /* ---------- flower breeze ---------- */  AMOHA.initFlowers = function() {
    if (AMOHA.reduced || AMOHA.windActive || AMOHA.lite) return;
    const sway = (img, i) => {
      const r = gsap.utils.random, wrap = img.closest('.flower') || img;
      gsap.set(img, {
        transformOrigin: '50% 0%'
      });
      const tw = gsap.to(img, {
        rotation: r(1.4, 2.6) * (i % 2 ? 1 : -1),
        y: r(-8, 8),
        scale: 1.015,
        duration: r(4.5, 7),
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: r(0, 2.5),
        paused: true
      });
      new IntersectionObserver(es => {
        if (es[es.length - 1].isIntersecting) tw.resume(); else tw.pause();
      }, {
        rootMargin: '20%'
      }).observe(wrap);
    };
    arr('.flower img').forEach((img, i) => {
      const wrap = img.closest('.flower');
      if (wrap && wrap.classList.contains('is-video')) {
        wrap.addEventListener('flower:fallback', () => {
          if (!AMOHA.stillFlowers) sway(img, i);
        }, {
          once: true
        });
        return;
      }
      sway(img, i);
    });
  };
  /* ---------- small utilities ---------- */  AMOHA.initRouteArt = function() {
    const svg = document.querySelector('[data-route] svg');
    if (!svg || !window.fetch) return;
    const load = src => fetch(src).then(r => r.ok ? r.text() : Promise.reject(r.status)).then(txt => (new DOMParser).parseFromString(txt, 'image/svg+xml'));
    const src = svg.getAttribute('data-route-src'), lsrc = svg.getAttribute('data-route-labels-src');
    src && load(src).then(doc => {
      const path = doc.querySelector('path'), line = svg.querySelector('[data-route-line]');
      if (!path || !line) return;
      line.setAttribute('d', path.getAttribute('d'));
      line.classList.add('is-art');
    }).catch(() => {});
    lsrc && load(lsrc).then(doc => {
      const g = svg.querySelector('[data-route-labels]');
      if (!g) return;
      Array.from(doc.documentElement.children).forEach(n => g.appendChild(document.importNode(n, true)));
      svg.classList.add('has-labels');
    }).catch(() => {});
  };
  AMOHA.initMisc = function() {
    document.querySelectorAll('[data-year]').forEach(y => {
      y.textContent = (new Date).getFullYear();
    });
    arr('[data-tab-trigger], .other-card__name, .pag_prev, .pag_next, [data-modal-open]').forEach(el => {
      if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.querySelector('a, button')) return;
      el.setAttribute('role', 'button');
      if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
    });
    arr('a[href^="#"]:not([data-modal-open]):not([data-tab-trigger]):not([data-cookies])').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) {
        e.preventDefault();
        return;
      }
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      AMOHA.scrollTo(target, {
        duration: 2,
        easing: gsap.parseEase('amohaInOut')
      });
    }));
  };
})(window.AMOHA);
